#!/usr/bin/env node
/**
 * Install @gabewillen/self skills + per-adapter scripts/hooks.
 *
 * Modes:
 *   live (default)  Clone/update a living git checkout and symlink each skill
 *                   into agent skill dirs. Edits are real repo files — commit/push.
 *   copy            Snapshot-copy skills (immutable install; no shared git tree)
 *
 * Living checkout default: ~/.agents/repos/self
 * Override: SELF_LIVE_ROOT, --live-root <path>
 * Repo URL: SELF_REPO_URL (default github.com/gabewillen/self.git)
 *
 * Usage:
 *   node scripts/install.mjs
 *   node scripts/install.mjs --live
 *   node scripts/install.mjs --copy
 *   node scripts/install.mjs --live-root ~/src/agents
 *   node scripts/install.mjs --target ~/.agents/skills
 *   node scripts/install.mjs --local        (agent state in <repo>/.agents)
 *   node scripts/install.mjs --no-instructions  (skip the router directive)
 *   node scripts/install.mjs --dry-run
 *   node scripts/install.mjs --no-adapters
 *   node scripts/install.mjs --pull
 *   node scripts/install.mjs --verify-only   (md5 check installed copies; no write)
 *   SELF_INSTALL=0 npm i
 *   SELF_MODE=copy npm i
 *
 * Live branch (default): install creates/checks out a long-lived working branch
 * (live/<user>-<host>, override SELF_LIVE_BRANCH) that tracks origin's
 * default branch for sync. Push that branch and open a PR for global skill
 * changes; do not push straight to main. Set SELF_LIVE_BRANCH=0 to skip.
 *
 * Integrity: after every install (and on --verify-only), md5 every managed
 * script under the live/source skills root and require byte-identical md5 at
 * every agent skill root, harness hook command path, agent-home script, and
 * managed git post-commit hook. Mismatch fails the install so stale copies
 * cannot go green.
 */
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
  chmodSync,
  realpathSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, join, resolve, delimiter, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, hostname, userInfo } from "node:os";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const DEFAULT_REPO_URL = "https://github.com/gabewillen/self.git";
const DEFAULT_LIVE_ROOT = join(homedir(), ".agents", "repos", "self");
// mdscript-exec / mdscript-write are owned by the mdscript repo, not this one,
// but every skill here executes through them — so install them alongside.
const MDSCRIPT_REPO_URL = "https://github.com/gabewillen/mdscript.git";
const DEFAULT_MDSCRIPT_ROOT = join(homedir(), ".agents", "repos", "gabewillen-mdscript");

/**
 * Env lookup: preferred SELF_<NAME>, then transitional SELF_<NAME>,
 * then GABE_<NAME> / GABE_AGENTS_<NAME> legacy aliases.
 */
function envSelf(name) {
  const keys = [
    `SELF_${name}`,
    `SELF_${name}`,
    `GABE_${name}`,
    `GABE_AGENTS_${name}`,
  ];
  for (const k of keys) {
    const v = process.env[k];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function envSelfTruthy(name) {
  const v = envSelf(name);
  return v === "1" || v === "true";
}

function envSelfFalsey(name) {
  const v = envSelf(name);
  return v === "0" || v === "false";
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noAdapters = args.includes("--no-adapters");
const doPull = args.includes("--pull");
const targetIdx = args.indexOf("--target");
const explicitTarget = targetIdx >= 0 ? resolve(args[targetIdx + 1]) : null;
const liveRootIdx = args.indexOf("--live-root");
const explicitLiveRoot = liveRootIdx >= 0 ? resolve(args[liveRootIdx + 1]) : null;
const mdscriptRootIdx = args.indexOf("--mdscript-root");
const explicitMdscriptRoot =
  mdscriptRootIdx >= 0 ? resolve(args[mdscriptRootIdx + 1]) : null;
// Agent state (goals, tasks, comments, ledgers, run dirs) lives under
// ~/.agents by default. --local puts it beside the project instead.
const localState = args.includes("--local") || envSelfTruthy("LOCAL");
const skipInstructions =
  args.includes("--no-instructions") || envSelfFalsey("INSTRUCTIONS");
const skipMdscript =
  args.includes("--no-mdscript") || envSelfFalsey("MDSCRIPT");
const verifyOnly = args.includes("--verify-only") || envSelfTruthy("VERIFY_ONLY");

const modeEnv = (envSelf("MODE") || "").toLowerCase();
const mode = args.includes("--copy") || modeEnv === "copy"
  ? "copy"
  : args.includes("--live") || modeEnv === "live" || modeEnv === "" || modeEnv === "symlink"
    ? "live"
    : "live";

if (envSelfFalsey("INSTALL")) {
  console.log("[self] skip install (SELF_INSTALL=0)");
  process.exit(0);
}

function sh(cmd, argv, opts = {}) {
  return execFileSync(cmd, argv, {
    encoding: "utf8",
    stdio: opts.stdio || ["ignore", "pipe", "pipe"],
    cwd: opts.cwd,
  });
}

function trySh(cmd, argv, opts = {}) {
  try {
    return { ok: true, out: sh(cmd, argv, opts) };
  } catch (err) {
    return {
      ok: false,
      out: String(err?.stdout || ""),
      err: String(err?.stderr || err?.message || err),
    };
  }
}

function listSkillDirs(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => existsSync(join(root, name, "SKILL.md")))
    .sort();
}

/**
 * Non-skill packs: shared MDScripts/hooks (self-common) and routed MDScripts
 * (self-voice, self-troubleshoot). Installed like skills but not discoverable
 * as agent skills.
 */
const SHARED_PACKS = ["self-common", "self-voice", "self-troubleshoot"];

function listSharedPackDirs(root) {
  if (!existsSync(root)) return [];
  return SHARED_PACKS.filter((name) => {
    const dir = join(root, name);
    if (!existsSync(dir)) return false;
    // Never treat a SKILL.md pack as "shared only" if someone re-adds one.
    if (existsSync(join(dir, "SKILL.md"))) return false;
    return (
      existsSync(join(dir, "workflows")) ||
      existsSync(join(dir, "hooks")) ||
      existsSync(join(dir, "adapters")) ||
      existsSync(join(dir, `${name}.mdscript.md`))
    );
  }).sort();
}

function listInstallUnits(root) {
  return [...new Set([...listSkillDirs(root), ...listSharedPackDirs(root)])].sort();
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function isGitRepo(dir) {
  return existsSync(join(dir, ".git"));
}

function gitTopLevel(dir) {
  const r = trySh("git", ["-C", dir, "rev-parse", "--show-toplevel"]);
  if (!r.ok) return null;
  return r.out.trim();
}

function chmodTreeExecutables(root) {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = join(cur, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) {
        const looksExec =
          ent.name.endsWith(".sh") ||
          ent.name === "review-snapshot" ||
          (!ent.name.includes(".") &&
            !ent.name.endsWith(".ts") &&
            !ent.name.endsWith(".json") &&
            !ent.name.endsWith(".md") &&
            !ent.name.endsWith(".mdscript.md") &&
            !ent.name.endsWith(".yaml") &&
            !ent.name.endsWith(".yml"));
        if (looksExec) {
          try {
            chmodSync(p, 0o755);
          } catch {
            // ignore
          }
        }
      }
    }
  }
}

/**
 * Remove a managed install, including a symlink whose target is gone.
 *
 * rmSync stats through a symlink, so on a dangling one it sees ENOENT and
 * force:true swallows it — the link survives and the next symlinkSync fails
 * EEXIST. Every skill this pack stops shipping leaves exactly that behind, so
 * unlink symlinks directly instead of asking rmSync to.
 */
function removePath(path) {
  if (isSymlink(path)) {
    unlinkSync(path);
    return;
  }
  if (!existsSync(path)) return;
  rmSync(path, { recursive: true, force: true });
}

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Prefer the package checkout when it is already a git work tree of this project.
 * Else use SELF_LIVE_ROOT / --live-root / default clone path.
 */
function resolveLiveRoot() {
  if (explicitLiveRoot) return explicitLiveRoot;
  const liveRootEnv = envSelf("LIVE_ROOT");
  if (liveRootEnv) return resolve(liveRootEnv);

  const pkgGit = gitTopLevel(pkgRoot);
  if (pkgGit) {
    // If this package is already a clone (dev or git dep), live there.
    const hasSkills = existsSync(join(pkgGit, "skills"));
    if (hasSkills) return pkgGit;
  }
  return DEFAULT_LIVE_ROOT;
}

function sanitizeBranchPart(s) {
  return String(s || "local")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "local";
}

/** Working branch for live skill edits (not main). */
function resolveLiveBranchName() {
  const raw = envSelf("LIVE_BRANCH");
  if (raw === "0" || raw === "false" || raw === "off") return null;
  if (raw && raw.trim()) return raw.trim();
  let user = "local";
  try {
    user = userInfo().username || process.env.USER || process.env.LOGNAME || "local";
  } catch {
    user = process.env.USER || process.env.LOGNAME || "local";
  }
  const host = sanitizeBranchPart(hostname().split(".")[0] || "host");
  return `live/${sanitizeBranchPart(user)}-${host}`;
}

function originDefaultBranch(liveRoot) {
  const sym = trySh("git", [
    "-C",
    liveRoot,
    "symbolic-ref",
    "refs/remotes/origin/HEAD",
  ]);
  if (sym.ok) {
    const m = /refs\/remotes\/origin\/(.+)/.exec(sym.out.trim());
    if (m) return m[1];
  }
  for (const name of ["main", "master"]) {
    const r = trySh("git", ["-C", liveRoot, "rev-parse", "--verify", `origin/${name}`]);
    if (r.ok) return name;
  }
  return "main";
}

function gitIsDirty(root) {
  const r = trySh("git", ["-C", root, "status", "--porcelain"]);
  return r.ok && r.out.trim().length > 0;
}

/**
 * Stash local dirty state so checkout/merge can proceed; pop after.
 * Mirrors git pull --autostash for our fetch + checkout + merge sequence.
 */
function withAutoStash(root, label, fn) {
  const dirty = gitIsDirty(root);
  let stashed = false;
  if (dirty) {
    const msg = `self-agents autostash: ${label}`;
    const stash = trySh("git", [
      "-C",
      root,
      "stash",
      "push",
      "--include-untracked",
      "-m",
      msg,
    ]);
    if (stash.ok) {
      stashed = true;
      console.log(`[self-agents] autostash: stashed dirty tree for ${label}`);
    } else {
      console.warn(
        `[self-agents] autostash push failed (continuing dirty): ${stash.err || stash.out}`,
      );
    }
  }
  try {
    return fn();
  } finally {
    if (stashed) {
      const pop = trySh("git", ["-C", root, "stash", "pop"]);
      if (!pop.ok) {
        console.warn(
          `[self-agents] autostash pop failed (your changes are in stash; run git stash list): ${pop.err || pop.out}`,
        );
      } else {
        console.log(`[self-agents] autostash: restored dirty tree`);
      }
    }
  }
}

/**
 * Create or check out a long-lived live/* branch and sync it with origin/<base>.
 * Global skill edits land here; open a PR into origin/<base> (do not push main).
 * Dirty trees use stash push/pop around checkout and merge (like --autostash).
 */
function ensureLiveWorkingBranch(liveRoot, opts = {}) {
  const branch = resolveLiveBranchName();
  if (!branch) {
    return { branch: null, base: null, action: "skipped" };
  }
  if (!isGitRepo(liveRoot) && !gitTopLevel(liveRoot)) {
    return { branch: null, base: null, action: "not-git" };
  }
  const root = gitTopLevel(liveRoot) || liveRoot;

  if (dryRun) {
    console.log(`[dry-run] ensure live working branch ${branch} in ${root}`);
    return { branch, base: "main", action: "dry-run" };
  }

  // Ensure origin remote points somewhere fetchable when missing.
  const remotes = trySh("git", ["-C", root, "remote"]);
  if (remotes.ok && !remotes.out.split("\n").map((s) => s.trim()).includes("origin")) {
    const url =
      envSelf("REPO_URL") ||
      process.env.npm_package_repository_url?.replace(/^git\+/, "") ||
      DEFAULT_REPO_URL;
    trySh("git", ["-C", root, "remote", "add", "origin", url]);
  }

  const fetch = trySh("git", ["-C", root, "fetch", "origin", "--prune"]);
  if (!fetch.ok) {
    console.warn(
      `[self-agents] git fetch origin failed (continuing offline): ${fetch.err || fetch.out}`,
    );
  }

  const base = originDefaultBranch(root);

  return withAutoStash(root, `live-branch ${branch}`, () => {
    const current = trySh("git", ["-C", root, "branch", "--show-current"]);
    const currentBranch = current.ok ? current.out.trim() : "";
    // Remember where the tree stood. Switching to the live branch must never
    // leave the checkout at content that no longer contains this commit —
    // a stale live/* branch would silently relocate the tree to old files and
    // report the newer skills as missing.
    const startSha = trySh("git", ["-C", root, "rev-parse", "HEAD"]).ok
      ? trySh("git", ["-C", root, "rev-parse", "HEAD"]).out.trim()
      : "";

    const localExists = trySh("git", [
      "-C",
      root,
      "show-ref",
      "--verify",
      "--quiet",
      `refs/heads/${branch}`,
    ]).ok;
    const remoteExists = trySh("git", [
      "-C",
      root,
      "show-ref",
      "--verify",
      "--quiet",
      `refs/remotes/origin/${branch}`,
    ]).ok;

    let action = "reuse";
    if (currentBranch !== branch) {
      if (localExists) {
        const co = trySh("git", ["-C", root, "checkout", branch]);
        if (!co.ok) {
          console.warn(`[self-agents] checkout ${branch} failed: ${co.err}`);
          return { branch: currentBranch || null, base, action: "checkout-failed" };
        }
        action = "checkout";
      } else if (remoteExists) {
        const co = trySh("git", [
          "-C",
          root,
          "checkout",
          "-B",
          branch,
          `origin/${branch}`,
        ]);
        if (!co.ok) {
          console.warn(`[self-agents] checkout origin/${branch} failed: ${co.err}`);
          return { branch: currentBranch || null, base, action: "checkout-failed" };
        }
        action = "checkout-remote";
      } else {
        const start =
          trySh("git", ["-C", root, "rev-parse", "--verify", `origin/${base}`]).ok
            ? `origin/${base}`
            : trySh("git", ["-C", root, "rev-parse", "--verify", base]).ok
              ? base
              : "HEAD";
        const co = trySh("git", ["-C", root, "checkout", "-b", branch, start]);
        if (!co.ok) {
          console.warn(`[self-agents] create branch ${branch} failed: ${co.err}`);
          return { branch: currentBranch || null, base, action: "create-failed" };
        }
        action = "create";
        console.log(
          `[self-agents] created live working branch ${branch} from ${start}`,
        );
      }
    }

    // Track origin/<base> for "what to sync from"; push target is origin/<branch>.
    trySh("git", ["-C", root, "config", `branch.${branch}.merge`, `refs/heads/${base}`]);
    trySh("git", ["-C", root, "config", `branch.${branch}.remote`, "origin"]);

    // Always sync with origin/<base>. Checking out a live/* branch without
    // syncing is what leaves the tree on stale content: the branch may be many
    // commits behind, and the install then reports current skills as missing.
    // --pull only controls whether the sync is announced in full.
    const verbose = doPull || envSelfTruthy("PULL") || opts.sync;
    if (verbose) {
      console.log(
        `[self-agents] sync ${branch} with origin/${base} (merge --ff-only, then merge)`,
      );
    }
    let sync = trySh("git", ["-C", root, "merge", "--ff-only", `origin/${base}`]);
    if (!sync.ok) {
      sync = trySh("git", ["-C", root, "merge", "--no-edit", `origin/${base}`]);
      if (!sync.ok) {
        console.warn(
          `[self-agents] merge origin/${base} into ${branch} failed (resolve manually): ${sync.err}`,
        );
      } else if (verbose) {
        console.log(`[self-agents] merged origin/${base} into ${branch}`);
      }
    } else if (verbose) {
      console.log(`[self-agents] fast-forwarded ${branch} to origin/${base}`);
    }

    // Fail closed: if the commit we started on is not reachable from the live
    // branch, this switch would hide work that was present a moment ago. Go
    // back and let the caller install from where they were.
    if (startSha && currentBranch && currentBranch !== branch) {
      const contained = trySh("git", [
        "-C",
        root,
        "merge-base",
        "--is-ancestor",
        startSha,
        "HEAD",
      ]).ok;
      if (!contained) {
        const back = trySh("git", ["-C", root, "checkout", currentBranch]);
        console.warn(
          `[self-agents] live branch ${branch} does not contain ${currentBranch} (${startSha.slice(0, 7)}); staying on ${currentBranch} so the install does not run against stale content`,
        );
        console.warn(
          `[self-agents] merge ${currentBranch} into ${branch}, or set SELF_LIVE_BRANCH=0, then re-run`,
        );
        if (!back.ok) {
          console.warn(`[self-agents] could not return to ${currentBranch}: ${back.err}`);
        }
        return { branch: currentBranch, base, action: "kept-current", root };
      }
    }

    console.log(
      `[self-agents] live branch: ${branch} (sync from origin/${base}; push this branch + open PR for global skill changes)`,
    );
    return { branch, base, action, root };
  });
}

/**
 * Install managed git hooks into the live checkout so agents only need to commit.
 * post-commit on live/*: push + open/update PR into origin default branch.
 */
function installLiveGitHooks(liveRoot) {
  const root = gitTopLevel(liveRoot) || liveRoot;
  if (!isGitRepo(root) && !gitTopLevel(root)) return null;
  const hooksDir = join(root, ".git", "hooks");
  // worktree: .git may be a file
  let realHooks = hooksDir;
  const gitPath = join(root, ".git");
  try {
    if (existsSync(gitPath) && !statSync(gitPath).isDirectory()) {
      const text = readFileSync(gitPath, "utf8").trim();
      const m = /^gitdir:\s*(.+)$/m.exec(text);
      if (m) realHooks = join(resolve(root, m[1].trim()), "hooks");
    }
  } catch {
    // keep default
  }
  ensureDir(realHooks);
  const src = join(pkgRoot, "scripts", "git-hooks", "post-commit");
  const dest = join(realHooks, "post-commit");
  if (!existsSync(src)) {
    console.warn(`[self-agents] missing hook source ${src}`);
    return null;
  }
  if (dryRun) {
    console.log(`[dry-run] install post-commit hook -> ${dest}`);
    return dest;
  }
  let existing = "";
  try {
    if (existsSync(dest)) existing = readFileSync(dest, "utf8");
  } catch {
    existing = "";
  }
  // Do not clobber an unrelated project hook unless we already own it.
  if (existing && !existing.includes("self-agents:post-commit")) {
    console.warn(
      `[self-agents] leave existing post-commit hook in place (not self-managed): ${dest}`,
    );
    return null;
  }
  const body = readFileSync(src, "utf8");
  writeFileSync(dest, body, { mode: 0o755 });
  try {
    chmodSync(dest, 0o755);
  } catch {
    // ignore
  }
  console.log(`[self-agents] installed post-commit hook (live/* → push + PR): ${dest}`);
  return dest;
}

function ensureLiveCheckout(liveRoot) {
  const repoUrl =
    envSelf("REPO_URL") ||
    process.env.npm_package_repository_url?.replace(/^git\+/, "") ||
    DEFAULT_REPO_URL;

  if (dryRun) {
    console.log(`[dry-run] ensure live checkout at ${liveRoot} from ${repoUrl}`);
    const branchMeta = ensureLiveWorkingBranch(liveRoot);
    return {
      liveRoot,
      repoUrl,
      action: existsSync(liveRoot) ? "exists" : "clone",
      ...branchMeta,
    };
  }

  ensureDir(dirname(liveRoot));

  if (existsSync(liveRoot) && isGitRepo(liveRoot)) {
    const branchMeta = ensureLiveWorkingBranch(liveRoot, {
      sync: doPull || envSelfTruthy("PULL"),
    });
    installLiveGitHooks(liveRoot);
    return { liveRoot, repoUrl, action: "reuse", ...branchMeta };
  }

  if (existsSync(liveRoot) && !isGitRepo(liveRoot)) {
    // If live root is the package itself without .git detection failure, still use it
    if (resolve(liveRoot) === resolve(pkgRoot) && existsSync(join(liveRoot, "skills"))) {
      return { liveRoot, repoUrl, action: "pkg-root" };
    }
    throw new Error(
      `live root exists but is not a git repo: ${liveRoot}\n` +
        `Remove it or pass --live-root <git-checkout>`,
    );
  }

  // Clone fresh
  console.log(`[self-agents] cloning ${repoUrl} -> ${liveRoot}`);
  sh("git", ["clone", repoUrl, liveRoot], { stdio: ["ignore", "inherit", "inherit"] });
  const branchMeta = ensureLiveWorkingBranch(liveRoot, { sync: false });
  installLiveGitHooks(liveRoot);
  return { liveRoot, repoUrl, action: "clone", ...branchMeta };
}

/**
 * Ensure a checkout of the mdscript repo and return its skills root.
 * Never fatal: the pack still installs if this repo is unreachable, so an
 * offline install degrades to "mdscript skills not refreshed" instead of
 * failing outright.
 */
function ensureMdscriptSkillsRoot() {
  if (skipMdscript) return null;
  const mdscriptRootEnv =
    envSelf("MDSCRIPT_ROOT");
  const root =
    explicitMdscriptRoot ||
    (mdscriptRootEnv ? resolve(mdscriptRootEnv) : DEFAULT_MDSCRIPT_ROOT);
  const repoUrl =
    envSelf("MDSCRIPT_REPO_URL") ||
    MDSCRIPT_REPO_URL;
  const skillsRoot = join(root, "skills");

  if (dryRun) {
    console.log(
      `[dry-run] ensure mdscript checkout at ${root} from ${repoUrl}`,
    );
    return existsSync(skillsRoot) ? skillsRoot : null;
  }

  if (existsSync(root) && isGitRepo(root)) {
    if (doPull || envSelfTruthy("PULL")) {
      const r = trySh("git", ["-C", root, "pull", "--ff-only"]);
      if (!r.ok) {
        console.warn(`[self-agents] mdscript pull failed (using local tree)`);
      }
    }
  } else if (existsSync(root)) {
    console.warn(
      `[self-agents] mdscript root exists but is not a git repo: ${root}`,
    );
  } else {
    ensureDir(dirname(root));
    console.log(`[self-agents] cloning ${repoUrl} -> ${root}`);
    const r = trySh("git", ["clone", "--depth", "1", repoUrl, root]);
    if (!r.ok) {
      console.warn(
        `[self-agents] could not clone mdscript (${repoUrl}); ` +
          `mdscript-exec/mdscript-write not installed. ` +
          `Install them manually or re-run with network access.`,
      );
      return null;
    }
  }

  if (!existsSync(skillsRoot)) {
    console.warn(`[self-agents] no skills/ directory in ${root}`);
    return null;
  }
  return skillsRoot;
}

function skillsRootForMode(liveRoot) {
  if (mode === "live") return join(liveRoot, "skills");
  return join(pkgRoot, "skills");
}

function installSkillCopy(src, dest) {
  if (dryRun) {
    console.log(`[dry-run] copy ${src} -> ${dest}`);
    return;
  }
  removePath(dest);
  cpSync(src, dest, { recursive: true });
  chmodTreeExecutables(dest);
}

/**
 * A directory we installed by copy carries a SKILL.md or the pack's own entry
 * MDScript. Anything else under a claimed name predates us and is not ours.
 */
function isManagedSkillDir(dest) {
  const name = basename(dest);
  return (
    existsSync(join(dest, "SKILL.md")) ||
    existsSync(join(dest, `${name}.mdscript.md`)) ||
    existsSync(join(dest, "workflows")) ||
    existsSync(join(dest, "hooks"))
  );
}

function installSkillSymlink(src, dest) {
  const absSrc = resolve(src);
  if (dryRun) {
    console.log(`[dry-run] symlink ${dest} -> ${absSrc}`);
    return;
  }
  ensureDir(dirname(dest));
  if (existsSync(dest) || isSymlink(dest)) {
    // A real directory we did not create is the user's, even when it sits under
    // a name this pack now claims. Move it aside instead of deleting it.
    if (!isSymlink(dest) && statSync(dest).isDirectory() && !isManagedSkillDir(dest)) {
      const aside = `${dest}.pre-self`;
      removePath(aside);
      renameSync(dest, aside);
      console.error(
        `[self-agents] KEPT your existing ${dest} as ${aside} before linking this pack's version`,
      );
    } else {
      // Replace previous managed install (dir or symlink)
      removePath(dest);
    }
  }
  // Relative symlink when possible for portability inside home. The path used
  // to create the link may contain an alias (macOS /var -> /private/var), so
  // validate the candidate from the destination's canonical parent first.
  let linkTarget = absSrc;
  try {
    const destParent = dirname(dest);
    const relativeTarget = relative(destParent, absSrc) || absSrc;
    const resolvedFromDestParent = resolve(
      realpathSync(destParent),
      relativeTarget,
    );
    if (resolvedFromDestParent === absSrc) {
      linkTarget = relativeTarget;
    }
  } catch {
    linkTarget = absSrc;
  }
  symlinkSync(linkTarget, dest);
}

/**
 * Required nested assets for skills that are more than SKILL.md.
 * Missing lane/rules files leave self-review "installed" but unable to select
 * engineering or language lanes.
 */
const REQUIRED_SKILL_ASSETS = {
  self: ["SKILL.md", "references/boundaries.md"],
  "self-review": [
    "SKILL.md",
    "workflows/select-review-lanes.md",
    "workflows/select-language-framework-lanes.md",
    "workflows/triple-adversarial-blind-review.mdscript.md",
    "workflows/neutral-review-packet.md",
    "workflows/blind-reviewers/rules.mdscript.md",
    "workflows/blind-reviewers/mdscript.mdscript.md",
    "workflows/blind-reviewers/security.mdscript.md",
    "workflows/blind-reviewers/completeness.mdscript.md",
    "workflows/blind-reviewers/hsm.mdscript.md",
    "workflows/blind-reviewers/engineering-rules.mdscript.md",
    "references/lane-catalog.md",
    "references/engineering-rules/SOURCE.md",
    // engineering rule packs (vendored from gabewillen/rules)
    "references/engineering-rules/core.rules.md",
    "references/engineering-rules/dbc.rules.md",
    "references/engineering-rules/patterns.rules.md",
    "references/engineering-rules/rust.rules.md",
    "references/engineering-rules/python.rules.md",
    "references/engineering-rules/typescript.rules.md",
    "references/engineering-rules/go.rules.md",
    "references/engineering-rules/cpp.rules.md",
    "references/engineering-rules/dart.rules.md",
    "references/engineering-rules/react.rules.md",
    "references/engineering-rules/flutter.rules.md",
    "references/engineering-rules/hono.rules.md",
    "references/engineering-rules/pulumi.rules.md",
    "references/engineering-rules/webcomponents.rules.md",
    "references/engineering-rules/xstate.rules.md",
    "references/engineering-rules/sml.rules.md",
    "references/engineering-rules/hsm.rules.md",
    // thin lane entrypoints
    "workflows/blind-reviewers/eng-core.mdscript.md",
    "workflows/blind-reviewers/eng-dbc.mdscript.md",
    "workflows/blind-reviewers/eng-patterns.mdscript.md",
    "workflows/blind-reviewers/eng-rust.mdscript.md",
    "workflows/blind-reviewers/eng-python.mdscript.md",
    "workflows/blind-reviewers/eng-typescript.mdscript.md",
    "workflows/blind-reviewers/eng-go.mdscript.md",
    "workflows/blind-reviewers/eng-cpp.mdscript.md",
    "workflows/blind-reviewers/eng-dart.mdscript.md",
    "workflows/blind-reviewers/eng-react.mdscript.md",
    "workflows/blind-reviewers/eng-flutter.mdscript.md",
    "workflows/blind-reviewers/eng-hono.mdscript.md",
    "workflows/blind-reviewers/eng-pulumi.mdscript.md",
    "workflows/blind-reviewers/eng-webcomponents.mdscript.md",
    "workflows/blind-reviewers/eng-xstate.mdscript.md",
    "workflows/blind-reviewers/eng-sml.mdscript.md",
    "workflows/blind-reviewers/eng-hsm.mdscript.md",
// HSM pack (folded into self-review; not a top-level skill)
    "hsm/hsm.mdscript.md",
    "hsm/references/anti-patterns.md",
    "hsm/references/bindings.md",
    "hsm/references/check-patterns.md",
    "hsm/references/hsm-core-rules.md",
    "hsm/references/source-notes.md",
    "hsm/workflows/audit-actor-boundary.mdscript.md",
    "hsm/workflows/audit-control-flow.mdscript.md",
    "hsm/workflows/audit-hierarchy.mdscript.md",
    "hsm/workflows/audit-ownership.mdscript.md",
    "hsm/workflows/audit-reachability.mdscript.md",
    "hsm/workflows/audit-structure.mdscript.md",
    "hsm/workflows/audit-tests.mdscript.md",
    "hsm/workflows/audit-time-determinism.mdscript.md",
    "hsm/workflows/emit-findings.mdscript.md",
    "hsm/workflows/extract-model.mdscript.md",
    "hsm/workflows/request-waiver.mdscript.md",
    "hsm/workflows/triage.mdscript.md",
    "hsm/workflows/verify-findings.mdscript.md",
  ],
  "self-implement": [
    "SKILL.md",
    "workflows/select-implementation-rules.md",
    "workflows/select-language-framework-rules.md",
    "workflows/apply-selected-engineering-rules.md",
    "workflows/engineering-rules/apply-engineering-rules.mdscript.md",
    "workflows/engineering-rules/impl-core.mdscript.md",
    "workflows/engineering-rules/impl-dbc.mdscript.md",
    "references/implementation-rules-catalog.md",
  ],
  "self-watch": [
    "SKILL.md",
    "assets/self-watch-ticker.sh",
    "hooks/self-lib.ts",
    "hooks/watch-stop.ts",
    "hooks/watch-session-start.ts",
    "adapters/cursor/hooks.json",
  ],
  "self-learn": ["SKILL.md"],
  // Shared packs (not agent skills — no SKILL.md).
  "self-common": [
    "workflows/goal-mdscript.md",
    "workflows/return-script.md",
    "workflows/model-reasoning-contract.md",
    "workflows/file-task-comments.md",
    "workflows/update-living-skills.md",
    "workflows/load-operating-context.md",
    "hooks/self-lib.ts",
    "adapters/claude/hooks.json",
    "adapters/cursor/hooks.json",
    "adapters/codex/hooks.json",
    "adapters/grok/hooks.json",
  ],
  "self-voice": [
    "self-voice.mdscript.md",
    "workflows/durable-voice-rule.md",
    "workflows/slack-style.md",
    "workflows/mention-watch-run.md",
    "references/slack-samples.md",
  ],
  "self-troubleshoot": [
    "self-troubleshoot.mdscript.md",
    "workflows/reproduce-red-test.md",
    "workflows/choose-environment.md",
    "workflows/root-cause-analysis.md",
    "workflows/apply-fix-and-rerun.md",
  ],
};

/**
 * After install, every managed destination must have the nested files each
 * skill needs at runtime. Symlinks to a complete live root pass; partial copy
 * installs or a stale live checkout fail hard so postinstall cannot go green.
 */
function reportMissingSkillAssets(targetRoots, managedSkills) {
  const missing = [];
  for (const root of targetRoots) {
    for (const skill of managedSkills) {
      const required = REQUIRED_SKILL_ASSETS[skill];
      if (!required) continue;
      const skillDir = join(root, skill);
      if (!existsSync(skillDir) && !isSymlink(skillDir)) {
        missing.push(`${skillDir} (skill not installed)`);
        continue;
      }
      for (const rel of required) {
        const p = join(skillDir, rel);
        if (!existsSync(p)) missing.push(p);
      }
    }
  }
  if (!missing.length) return [];
  console.error(
    `[self-agents] BROKEN: ${missing.length} required skill asset(s) missing after install:`,
  );
  for (const m of missing.slice(0, 40)) console.error(`    - ${m}`);
  if (missing.length > 40) {
    console.error(`    … and ${missing.length - 40} more`);
  }
  console.error(
    "[self-agents] re-run from a checkout that contains the multi-lane self-review tree, or use --copy from this package",
  );
  return missing;
}

/**
 * A skill directory with no readable SKILL.md is a broken install: the entry
 * exists so tools list it, but it has no body. Report every one, including
 * stale entries left by a previous run whose source has since moved.
 */
function reportBrokenSkillDirs(targetRoots, managedSkills) {
  const broken = [];
  for (const root of targetRoots) {
    if (!existsSync(root)) continue;
    let entries = [];
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      const dest = join(root, name);
      // Shared packs (SHARED_PACKS) intentionally have no SKILL.md, but a
      // dangling link named after one is still broken — only the SKILL.md
      // requirement is waived, not the check that the entry resolves.
      if (SHARED_PACKS.includes(name)) {
        if (isSymlink(dest) && !existsSync(dest)) {
          broken.push(`${dest} (dangling symlink -> ${readlinkSync(dest)})`);
        }
        continue;
      }
      // Check every symlinked entry (we are the ones that symlink) plus any
      // skill this run manages. A resolvable link to a body-less directory is
      // just as broken as a dangling one.
      const link = isSymlink(dest);
      if (!link && !managedSkills.includes(name)) continue;
      if (existsSync(join(dest, "SKILL.md"))) continue;
      const dangling = link && !existsSync(dest);
      broken.push(
        dangling
          ? `${dest} (dangling symlink -> ${readlinkSync(dest)})`
          : link
            ? `${dest} (symlink -> ${readlinkSync(dest)}, no SKILL.md)`
            : `${dest} (no SKILL.md)`,
      );
    }
  }
  if (!broken.length) return;
  console.error(
    `[self-agents] BROKEN: ${broken.length} skill dir(s) have no readable SKILL.md:`,
  );
  for (const b of broken) console.error(`    - ${b}`);
  console.error(
    "[self-agents] a symlinked skill needs its live root present on THIS machine; re-run install after fixing the source",
  );
  return broken;
}

/** File names / extensions treated as scripts for md5 integrity. */
const SCRIPT_NAME_RE = /\.(ts|tsx|js|mjs|cjs|sh)$/i;
const SCRIPT_BASENAMES = new Set(["post-commit", "pre-commit", "post-merge", "review-snapshot"]);
const INTEGRITY_SKIP_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".DS_Store",
  "__pycache__",
  ".install-receipt.json",
]);

function isScriptPath(name) {
  if (SCRIPT_BASENAMES.has(name)) return true;
  return SCRIPT_NAME_RE.test(name);
}

function md5File(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

function safeRealpath(path) {
  try {
    if (existsSync(path)) return realpathSync(path);
  } catch {
    // fall through
  }
  return path;
}

/**
 * Walk a directory tree and return relative paths of every regular file.
 * Symlinks to files are followed for content hashing; symlink dirs are entered.
 */
function walkFiles(root, { scriptsOnly = false } = {}) {
  const out = [];
  if (!existsSync(root) && !isSymlink(root)) return out;
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const abs = rel ? join(root, rel) : root;
    let entries;
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (INTEGRITY_SKIP_DIR_NAMES.has(ent.name)) continue;
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = join(root, childRel);
      let isDir = ent.isDirectory();
      let isFile = ent.isFile();
      if (ent.isSymbolicLink()) {
        try {
          const st = statSync(childAbs);
          isDir = st.isDirectory();
          isFile = st.isFile();
        } catch {
          continue;
        }
      }
      if (isDir) {
        stack.push(childRel);
        continue;
      }
      if (!isFile) continue;
      if (scriptsOnly && !isScriptPath(ent.name)) continue;
      out.push(childRel.replace(/\\/g, "/"));
    }
  }
  return out.sort();
}

/**
 * Source-of-truth md5 map for every managed skill script under skillsRoot.
 * Keys: "<skill>/<relpath>" → md5 hex.
 */
function buildSourceScriptManifest(skillsRoot, managedSkills) {
  const files = {};
  for (const skill of managedSkills) {
    const skillDir = join(skillsRoot, skill);
    if (!existsSync(skillDir) && !isSymlink(skillDir)) continue;
    for (const rel of walkFiles(skillDir, { scriptsOnly: true })) {
      const abs = join(skillDir, rel);
      try {
        files[`${skill}/${rel}`] = md5File(abs);
      } catch (err) {
        files[`${skill}/${rel}`] = `ERROR:${err?.message || err}`;
      }
    }
  }
  return files;
}

/**
 * Compare every source script against every install destination.
 * Stale = missing at dest, unreadable, or md5 differs from source.
 */
function reportStaleInstalledScripts(targetRoots, managedSkills, skillsRoot, sourceManifest) {
  const stale = [];
  for (const root of targetRoots) {
    for (const skill of managedSkills) {
      const srcDir = join(skillsRoot, skill);
      const destDir = join(root, skill);
      const keys = Object.keys(sourceManifest).filter((k) => k.startsWith(`${skill}/`));
      if (!keys.length) continue;
      if (!existsSync(destDir) && !isSymlink(destDir)) {
        stale.push({
          kind: "missing-skill",
          skill,
          dest: destDir,
          source: srcDir,
          detail: "skill not installed at destination",
        });
        continue;
      }
      for (const key of keys) {
        const rel = key.slice(skill.length + 1);
        const expected = sourceManifest[key];
        const dest = join(destDir, rel);
        if (!existsSync(dest)) {
          stale.push({
            kind: "missing",
            skill,
            rel,
            dest,
            source: join(srcDir, rel),
            expected_md5: expected,
            detail: "script missing at destination",
          });
          continue;
        }
        let actual;
        try {
          actual = md5File(dest);
        } catch (err) {
          stale.push({
            kind: "unreadable",
            skill,
            rel,
            dest,
            source: join(srcDir, rel),
            expected_md5: expected,
            detail: String(err?.message || err),
          });
          continue;
        }
        if (actual !== expected) {
          stale.push({
            kind: "md5-mismatch",
            skill,
            rel,
            dest: safeRealpath(dest),
            source: safeRealpath(join(srcDir, rel)),
            expected_md5: expected,
            actual_md5: actual,
            detail: "destination content differs from source",
          });
        }
      }
    }
  }
  return stale;
}

/**
 * agent-home.mjs is installed next to each skills root (…/scripts/agent-home.mjs).
 */
function reportStaleAgentHomeScripts(targetRoots, skillsRoot) {
  const src = join(dirname(skillsRoot), "scripts", "agent-home.mjs");
  const stale = [];
  if (!existsSync(src)) return stale;
  let expected;
  try {
    expected = md5File(src);
  } catch (err) {
    stale.push({
      kind: "unreadable-source",
      dest: src,
      source: src,
      detail: String(err?.message || err),
    });
    return stale;
  }
  for (const root of targetRoots) {
    const dest = join(dirname(root), "scripts", "agent-home.mjs");
    if (!existsSync(dest)) {
      stale.push({
        kind: "missing",
        rel: "scripts/agent-home.mjs",
        dest,
        source: src,
        expected_md5: expected,
        detail: "agent-home.mjs missing beside skills root",
      });
      continue;
    }
    let actual;
    try {
      actual = md5File(dest);
    } catch (err) {
      stale.push({
        kind: "unreadable",
        dest,
        source: src,
        expected_md5: expected,
        detail: String(err?.message || err),
      });
      continue;
    }
    if (actual !== expected) {
      stale.push({
        kind: "md5-mismatch",
        rel: "scripts/agent-home.mjs",
        dest: safeRealpath(dest),
        source: safeRealpath(src),
        expected_md5: expected,
        actual_md5: actual,
        detail: "agent-home.mjs content differs from source",
      });
    }
  }
  return stale;
}

/**
 * Managed git post-commit hook must match scripts/git-hooks/post-commit when present.
 */
function reportStaleGitPostCommit(liveRoot) {
  const stale = [];
  const src = join(pkgRoot, "scripts", "git-hooks", "post-commit");
  if (!existsSync(src) || !liveRoot) return stale;
  let expected;
  try {
    expected = md5File(src);
  } catch {
    return stale;
  }
  const root = gitTopLevel(liveRoot) || liveRoot;
  let realHooks = join(root, ".git", "hooks");
  const gitPath = join(root, ".git");
  try {
    if (existsSync(gitPath) && !statSync(gitPath).isDirectory()) {
      const text = readFileSync(gitPath, "utf8").trim();
      const m = /^gitdir:\s*(.+)$/m.exec(text);
      if (m) realHooks = join(resolve(root, m[1].trim()), "hooks");
    }
  } catch {
    // keep default
  }
  const dest = join(realHooks, "post-commit");
  if (!existsSync(dest)) return stale;
  let body = "";
  try {
    body = readFileSync(dest, "utf8");
  } catch {
    return stale;
  }
  // Only enforce when we own the hook.
  if (!body.includes("self-agents:post-commit")) return stale;
  const actual = createHash("md5").update(body).digest("hex");
  if (actual !== expected) {
    stale.push({
      kind: "md5-mismatch",
      rel: "scripts/git-hooks/post-commit",
      dest,
      source: src,
      expected_md5: expected,
      actual_md5: actual,
      detail: "managed git post-commit differs from source",
    });
  }
  return stale;
}

/**
 * Extract absolute script paths from harness hook command strings
 * (`bun /abs/path/to/script.ts` or `node /abs/path`).
 */
function extractScriptPathFromHookCommand(command) {
  if (!command || typeof command !== "string") return null;
  const parts = command.trim().split(/\s+/);
  if (parts.length < 2) return null;
  // last token that looks like a path to a script
  for (let i = parts.length - 1; i >= 1; i--) {
    const tok = parts[i];
    if (tok.startsWith("/") || tok.startsWith("~")) {
      return tok.replace(/^~(?=\/|$)/, homedir());
    }
  }
  return null;
}

/**
 * Collect managed hook config files written by installAdapters.
 */
function listHarnessHookConfigPaths() {
  const home = homedir();
  const paths = [
    join(home, ".cursor", "hooks.json"),
    join(home, ".claude", "settings.json"),
    join(home, ".codex", "hooks.json"),
  ];
  const grokHooksDir = join(home, ".grok", "hooks");
  if (existsSync(grokHooksDir)) {
    try {
      for (const name of readdirSync(grokHooksDir)) {
        if (name.endsWith(".json")) paths.push(join(grokHooksDir, name));
      }
    } catch {
      // ignore
    }
  }
  return paths.filter((p) => existsSync(p));
}

/**
 * Every hook command that points at a managed skill script must md5-match the
 * source file. Catches "install rewrote skills but left old absolute paths"
 * and "two trees with the same basename but different content".
 */
function reportStaleHookCommandScripts(managedSkills, skillsRoot, sourceManifest) {
  const stale = [];
  const skillSet = new Set(managedSkills);
  for (const configPath of listHarnessHookConfigPaths()) {
    const cfg = readJson(configPath, null);
    if (!cfg) continue;
    const commands = [];
    // Cursor: hooks.<event>[] = { command }
    // Nested: hooks.<Event>[].hooks[] = { command }
    const hooks = cfg.hooks && typeof cfg.hooks === "object" ? cfg.hooks : {};
    for (const entries of Object.values(hooks)) {
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        if (entry?.command) commands.push(entry.command);
        if (Array.isArray(entry?.hooks)) {
          for (const h of entry.hooks) {
            if (h?.command) commands.push(h.command);
          }
        }
      }
    }
    for (const command of commands) {
      const scriptPath = extractScriptPathFromHookCommand(command);
      if (!scriptPath) continue;
      // Only check scripts under a managed skill (…/skills/<skill>/…).
      const norm = scriptPath.replace(/\\/g, "/");
      const m = /\/skills\/([^/]+)\/(.+)$/.exec(norm);
      if (!m) continue;
      const skill = m[1];
      const rel = m[2];
      if (!skillSet.has(skill)) continue;
      if (!isScriptPath(basename(rel))) continue;
      const key = `${skill}/${rel}`;
      const expected = sourceManifest[key];
      if (!expected) {
        // Command points at a path under a managed skill that is not in the
        // source tree (moved/renamed script still referenced).
        stale.push({
          kind: "hook-unknown-script",
          skill,
          rel,
          dest: scriptPath,
          config: configPath,
          command,
          detail: "hook command path not present in source skill scripts",
        });
        continue;
      }
      if (!existsSync(scriptPath)) {
        stale.push({
          kind: "hook-missing",
          skill,
          rel,
          dest: scriptPath,
          config: configPath,
          expected_md5: expected,
          command,
          detail: "hook command path does not exist",
        });
        continue;
      }
      let actual;
      try {
        actual = md5File(scriptPath);
      } catch (err) {
        stale.push({
          kind: "hook-unreadable",
          skill,
          rel,
          dest: scriptPath,
          config: configPath,
          expected_md5: expected,
          detail: String(err?.message || err),
        });
        continue;
      }
      if (actual !== expected) {
        stale.push({
          kind: "hook-md5-mismatch",
          skill,
          rel,
          dest: safeRealpath(scriptPath),
          source: safeRealpath(join(skillsRoot, skill, rel)),
          config: configPath,
          expected_md5: expected,
          actual_md5: actual,
          command,
          detail: "hook command script content differs from source",
        });
      }
    }
  }
  return stale;
}

function printStaleReport(stale) {
  if (!stale.length) return;
  console.error(
    `[self-agents] STALE: ${stale.length} script integrity failure(s) (md5 / missing):`,
  );
  for (const s of stale.slice(0, 50)) {
    const where = s.dest || s.config || "?";
    const hash =
      s.expected_md5 && s.actual_md5
        ? ` expected=${s.expected_md5} actual=${s.actual_md5}`
        : s.expected_md5
          ? ` expected=${s.expected_md5}`
          : "";
    console.error(`    - [${s.kind}] ${where}${hash}`);
    if (s.detail) console.error(`        ${s.detail}`);
    if (s.source && s.source !== s.dest) console.error(`        source: ${s.source}`);
  }
  if (stale.length > 50) {
    console.error(`    … and ${stale.length - 50} more`);
  }
  console.error(
    "[self-agents] re-run: node scripts/install.mjs --live   (or --copy) to refresh destinations and hook paths",
  );
}

/**
 * Full integrity pass: source md5 map + every install target + harness hooks +
 * agent-home + managed git hook. Returns { sourceManifest, stale, ok }.
 */
function verifyScriptIntegrity({
  skillsRoot,
  managedSkills,
  targetRoots,
  liveRoot = null,
}) {
  const sourceManifest = buildSourceScriptManifest(skillsRoot, managedSkills);
  const scriptCount = Object.keys(sourceManifest).length;
  const stale = [
    ...reportStaleInstalledScripts(targetRoots, managedSkills, skillsRoot, sourceManifest),
    ...reportStaleAgentHomeScripts(targetRoots, skillsRoot),
    ...reportStaleHookCommandScripts(managedSkills, skillsRoot, sourceManifest),
    ...reportStaleGitPostCommit(liveRoot),
  ];
  if (stale.length) printStaleReport(stale);
  else {
    console.log(
      `[self-agents] script integrity ok (${scriptCount} source script(s), md5 match across ${targetRoots.length} skill root(s) + harness hooks)`,
    );
  }
  return { sourceManifest, stale, ok: stale.length === 0, scriptCount };
}

function writeIntegrityReceipt(integrity, extra = {}) {
  const markerPath = join(homedir(), ".agents", "self-agents-integrity.json");
  const body = {
    verified_at: new Date().toISOString(),
    ok: integrity.ok,
    script_count: integrity.scriptCount,
    source_scripts: integrity.sourceManifest,
    stale: integrity.stale,
    ...extra,
  };
  try {
    ensureDir(dirname(markerPath));
    writeFileSync(markerPath, JSON.stringify(body, null, 2) + "\n");
  } catch {
    // ignore when home is not writable
  }
  return markerPath;
}

const ROUTER_DIRECTIVE =
  "- ALWAYS enter through the `self` router skill. Run it first on every request, before " +
  "planning or answering, and let it choose the role: any parentless main agent is a root " +
  "orchestrator (self-orchestrate); subagents are self-implement (or a single blind-lane " +
  "MDScript); explicit routes include self-watch, self-goal, self-automate, self-learn, " +
  "self-troubleshoot (red repro, root cause, fix, rerun), self-voice, and self-unwatch; " +
  "HSM is a self-review lane.";
const ROUTER_BLOCK_PLACEHOLDER = "\u0000self-agents-router\u0000";
const ROUTER_BLOCK_START = "<!-- self-agents:router -->";
const ROUTER_BLOCK_END = "<!-- /self-agents:router -->";
/**
 * Every directive line this pack has shipped, verbatim. Removal is exact-match
 * only: a line the user edited is not on this list, so it is kept and reported
 * rather than silently rewritten away.
 */
const SHIPPED_DIRECTIVES = [
  "- ALWAYS enter through the `gabe` router skill. Run it first on every request, before planning or answering, and let it choose the role: any parentless main agent is a root orchestrator (gabe-orchestrate); subagents are gabe-implement (or a single blind-lane MDScript); explicit routes cover gabe-watch, gabe-goal, and gabe-automate; HSM is a gabe-review lane.",
  "- ALWAYS enter through the `gabe` router skill. Run it first on every request, before planning or answering, and let it choose the role: any parentless main agent is a root orchestrator (gabe-orchestrate); subagents are gabe-implement (or a single blind-lane MDScript); explicit routes cover gabe-watch, gabe-goal, gabe-automate, and gabe-learn (MDScript only); HSM is a gabe-review lane.",
  "- ALWAYS enter through the `gabe` router skill. Run it first on every request, before planning or answering, and let it choose the role: any parentless main agent is a root orchestrator (gabe-orchestrate); subagents are gabe-implement (or a single blind-lane MDScript); explicit routes cover gabe-watch, gabe-goal, gabe-hsm-review, and gabe-automate.",
  "- ALWAYS enter through the `gabe` router skill. Run it first on every request, before planning or answering, and let it choose the role: it routes to gabe-orchestrate, gabe-implement, gabe-review, gabe-watch, gabe-goal, gabe-hsm-review, and gabe-automate.",
  "- ALWAYS enter through the `self` router skill. Run it first on every request, before planning or answering, and let it choose the role: any parentless main agent is a root orchestrator (self-orchestrate); subagents are self-implement (or a single blind-lane MDScript); explicit routes cover self-watch, self-goal, self-automate, and self-learn (MDScript only); HSM is a self-review lane.",
  "- ALWAYS enter through the `self` router skill. Run it first on every request, before planning or answering, and let it choose the role: any parentless main agent is a root orchestrator (self-orchestrate); subagents are self-implement (or a single blind-lane MDScript); explicit routes cover self-watch, self-goal, self-automate, and self-learn; HSM is a self-review lane.",
  "- ALWAYS use the `gabe` router skill for Gabe-shaped work: judgment, delegation, prioritization, review, implementation, coordination, MR/PR watching, and goal loops. It routes to gabe-orchestrate, gabe-implement, gabe-review, gabe-watch, and gabe-goal.",
  "- NEVER decide for yourself that a request is too small, too conversational, or not \"Gabe-shaped\" to route. Routing is the router's call, not yours.",
];
const normalizeDirective = (line) =>
  line.replace(/^\s*[-*]\s*/, "").replace(/\s+/g, " ").trim();
// The directive being installed counts as shipped: a duplicate managed block
// holding it must be collapsible, not treated as user text.
const SHIPPED_DIRECTIVE_SET = new Set(
  [...SHIPPED_DIRECTIVES, ROUTER_DIRECTIVE].map(normalizeDirective),
);
const isShippedDirective = (line) =>
  SHIPPED_DIRECTIVE_SET.has(normalizeDirective(line));
const LEGACY_BLOCK_MARKERS = [
  ["<!-- gabe-agents:router -->", "<!-- /gabe-agents:router -->"],
  ["<!-- self:instructions -->", "<!-- /self:instructions -->"],
  ["<!-- self:router -->", "<!-- /self:router -->"],
];

/**
 * Global instruction files, by agent home. ~/.agents/AGENTS.md is ours and is
 * always ensured; the rest are only touched when that agent is installed.
 */
const INSTRUCTION_TARGETS = [
  { dir: ".agents", file: "AGENTS.md", always: true },
  { dir: ".claude", file: "CLAUDE.md" },
  { dir: ".codex", file: "AGENTS.md" },
  { dir: ".cursor", file: "AGENTS.md" },
  { dir: ".gemini", file: "GEMINI.md" },
  { dir: ".kimi", file: "KIMI.md" },
  { dir: ".qwen", file: "QWEN.md" },
  { dir: ".copilot", file: "copilot-instructions.md" },
];

function rewriteInstructionBody(original, block) {
  const removed = [];
  const source = original.split(ROUTER_BLOCK_PLACEHOLDER).join("");
  // Pass 1: collapse managed blocks (outside fenced examples) to one placeholder.
  const pass1 = [];
  let inFence = false;
  let managedBlocks = 0;
  {
    const lines = source.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^(?: {4}|\t)/.test(line)) {
        // Indented code block: quoted markup, and it cannot open or close a fence.
        pass1.push(line);
        i += 1;
        continue;
      }
      if (/^ {0,3}(?:```|~~~)/.test(line)) {
        inFence = !inFence;
        pass1.push(line);
        i += 1;
        continue;
      }
      if (!inFence && isMarkerOnlyLine(line, ROUTER_BLOCK_START)) {
        const close = lines.findIndex((l, j) => j >= i && isMarkerOnlyLine(l, ROUTER_BLOCK_END));
        if (close < 0) {
          // Unclosed managed marker: leave the file's own text alone.
          pass1.push(line);
          i += 1;
          continue;
        }
        managedBlocks += 1;
        if (managedBlocks === 1) pass1.push(ROUTER_BLOCK_PLACEHOLDER);
        else removed.push("duplicate managed router block");
        i = close + 1;
        continue;
      }
      pass1.push(line);
      i += 1;
    }
  }
  // Pass 2: legacy marker spans and stale shipped directive lines.
  const out = [];
  inFence = false;
  {
    const lines = pass1;
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^(?: {4}|\t)/.test(line)) {
        out.push(line);
        i += 1;
        continue;
      }
      if (/^ {0,3}(?:```|~~~)/.test(line)) {
        inFence = !inFence;
        out.push(line);
        i += 1;
        continue;
      }
      if (inFence) {
        out.push(line);
        i += 1;
        continue;
      }
      const marker = LEGACY_BLOCK_MARKERS.find(([open]) => isMarkerOnlyLine(line, open));
      if (marker) {
        const close = lines.findIndex((l, j) => j >= i && isMarkerOnlyLine(l, marker[1]));
        if (close < 0) {
          out.push(line);
          i += 1;
          continue;
        }
        const span = lines.slice(i + 1, close);
        const hadPlaceholder = span.some((l) => l.includes(ROUTER_BLOCK_PLACEHOLDER));
        const kept = span.filter(
          (l) => !isShippedDirective(l) && !l.includes(ROUTER_BLOCK_PLACEHOLDER),
        );
        // Only our own markers are ignorable; a comment the user wrote is theirs.
        const isOurMarker = (l) =>
          isMarkerOnlyLine(l, ROUTER_BLOCK_START) ||
          isMarkerOnlyLine(l, ROUTER_BLOCK_END) ||
          LEGACY_BLOCK_MARKERS.some(
            ([open, close]) => isMarkerOnlyLine(l, open) || isMarkerOnlyLine(l, close),
          );
        const hasOwnText = kept.some((l) => l.trim() && !isOurMarker(l));
        if (hasOwnText) {
          // The user put something of their own inside our old markers: keep the
          // span and only drop the directive lines we shipped into it.
          out.push(marker[0], ...kept, marker[1]);
          for (const l of span) if (isShippedDirective(l)) removed.push(l.trim());
        } else {
          removed.push(`legacy router block ${marker[0]}`);
        }
        // The managed block always lands outside the retired markers.
        if (hadPlaceholder) out.push(ROUTER_BLOCK_PLACEHOLDER);
        i = close + 1;
        continue;
      }
      if (isShippedDirective(line)) {
        removed.push(line.trim());
        i += 1;
        continue;
      }
      out.push(line);
      i += 1;
    }
  }
  const tidy = (text) => {
    // Collapse blank runs only outside fenced and indented code: those blanks
    // are the user's content, not our formatting residue.
    let inFence = false;
    let blanks = 0;
    const kept = [];
    for (const line of text.split("\n")) {
      const indented = /^(?: {4}|\t)/.test(line);
      if (!indented && /^ {0,3}(?:```|~~~)/.test(line)) inFence = !inFence;
      if (!inFence && !indented && !line.trim()) {
        blanks += 1;
        if (blanks > 1) continue;
      } else {
        blanks = 0;
      }
      kept.push(line);
    }
    return kept.join("\n").replace(/^\n+/, "").replace(/\n*$/, "\n");
  };
  const body = out.join("\n");
  let next;
  if (body.includes(ROUTER_BLOCK_PLACEHOLDER)) {
    next = tidy(body.split(ROUTER_BLOCK_PLACEHOLDER).join(block));
  } else if (!body.trim()) {
    next = `# Global agent instructions\n\n${block}`;
  } else {
    next = `${tidy(body).replace(/\n*$/, "")}\n\n${block}`;
  }
  return { next, removed, hadManagedBlock: managedBlocks > 0 };
}

/** A marker we own is alone on its line; anything else on it is the user's. */
const isMarkerOnlyLine = (line, marker) =>
  line.includes(marker) && line.trim() === marker;

/**
 * Count only markers this rewriter would act on: alone on their line, outside
 * fenced and indented code. A quoted example in the user's file is not one.
 */
function countStructuralMarkers(text, marker) {
  let inFence = false;
  let n = 0;
  for (const line of text.split("\n")) {
    if (/^(?: {4}|\t)/.test(line)) continue;
    if (/^ {0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (isMarkerOnlyLine(line, marker)) n += 1;
  }
  return n;
}

/**
 * Lines the rewrite is allowed to move but never to lose: anything the user
 * wrote. Markers, shipped directive lines, and blanks are ours to rearrange.
 */
function protectedLines(text) {
  // Marker-ONLY lines are ours. A line that merely mentions a marker is the
  // user's, even inside the managed block, so it must survive the rewrite.
  const isOurs = (l) =>
    isMarkerOnlyLine(l, ROUTER_BLOCK_START) ||
    isMarkerOnlyLine(l, ROUTER_BLOCK_END) ||
    LEGACY_BLOCK_MARKERS.some(
      ([open, close]) => isMarkerOnlyLine(l, open) || isMarkerOnlyLine(l, close),
    );
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) => l && l !== ROUTER_BLOCK_PLACEHOLDER && !isShippedDirective(l) && !isOurs(l),
    );
}

/** Multiset compare: losing one of two identical user lines is still a loss. */
function missingLines(before, after) {
  const counts = new Map();
  for (const l of after) counts.set(l, (counts.get(l) || 0) + 1);
  const lost = [];
  for (const l of before) {
    const n = counts.get(l) || 0;
    if (n === 0) lost.push(l);
    else counts.set(l, n - 1);
  }
  return lost;
}

/**
 * A directive we could not remove exactly — hard-wrapped by a formatter, or
 * indented under a list item — still contradicts the managed block. Never
 * delete on a guess; report it so the user can resolve it.
 */
function findNearMissDirectives(text) {
  const hits = [];
  let inFence = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^(?: {4}|\t)/.test(line)) continue;
    if (/^ {0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!/ALWAYS (?:use|enter through) .{0,12}(?:gabe|self).{0,12} router skill/i.test(line)) {
      continue;
    }
    if (isShippedDirective(line)) continue;
    if (line.trim() === ROUTER_DIRECTIVE) continue;
    hits.push({ line: i + 1, text: line.trim() });
  }
  return hits;
}

function applyRouterDirective(existing, block) {
  const original = existing || "";
  const { next, removed, hadManagedBlock } = rewriteInstructionBody(original, block);
  // Whole-file safety net: whatever the parser did, no user line may vanish.
  const lost = missingLines(protectedLines(original), protectedLines(next));
  if (lost.length) {
    return {
      body: original,
      action: "refused",
      removed,
      reason:
        `rewrite would drop ${lost.length} user line(s); first: ${lost[0].slice(0, 80)}` +
        ` — check for a marker sharing a line with your text, an unclosed marker, or an unterminated code fence`,
    };
  }
  // Post-condition: exactly one managed block with the current directive in it.
  // Anything else means this rewrite would damage the file — leave it untouched.
  if (
    countStructuralMarkers(next, ROUTER_BLOCK_START) !== 1 ||
    countStructuralMarkers(next, ROUTER_BLOCK_END) !== 1 ||
    !next.includes(ROUTER_DIRECTIVE)
  ) {
    return {
      body: original,
      action: "refused",
      removed,
      reason: "router directive rewrite failed its own check",
    };
  }
  const nearMisses = findNearMissDirectives(next);
  if (next === original) return { body: original, action: "present", removed, nearMisses };
  if (!original.trim()) return { body: next, action: "created", removed, nearMisses };
  return { body: next, action: hadManagedBlock ? "updated" : "appended", removed, nearMisses };
}

function ensureRouterDirective() {
  const home = homedir();
  const report = [];
  const block = `${ROUTER_BLOCK_START}\n${ROUTER_DIRECTIVE}\n${ROUTER_BLOCK_END}\n`;
  for (const target of INSTRUCTION_TARGETS) {
    const dir = join(home, target.dir);
    if (!target.always && !existsSync(dir)) continue;
    const path = join(dir, target.file);
    const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
    const { body, action, removed, reason, nearMisses } = applyRouterDirective(existing, block);
    if (nearMisses && nearMisses.length) {
      console.error(
        `[self-agents] ${path}: ${nearMisses.length} line(s) still read like a router directive but do not match any wording this pack shipped — left in place, please resolve:`,
      );
      for (const n of nearMisses) {
        console.error(`    - line ${n.line}: ${n.text.slice(0, 120)}${n.text.length > 120 ? "…" : ""}`);
      }
    }
    if (action === "refused") {
      console.error(`[self-agents] SKIPPED ${path}: ${reason}`);
      report.push({ path, action });
      continue;
    }
    if (removed && removed.length) {
      console.log(
        `[self-agents] ${path}: replaced ${removed.length} stale router directive line(s)/block(s):`,
      );
      for (const r of removed) console.log(`    - ${r.slice(0, 120)}${r.length > 120 ? "…" : ""}`);
    }
    if (action === "present") {
      report.push({ path, action });
      continue;
    }
    if (dryRun) {
      report.push({ path, action });
      continue;
    }
    ensureDir(dir);
    writeFileSync(path, body, "utf8");
    report.push({ path, action });
  }
  return report;
}

/**
 * Put agent-home.mjs where the skills say it is.
 *
 * self-common tells agents to run `{{skills_root}}/../scripts/agent-home.mjs`.
 * Installed, {{skills_root}} is ~/.cursor/skills or similar, so the script has
 * to exist at ~/.cursor/scripts — it never did, only in the checkout. The
 * command failed, the agent fell back to deriving the slug by hand, and a
 * worktree run landed under the worktree's name while the hooks looked under
 * the main repository's. Nothing reported it: the stop hook finds no run and
 * exits clean, which is indistinguishable from a finished goal.
 */
function installAgentHomeScript(targetRoot, skillsRoot) {
  const src = join(dirname(skillsRoot), "scripts", "agent-home.mjs");
  if (!existsSync(src)) return null;
  const dest = join(dirname(targetRoot), "scripts", "agent-home.mjs");
  if (mode === "live") installSkillSymlink(src, dest);
  else installSkillCopy(src, dest);
  return dest;
}

/** Top-level skill dirs this pack used to ship and must uninstall. */
const RETIRED_SKILLS = [
  "self-hsm-review",
  "gabe",
  "gabe-automate",
  "gabe-common",
  "gabe-goal",
  "gabe-implement",
  "gabe-orchestrate",
  "gabe-review",
  "gabe-unwatch",
  "gabe-voice",
  "gabe-watch",
  "gabe-hsm-review",
  "gabe-learn",
];

/** Pre-rename skill id → self id (longest first). */
const GABE_TO_SELF_SKILL_RENAMES = [
  ["gabe-orchestrate", "self-orchestrate"],
  ["gabe-implement", "self-implement"],
  ["gabe-automate", "self-automate"],
  ["gabe-unwatch", "self-unwatch"],
  ["gabe-common", "self-common"],
  ["gabe-review", "self-review"],
  ["gabe-watch", "self-watch"],
  ["gabe-voice", "self-voice"],
  ["gabe-goal", "self-goal"],
  ["gabe-learn", "self-learn"],
  ["gabe-hsm-review", "self-hsm-review"],
  ["gabe-agents", "self-agents"],
];

function gabeTwinSkillName(selfSkill) {
  if (selfSkill === "self") return "gabe";
  if (selfSkill.startsWith("self-")) return `gabe-${selfSkill.slice("self-".length)}`;
  return null;
}

function removeRetiredSkills(targetRoot) {
  const removed = [];
  for (const skill of RETIRED_SKILLS) {
    const dest = join(targetRoot, skill);
    if (!existsSync(dest) && !isSymlink(dest)) continue;
    if (dryRun) {
      console.log(`[dry-run] remove retired skill ${dest}`);
      removed.push(dest);
      continue;
    }
    removePath(dest);
    removed.push(dest);
    console.log(`[self-agents] removed retired skill ${dest}`);
  }
  return removed;
}

function isGabePackHookCommand(command) {
  if (!command || typeof command !== "string") return false;
  // Paths under skills/gabe or skills/gabe-* (old install roots / absolute).
  if (/[/\\]skills[/\\]gabe([/\\-]|$)/.test(command)) return true;
  if (/skills\/gabe([/-]|$)/.test(command)) return true;
  // Absolute checkout paths that still point at renamed folders.
  if (/[/\\]skills[/\\]gabe-/.test(command)) return true;
  return false;
}

function isGabePackHookId(id) {
  if (!id) return false;
  const s = String(id);
  return (
    s.startsWith("gabe-") ||
    s.startsWith("gabe-agents:") ||
    s === "gabe-learn-stop" ||
    s === "gabe-learn-session-touch"
  );
}

function scrubLegacyMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return false;
  let changed = false;
  for (const namespace of ["self", "self-agents"]) {
    const entries = metadata[namespace];
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    for (const key of Object.keys(entries)) {
      if (key === "gabe" || key.startsWith("gabe-")) {
        delete entries[key];
        changed = true;
      }
    }
  }
  if (metadata["gabe-agents"]) {
    delete metadata["gabe-agents"];
    changed = true;
  }
  return changed;
}
/**
 * Strip pre-rename gabe pack hooks/metadata from a harness hook config.
 * Returns true when the file was modified.
 */
function scrubHookConfigFile(configPath, { cursorFlat = false } = {}) {
  if (!existsSync(configPath)) return false;
  const existing = readJson(configPath, null);
  if (!existing || typeof existing !== "object") return false;
  let changed = false;

  if (existing.metadata && typeof existing.metadata === "object") {
    changed = scrubLegacyMetadata(existing.metadata) || changed;
  }

  if (!existing.hooks || typeof existing.hooks !== "object") {
    if (changed && !dryRun) writeJson(configPath, existing);
    return changed;
  }

  if (cursorFlat) {
    for (const [eventName, entries] of Object.entries(existing.hooks)) {
      if (!Array.isArray(entries)) continue;
      const next = entries.filter((entry) => {
        if (isGabePackHookId(entry?.id)) {
          changed = true;
          return false;
        }
        if (isGabePackHookCommand(entry?.command)) {
          changed = true;
          return false;
        }
        return true;
      });
      if (next.length !== entries.length) existing.hooks[eventName] = next;
    }
  } else {
    for (const [eventName, groups] of Object.entries(existing.hooks)) {
      if (!Array.isArray(groups)) continue;
      const keptGroups = [];
      for (const group of groups) {
        const handlers = Array.isArray(group?.hooks) ? group.hooks : [];
        const survivors = handlers.filter((handler) => {
          if (isGabePackHookCommand(handler?.command)) {
            changed = true;
            return false;
          }
          return true;
        });
        if (survivors.length !== handlers.length) changed = true;
        if (survivors.length) keptGroups.push({ ...group, hooks: survivors });
      }
      if (keptGroups.length !== groups.length) changed = true;
      existing.hooks[eventName] = keptGroups;
    }
  }

  if (changed && !dryRun) writeJson(configPath, existing);
  else if (changed && dryRun) console.log(`[dry-run] scrub gabe hooks in ${configPath}`);
  return changed;
}

/**
 * Full gabe → self cutover on reinstall: markers, retired skills, hook files,
 * grok per-skill hook JSON, and instruction skill-id rewrites.
 */
function runGabeToSelfCutover(skillRoots) {
  const report = {
    retired_skills: [],
    markers: [],
    hook_files: [],
    grok_hook_files: [],
    instructions: [],
  };
  if (dryRun) {
    console.log("[dry-run] gabe→self cutover");
  }

  // 1) Retired skill dirs at every agent skill root.
  for (const root of skillRoots) {
    report.retired_skills.push(...removeRetiredSkills(root));
  }

  // 2) Old marker / integrity files under ~/.agents.
  const agentsHome = join(homedir(), ".agents");
  for (const name of [
    "gabe-agents-live.json",
    "gabe-agents-integrity.json",
    "gabe-agents-receipt.json",
  ]) {
    const p = join(agentsHome, name);
    if (!existsSync(p) && !isSymlink(p)) continue;
    if (dryRun) {
      console.log(`[dry-run] remove legacy marker ${p}`);
    } else {
      removePath(p);
      console.log(`[self-agents] removed legacy marker ${p}`);
    }
    report.markers.push(p);
  }

  // 3) Scrub shared hook configs (commands + metadata.gabe-agents).
  const home = homedir();
  const hookConfigs = [
    { path: join(home, ".cursor", "hooks.json"), cursorFlat: true },
    { path: join(home, ".claude", "settings.json"), cursorFlat: false },
    { path: join(home, ".claude", "settings.local.json"), cursorFlat: false },
    { path: join(home, ".codex", "hooks.json"), cursorFlat: false },
  ];
  for (const { path, cursorFlat } of hookConfigs) {
    if (scrubHookConfigFile(path, { cursorFlat })) {
      report.hook_files.push(path);
      if (!dryRun) console.log(`[self-agents] scrubbed legacy gabe hooks: ${path}`);
    }
  }

  // 4) Grok per-skill hook files: remove gabe-*.json entirely (self-*.json is the source).
  const grokHooksDir = join(home, ".grok", "hooks");
  if (existsSync(grokHooksDir)) {
    let names = [];
    try {
      names = readdirSync(grokHooksDir);
    } catch {
      names = [];
    }
    for (const name of names) {
      if (!/^gabe(-[a-z0-9-]+)?\.json$/i.test(name)) continue;
      const p = join(grokHooksDir, name);
      if (dryRun) {
        console.log(`[dry-run] remove legacy grok hook file ${p}`);
      } else {
        removePath(p);
        console.log(`[self-agents] removed legacy grok hook file ${p}`);
      }
      report.grok_hook_files.push(p);
    }
    // Also scrub any remaining shared files under .grok/hooks that are not gabe-named.
    for (const name of names) {
      if (!name.endsWith(".json") || name.startsWith("gabe")) continue;
      const p = join(grokHooksDir, name);
      if (scrubHookConfigFile(p, { cursorFlat: false })) {
        report.hook_files.push(p);
        if (!dryRun) console.log(`[self-agents] scrubbed legacy gabe hooks: ${p}`);
      }
    }
  }

  // 5) Instruction files: rename remaining gabe-* skill identifiers to self-*.
  for (const target of INSTRUCTION_TARGETS) {
    const path = join(home, target.dir, target.file);
    if (!existsSync(path)) continue;
    let text = "";
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    // Legacy router blocks are handled by the line-based rewrite in
    // ensureRouterDirective, which never deletes text the user put inside them.
    let next = text;
    // Protect identity handles/repos, then rename skill ids.
    next = next.replace(/gabewillen/g, "\0GW\0");
    next = next.replace(/@gabe\.willen/g, "\0HANDLE\0");
    next = next.replace(/Gabe Willen/g, "\0NAME\0");
    for (const [from, to] of GABE_TO_SELF_SKILL_RENAMES) {
      next = next.split(from).join(to);
    }
    // Standalone `gabe` router skill name in backticks or as a word after /
    next = next.replace(/`gabe`/g, "`self`");
    next = next.replace(/\/gabe\b/g, "/self");
    next = next.replace(/\0GW\0/g, "gabewillen");
    next = next.replace(/\0HANDLE\0/g, "@gabe.willen");
    next = next.replace(/\0NAME\0/g, "Gabe Willen");
    if (next !== text) {
      if (dryRun) {
        console.log(`[dry-run] rewrite skill ids in ${path}`);
      } else {
        writeFileSync(path, next, "utf8");
        console.log(`[self-agents] rewrote legacy gabe skill ids in ${path}`);
      }
      report.instructions.push(path);
    }
  }

  const total =
    report.retired_skills.length +
    report.markers.length +
    report.hook_files.length +
    report.grok_hook_files.length +
    report.instructions.length;
  if (total) {
    console.log(
      `[self-agents] gabe→self cutover: ${report.retired_skills.length} skill(s), ${report.markers.length} marker(s), ${report.hook_files.length} hook config(s), ${report.grok_hook_files.length} grok file(s), ${report.instructions.length} instruction file(s)`,
    );
  } else {
    console.log("[self-agents] gabe→self cutover: nothing dangling");
  }
  return report;
}

function installInto(targetRoot, units, skillsRoot) {
  ensureDir(targetRoot);
  installAgentHomeScript(targetRoot, skillsRoot);
  removeRetiredSkills(targetRoot);
  const installed = [];
  for (const unit of units) {
    const src = join(skillsRoot, unit);
    const dest = join(targetRoot, unit);
    const isShared = SHARED_PACKS.includes(unit);
    if (!existsSync(src)) {
      console.warn(`[self] skip missing pack source ${src}`);
      continue;
    }
    if (!isShared && !existsSync(join(src, "SKILL.md"))) {
      console.warn(`[self] skip missing skill source ${src}`);
      continue;
    }
    // Shared packs must not ship SKILL.md (they are not agent skills).
    if (isShared && existsSync(join(src, "SKILL.md"))) {
      console.warn(
        `[self] shared pack ${unit} has SKILL.md; remove it so it is not treated as a skill`,
      );
    }
    if (mode === "live") installSkillSymlink(src, dest);
    else installSkillCopy(src, dest);
    installed.push({ skill: unit, dest, src, mode, shared: isShared });
  }
  return installed;
}

function detectAgentSkillRoots() {
  const home = homedir();
  const candidates = [
    join(home, ".agents", "skills"),
    join(home, ".claude", "skills"),
    join(home, ".cursor", "skills"),
    join(home, ".codex", "skills"),
    join(home, ".grok", "skills"),
    join(home, ".copilot", "skills"),
    join(home, ".qwen", "skills"),
  ];
  const roots = [join(home, ".agents", "skills")];
  for (const c of candidates.slice(1)) {
    const agentHome = dirname(c);
    if (existsSync(agentHome)) roots.push(c);
  }
  return [...new Set(roots)];
}

function which(cmd) {
  const pathEnv = process.env.PATH || "";
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;
    const p = join(dir, cmd);
    if (existsSync(p)) return p;
  }
  if (cmd === "bun") {
    const bunHome = join(homedir(), ".bun", "bin", "bun");
    if (existsSync(bunHome)) return bunHome;
  }
  return null;
}

function resolveRuntime(preferred, fallbacks = []) {
  const order = [preferred, ...fallbacks].filter(Boolean);
  for (const name of order) {
    const p = which(name);
    if (p) return { name, path: p };
  }
  return { name: "node", path: which("node") || process.execPath };
}

function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, data) {
  ensureDir(dirname(path));
  const body = JSON.stringify(data, null, 2) + "\n";
  if (dryRun) {
    console.log(`[dry-run] write ${path}`);
    return;
  }
  writeFileSync(path, body);
}

/**
 * Where each non-Cursor harness keeps its hook config.
 *
 * Claude Code, Codex, and grok all read the same nested shape
 * (`hooks.<Event>[].hooks[]`) and all take `{"decision":"block"}` to keep the
 * agent working, so one writer serves the three. Cursor's flat array and
 * `followup_message` stay on their own path.
 */

/**
 * Codex requires the hooks feature and per-command trust (/hooks) before Stop
 * hooks will run. Enable features.hooks in ~/.codex/config.toml when missing.
 * Updates an existing hooks/codex_hooks key in [features] instead of duplicating.
 */
function ensureCodexHooksFeature(home = homedir()) {
  const configPath = join(home, ".codex", "config.toml");
  let text = "";
  try {
    text = readFileSync(configPath, "utf8");
  } catch {
    text = "";
  }

  // Already enabled anywhere in the file.
  if (
    /(?:^|\n)\s*hooks\s*=\s*true\s*(?:\n|$)/m.test(text) ||
    /(?:^|\n)\s*codex_hooks\s*=\s*true\s*(?:\n|$)/m.test(text)
  ) {
    return { path: configPath, changed: false };
  }

  let next = text;
  let changed = false;

  // Flip existing false/off values for either key name.
  const flipped = next.replace(
    /^(\s*(?:hooks|codex_hooks)\s*=\s*)(?:false|0|"false"|'false')(\s*(?:#.*)?)$/gm,
    (_m, pre, post) => {
      changed = true;
      return `${pre}true${post || ""}`;
    },
  );
  next = flipped;

  if (
    !/(?:^|\n)\s*hooks\s*=\s*true\s*(?:\n|$)/m.test(next) &&
    !/(?:^|\n)\s*codex_hooks\s*=\s*true\s*(?:\n|$)/m.test(next)
  ) {
    if (/^\[features\]/m.test(next)) {
      // Insert immediately under the first [features] header.
      next = next.replace(/^(\[features\][^\n]*\n)/m, (m) => {
        changed = true;
        return `${m}hooks = true\n`;
      });
    } else {
      next = `${next.trimEnd()}\n\n[features]\nhooks = true\n`;
      changed = true;
    }
  }

  if (!changed) {
    return { path: configPath, changed: false };
  }

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, next.endsWith("\n") ? next : `${next}\n`);
  return { path: configPath, changed: true };
}

function remindCodexHookTrust() {
  console.log(
    "[self-agents] Codex Stop hooks are installed. In Codex run /hooks and trust the self-* Stop/UserPromptSubmit/SessionStart commands (changed hashes are skipped until trusted).",
  );
}

const NESTED_HOOK_TARGETS = {
  "claude-settings": { home: ".claude", file: () => "settings.json" },
  "codex-hooks": { home: ".codex", file: () => "hooks.json" },
  "grok-hooks": { home: ".grok", file: (skill) => join("hooks", `${skill}.json`) },
};

function mergeNestedHooks({ skillInstallDir, manifest, runtime, targetPath }) {
  const existing = readJson(targetPath, null) || {};
  if (!existing.hooks || typeof existing.hooks !== "object") existing.hooks = {};

  const gabeTwin = gabeTwinSkillName(manifest.skill);
  const needles = [
    ...(Array.isArray(manifest.replaceLegacyCommands)
      ? manifest.replaceLegacyCommands
      : []),
    `skills/${manifest.skill}/hooks/`,
    `skills/${manifest.skill}/adapters/`,
  ];
  if (gabeTwin) {
    needles.push(
      `skills/${gabeTwin}/hooks/`,
      `skills/${gabeTwin}/adapters/`,
      `skills/${gabeTwin}/`,
    );
  }

  let added = 0;
  let replaced = 0;

  for (const [eventName, entries] of Object.entries(manifest.hooks || {})) {
    if (!Array.isArray(entries)) continue;
    const groups = Array.isArray(existing.hooks[eventName])
      ? existing.hooks[eventName]
      : [];

    const kept = [];
    for (const group of groups) {
      const handlers = Array.isArray(group?.hooks) ? group.hooks : [];
      const survivors = handlers.filter((handler) => {
        if (
          commandMatchesLegacy(handler?.command, needles) ||
          isGabePackHookCommand(handler?.command)
        ) {
          replaced += 1;
          return false;
        }
        return true;
      });
      if (survivors.length) kept.push({ ...group, hooks: survivors });
    }

    const handlers = [];
    for (const entry of entries) {
      const scriptRel = entry.script || entry.command;
      if (!scriptRel) continue;
      // Resolve through the symlink so every harness gets the same real path —
      // grok merges Cursor and Claude configs alongside its own and dedupes
      // identical commands, so matching strings prevent a triple fire.
      let scriptAbs = join(skillInstallDir, "adapters", manifest.adapter, scriptRel);
      try {
        if (existsSync(scriptAbs)) scriptAbs = realpathSync(scriptAbs);
      } catch {
        // keep join path
      }
      const handler = { type: "command", command: `${runtime.path} ${scriptAbs}` };
      if (entry.timeout) handler.timeout = entry.timeout;
      handlers.push(handler);
      added += 1;
      if (dryRun) console.log(`[dry-run] ${manifest.adapter} hook ${eventName}: ${handler.command}`);
    }
    if (handlers.length) kept.push({ hooks: handlers });
    existing.hooks[eventName] = kept;
  }

  existing.metadata = existing.metadata || {};
  if (existing.metadata["gabe-agents"]) delete existing.metadata["gabe-agents"];
  existing.metadata["self-agents"] = {
    ...(existing.metadata["self-agents"] || {}),
    [manifest.skill]: {
      updated_at: new Date().toISOString(),
      adapter: manifest.adapter,
      skill_dir: skillInstallDir,
      runtime: runtime.path,
      mode,
    },
  };

  writeJson(targetPath, existing);
  if (/(?:^|[/\\])\.codex[/\\]hooks\.json$/.test(targetPath)) {
    const ensured = ensureCodexHooksFeature();
    if (ensured.changed) {
      console.log(`[self-agents] enabled features.hooks in ${ensured.path}`);
    }
    remindCodexHookTrust();
  }
  return { hooksPath: targetPath, added, replaced };
}

function listAdapterNames(skillSrc) {
  const adaptersRoot = join(skillSrc, "adapters");
  if (!existsSync(adaptersRoot)) return [];
  return readdirSync(adaptersRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function discoverAdapters(skills, skillsRoot) {
  const found = [];
  for (const skill of skills) {
    const skillSrc = join(skillsRoot, skill);
    for (const adapter of listAdapterNames(skillSrc)) {
      const dir = join(skillSrc, "adapters", adapter);
      const manifestPath = join(dir, "hooks.json");
      const installPath = join(dir, "install.json");
      found.push({
        skill,
        adapter,
        dir,
        manifestPath: existsSync(manifestPath) ? manifestPath : null,
        installPath: existsSync(installPath) ? installPath : null,
      });
    }
  }
  return found;
}

function commandMatchesLegacy(command, legacyNeedles) {
  if (!command || typeof command !== "string") return false;
  return legacyNeedles.some((n) => command.includes(n));
}

function hookEntryId(entry) {
  return entry?.id || entry?.name || null;
}

function mergeCursorHooks({ skillInstallDir, manifest, runtime }) {
  const home = homedir();
  const hooksPath = join(home, ".cursor", "hooks.json");
  const existing = readJson(hooksPath, { version: 1, hooks: {} }) || { version: 1, hooks: {} };
  if (!existing.hooks || typeof existing.hooks !== "object") existing.hooks = {};
  if (!existing.version) existing.version = 1;

  const legacy = Array.isArray(manifest.replaceLegacyCommands)
    ? manifest.replaceLegacyCommands
    : [];
  const gabeTwin = gabeTwinSkillName(manifest.skill);
  const replaceNeedles = [
    ...legacy,
    `skills/${manifest.skill}/adapters/`,
    // Hook scripts live under the skill, not under an adapter. Without this the
    // needles stop matching the moment a script moves, and re-installing appends
    // a second copy of every hook instead of replacing the first.
    `skills/${manifest.skill}/hooks/`,
    "skills/goal/scripts/",
  ];
  if (gabeTwin) {
    replaceNeedles.push(
      `skills/${gabeTwin}/hooks/`,
      `skills/${gabeTwin}/adapters/`,
      `skills/${gabeTwin}/`,
    );
  }

  // Ids this run is about to write. An existing entry claiming one of them is
  // ours regardless of where its command points.
  const incomingIds = new Set();
  for (const entries of Object.values(manifest.hooks || {})) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (entry.id) incomingIds.add(entry.id);
    }
  }

  const managedPrefix = `self-agents:${manifest.skill}:`;
  let added = 0;
  let replaced = 0;

  for (const [eventName, entries] of Object.entries(manifest.hooks || {})) {
    if (!Array.isArray(entries)) continue;
    const current = Array.isArray(existing.hooks[eventName])
      ? [...existing.hooks[eventName]]
      : [];

    const kept = current.filter((entry) => {
      const cmd = entry?.command || "";
      const id = hookEntryId(entry);
      if (id && String(id).startsWith(managedPrefix)) {
        replaced += 1;
        return false;
      }
      if (id && String(id).startsWith("gabe-agents:")) {
        replaced += 1;
        return false;
      }
      if (isGabePackHookId(id)) {
        replaced += 1;
        return false;
      }
      if (id && incomingIds.has(String(id))) {
        replaced += 1;
        return false;
      }
      if (
        commandMatchesLegacy(cmd, replaceNeedles) ||
        isGabePackHookCommand(cmd)
      ) {
        replaced += 1;
        return false;
      }
      return true;
    });

    for (const entry of entries) {
      const scriptRel = entry.script || entry.command;
      if (!scriptRel) continue;
      // Resolve through symlink so bun gets a real path when possible
      let scriptAbs = join(skillInstallDir, "adapters", "cursor", scriptRel);
      try {
        if (existsSync(scriptAbs)) scriptAbs = realpathSync(scriptAbs);
      } catch {
        // keep join path
      }
      const id = entry.id || `${managedPrefix}${eventName}:${scriptRel}`;
      const command = `${runtime.path} ${scriptAbs}`;
      kept.push({ id, command });
      added += 1;
      if (dryRun) console.log(`[dry-run] cursor hook ${eventName}: ${command}`);
    }

    existing.hooks[eventName] = kept;
  }

  existing.metadata = existing.metadata || {};
  if (existing.metadata["gabe-agents"]) delete existing.metadata["gabe-agents"];
  existing.metadata["self-agents"] = {
    ...(existing.metadata["self-agents"] || {}),
    [manifest.skill]: {
      updated_at: new Date().toISOString(),
      adapter: "cursor",
      skill_dir: skillInstallDir,
      runtime: runtime.path,
      mode,
    },
  };

  writeJson(hooksPath, existing);
  return { hooksPath, added, replaced };
}

function installGenericAdapterFiles({ skill, adapter, dir, primarySkillRoot }) {
  const installCfg = readJson(join(dir, "install.json"), null);
  if (!installCfg) return null;

  const targets = [];
  const copies = Array.isArray(installCfg.copy) ? installCfg.copy : [];
  for (const item of copies) {
    const from = join(dir, item.from || item.src || ".");
    let to = item.to || item.dest;
    if (!to) continue;
    to = to
      .replace(/^~(?=\/|$)/, homedir())
      .replaceAll("{{home}}", homedir())
      .replaceAll("{{skill}}", skill)
      .replaceAll("{{adapter}}", adapter)
      .replaceAll("{{skill_dir}}", join(primarySkillRoot, skill));
    if (dryRun) {
      console.log(`[dry-run] adapter copy ${from} -> ${to}`);
      targets.push(to);
      continue;
    }
    // Check the source FIRST: creating the destination for a missing source
    // leaves an empty skill directory that looks installed but has no SKILL.md.
    if (!existsSync(from)) {
      console.warn(`[self-agents] adapter source missing, skipping: ${from}`);
      continue;
    }
    ensureDir(dirname(to));
    if (statSync(from).isDirectory()) {
      ensureDir(to);
      cpSync(from, to, { recursive: true });
    } else {
      cpSync(from, to);
    }
    targets.push(to);
  }
  return { installCfg, targets };
}

function preferCursorSkillRoot(skillRoots) {
  const needle = join(".cursor", "skills");
  const cursor = skillRoots.find((r) => r.includes(needle));
  if (cursor) return cursor;
  const cursorSkills = join(homedir(), ".cursor", "skills");
  if (existsSync(join(homedir(), ".cursor"))) return cursorSkills;
  return skillRoots[0];
}

function installAdapters(skills, skillRoots, skillsRoot) {
  if (noAdapters) {
    console.log("[self-agents] skip adapters (--no-adapters)");
    return { adapters: [] };
  }

  const discovered = discoverAdapters(skills, skillsRoot);
  const report = [];
  const roots = [...skillRoots];
  const cursorSkillRoot = preferCursorSkillRoot(roots);

  if (discovered.some((d) => d.adapter === "cursor") && !roots.includes(cursorSkillRoot)) {
    if (!dryRun) {
      installInto(cursorSkillRoot, skills, skillsRoot);
      roots.push(cursorSkillRoot);
    } else {
      console.log(`[dry-run] would also install skills into ${cursorSkillRoot} for cursor hooks`);
    }
  }

  for (const item of discovered) {
    const { skill, adapter, dir, manifestPath } = item;
    const entry = { skill, adapter, dir, actions: [] };

    const generic = installGenericAdapterFiles({
      skill,
      adapter,
      dir,
      primarySkillRoot: roots[0],
    });
    if (generic) entry.actions.push({ type: "install.json", ...generic });

    if (adapter === "cursor" && manifestPath) {
      const manifest = readJson(manifestPath, null);
      if (!manifest) {
        entry.actions.push({ type: "error", message: `invalid ${manifestPath}` });
        report.push(entry);
        continue;
      }
      const runtime = resolveRuntime(
        manifest.runtime || "bun",
        manifest.runtimeFallbacks || ["bun", "node"],
      );
      const skillInstallDir = join(cursorSkillRoot, skill);
      if (!dryRun && !existsSync(join(skillInstallDir, "SKILL.md"))) {
        installInto(cursorSkillRoot, [skill], skillsRoot);
      }
      const result = mergeCursorHooks({
        skillInstallDir,
        manifest: { ...manifest, skill: manifest.skill || skill },
        runtime,
      });
      entry.actions.push({ type: "cursor-hooks", runtime, ...result });
      console.log(
        `[self-agents] cursor hooks for ${skill}: +${result.added} replaced~${result.replaced} -> ${result.hooksPath} (runtime ${runtime.path})`,
      );
    } else if (manifestPath && NESTED_HOOK_TARGETS[readJson(manifestPath, {})?.target]) {
      const manifest = { ...readJson(manifestPath, {}), skill, adapter };
      const target = NESTED_HOOK_TARGETS[manifest.target];
      const harnessHome = join(homedir(), target.home);
      if (!existsSync(harnessHome)) {
        entry.actions.push({ type: "skipped", note: `${target.home} not installed` });
        console.log(`[self-agents] adapter ${skill}/${adapter}: skipped, no ${target.home}`);
        report.push(entry);
        continue;
      }
      const runtime = resolveRuntime(
        manifest.runtime || "bun",
        manifest.runtimeFallbacks || ["bun", "node"],
      );
      const harnessSkillRoot = join(harnessHome, "skills");
      if (!dryRun && !existsSync(join(harnessSkillRoot, skill, "SKILL.md"))) {
        installInto(harnessSkillRoot, [skill], skillsRoot);
      }
      const targetPath = join(harnessHome, target.file(skill));
      const result = mergeNestedHooks({
        skillInstallDir: join(harnessSkillRoot, skill),
        manifest,
        runtime,
        targetPath,
      });
      entry.actions.push({ type: `${adapter}-hooks`, runtime, ...result });
      console.log(
        `[self-agents] ${adapter} hooks for ${skill}: +${result.added} replaced~${result.replaced} -> ${result.hooksPath} (runtime ${runtime.path})`,
      );
    } else if (adapter !== "cursor") {
      entry.actions.push({
        type: "copied-with-skill",
        note: `adapter '${adapter}' files ship inside skill; add adapters/${adapter}/install.json for extra side installs`,
      });
      console.log(
        `[self-agents] adapter ${skill}/${adapter}: shipped with skill (no special wiring)`,
      );
    }

    report.push(entry);
  }

  return { adapters: report, cursorSkillRoot, skillRoots: roots };
}

function writeLiveMarker(liveRoot, skills, liveMeta = {}) {
  const branch = liveMeta.branch || null;
  const base = liveMeta.base || "main";
  const marker = {
    mode: "live",
    live_root: liveRoot,
    live_branch: branch,
    upstream_base: base,
    skills,
    updated_at: new Date().toISOString(),
    howto: {
      edit: `edit files under ${liveRoot}/skills/<skill>/`,
      commit: branch
        ? `git -C ${liveRoot} add -A && git -C ${liveRoot} commit -m "…"` +
          `  # post-commit hook pushes ${branch} and opens/updates PR into ${base}`
        : `git -C ${liveRoot} add -A && git -C ${liveRoot} commit && git -C ${liveRoot} push`,
      pr: branch
        ? `automatic on commit via .git/hooks/post-commit (disable: SELF_SKIP_PR_HOOK=1); base ${base} head ${branch}`
        : `open a PR against ${base} (do not push global skill changes straight to ${base})`,
      sync: `node ${join(pkgRoot, "scripts/install.mjs")} --live --pull`,
      re_symlink: `node ${join(pkgRoot, "scripts/install.mjs")} --live`,
      project_rules: `project-specific rules go in <repo>/.agents/ (not the global pack)`,
    },
  };
  const markerPath = join(homedir(), ".agents", "self-agents-live.json");
  writeJson(markerPath, marker);
  return markerPath;
}

// --- main ---
let liveRoot = pkgRoot;
let liveMeta = null;
if (mode === "live") {
  liveRoot = resolveLiveRoot();
  // Only clone when live root is the default external path and missing/not pkg
  if (resolve(liveRoot) === resolve(pkgRoot) && existsSync(join(pkgRoot, "skills"))) {
    if (verifyOnly) {
      liveMeta = { liveRoot, action: "pkg-root-verify", repoUrl: "local-package" };
    } else {
      liveMeta = {
        liveRoot,
        action: "pkg-root",
        repoUrl: "local-package",
        ...ensureLiveWorkingBranch(pkgRoot, {
          sync: doPull || envSelfTruthy("PULL"),
        }),
      };
      installLiveGitHooks(pkgRoot);
    }
  } else if (verifyOnly) {
    liveMeta = { liveRoot, action: "verify-only" };
  } else {
    liveMeta = ensureLiveCheckout(liveRoot);
  }
}

const skillsRoot = skillsRootForMode(liveRoot);
const skills = listSkillDirs(skillsRoot);
const sharedPacks = listSharedPackDirs(skillsRoot);
const installUnits = listInstallUnits(skillsRoot);
if (skills.length === 0) {
  console.error(`[self] no skills found under ${skillsRoot}`);
  const staleRoots = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();
  reportBrokenSkillDirs(staleRoots, []);
  process.exit(1);
}

const targets = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();

// --verify-only: md5 every managed script at every destination and harness hook;
// do not write skills, hooks, or markers.
if (verifyOnly) {
  console.log(
    `[self] verify-only: source=${skillsRoot} targets=${targets.length} skills=${skills.length} shared=${sharedPacks.length}`,
  );
  const integrityRoots = [...targets];
  // When scanning default agent homes (no --target), also cover the Cursor
  // skill root if installAdapters would have used it and it is not already listed.
  if (!explicitTarget) {
    const cursorSkills = join(homedir(), ".cursor", "skills");
    if (existsSync(cursorSkills) && !integrityRoots.includes(cursorSkills)) {
      integrityRoots.push(cursorSkills);
    }
  }
  const integrity = verifyScriptIntegrity({
    skillsRoot,
    managedSkills: installUnits,
    targetRoots: integrityRoots,
    liveRoot: mode === "live" ? liveRoot : null,
  });
  const integrityPath = writeIntegrityReceipt(integrity, {
    mode,
    skills_root: skillsRoot,
    targets,
    verify_only: true,
  });
  console.log(`[self-agents] integrity receipt: ${integrityPath}`);
  if (!integrity.ok) {
    console.error(
      `[self-agents] verify failed: ${integrity.stale.length} stale/missing script(s)`,
    );
    process.exit(1);
  }
  console.log("[self-agents] verify-only: all managed scripts match source md5");
  process.exit(0);
}

const results = {};
for (const target of targets) {
  results[target] = installInto(target, installUnits, skillsRoot);
}

// Companion install: the mdscript executor/writer this pack's headers require.
const mdscriptSkillsRoot = ensureMdscriptSkillsRoot();
const mdscriptSkills = mdscriptSkillsRoot ? listSkillDirs(mdscriptSkillsRoot) : [];
if (mdscriptSkills.length && !dryRun) {
  for (const target of targets) {
    results[target] = [
      ...results[target],
      ...installInto(target, mdscriptSkills, mdscriptSkillsRoot),
    ];
  }
}

// Adapters/hooks live on real skills and shared packs (e.g. self-common).
const adapterReport = installAdapters(installUnits, [...targets], skillsRoot);

// Full gabe→self cutover on every reinstall so nothing dangling remains.
const cutoverRoots = [...targets];
if (adapterReport?.cursorSkillRoot && !cutoverRoots.includes(adapterReport.cursorSkillRoot)) {
  cutoverRoots.push(adapterReport.cursorSkillRoot);
}
if (Array.isArray(adapterReport?.skillRoots)) {
  for (const r of adapterReport.skillRoots) {
    if (r && !cutoverRoots.includes(r)) cutoverRoots.push(r);
  }
}
const cutoverReport = dryRun
  ? { skipped: true }
  : runGabeToSelfCutover(cutoverRoots);

let brokenSkills = [];
let missingAssets = [];
let scriptIntegrity = null;
let integrityPath = null;
if (!dryRun) {
  // Warn about any unreadable skill dirs (including third-party dangling links).
  brokenSkills = reportBrokenSkillDirs(targets, skills) || [];
  // Hard-fail only when THIS pack's required nested assets are incomplete —
  // e.g. self-review without engineering-rules / eng-* lanes.
  // Includes shared packs (SHARED_PACKS) via REQUIRED_SKILL_ASSETS.
  missingAssets = reportMissingSkillAssets(targets, installUnits) || [];
  const managedBroken = brokenSkills.filter((b) =>
    skills.some((s) => b.includes(`/${s}`) || b.includes(`/${s} `) || b.endsWith(`/${s}`)),
  );
  if (missingAssets.length || managedBroken.length) {
    console.error(
      `[self] install incomplete: ${managedBroken.length} managed broken skill dir(s), ${missingAssets.length} missing asset(s)`,
    );
    process.exit(1);
  }
  console.log(
    `[self] asset integrity ok (${skills.length} skills + ${sharedPacks.length} shared pack(s))`,
  );

  // md5 every managed script at every skill root, harness hook command path,
  // agent-home copy, and managed git post-commit. Stale copies fail install.
  const integrityRoots = [...targets];
  if (adapterReport?.cursorSkillRoot && !integrityRoots.includes(adapterReport.cursorSkillRoot)) {
    integrityRoots.push(adapterReport.cursorSkillRoot);
  }
  if (Array.isArray(adapterReport?.skillRoots)) {
    for (const r of adapterReport.skillRoots) {
      if (r && !integrityRoots.includes(r)) integrityRoots.push(r);
    }
  }
  scriptIntegrity = verifyScriptIntegrity({
    skillsRoot,
    managedSkills: installUnits,
    targetRoots: integrityRoots,
    liveRoot: mode === "live" ? liveRoot : null,
  });
  integrityPath = writeIntegrityReceipt(scriptIntegrity, {
    mode,
    skills_root: skillsRoot,
    targets: integrityRoots,
    live_root: mode === "live" ? liveRoot : null,
  });
  if (!scriptIntegrity.ok) {
    console.error(
      `[self-agents] install incomplete: ${scriptIntegrity.stale.length} stale/missing script md5 mismatch(es)`,
    );
    console.error(`[self-agents] integrity receipt: ${integrityPath}`);
    process.exit(1);
  }
  console.log(`[self-agents] integrity receipt: ${integrityPath}`);
}

let instructionReport = [];
if (localState) {
  console.log(
    "[self-agents] --local: skipping the global router directive; add it to this project's AGENTS.md yourself",
  );
} else if (skipInstructions) {
  console.log("[self-agents] skipping the router directive (--no-instructions)");
} else {
  instructionReport = ensureRouterDirective();
  const refused = instructionReport.filter((r) => r.action === "refused");
  const changed = instructionReport.filter(
    (r) => r.action !== "present" && r.action !== "refused",
  );
  if (refused.length) {
    console.error(
      `[self-agents] router directive LEFT UNCHANGED in ${refused.length} file(s) (rewrite failed its own check):`,
    );
    for (const r of refused) console.error(`    - ${r.path}`);
    // Same posture as missing assets and stale hashes: a refusal is a red install.
    process.exitCode = 1;
  }
  if (changed.length) {
    console.log(
      `[self-agents] router directive ${dryRun ? "would be written to" : "written to"} ${changed.length} file(s):`,
    );
    for (const r of changed) console.log(`    - ${r.path} (${r.action})`);
  } else if (!refused.length) {
    console.log(
      `[self-agents] router directive already present in ${instructionReport.length} instruction file(s)`,
    );
  }
}

let markerPath = null;
if (mode === "live") {
  markerPath = writeLiveMarker(liveRoot, skills, liveMeta || {});
}

const receipt = {
  installed_at: new Date().toISOString(),
  package_root: pkgRoot,
  mode,
  live: liveMeta,
  skills_root: skillsRoot,
  skills,
  local_state: localState,
  instructions: instructionReport,
  mdscript_skills_root: mdscriptSkillsRoot,
  mdscript_skills: mdscriptSkills,
  targets: results,
  adapters: adapterReport,
  marker_path: markerPath,
  integrity_path: integrityPath,
  script_integrity: scriptIntegrity
    ? {
        ok: scriptIntegrity.ok,
        script_count: scriptIntegrity.scriptCount,
        stale_count: scriptIntegrity.stale.length,
        source_scripts: scriptIntegrity.sourceManifest,
      }
    : null,
  dry_run: dryRun,
};
const receiptPath = join(pkgRoot, ".install-receipt.json");
if (!dryRun) {
  try {
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
  } catch {
    // ignore when package is read-only
  }
}

if (localState) {
  console.log(
    "[self-agents] --local: agent state goes under <repo>/.agents (export SELF_LOCAL=1 for hooks and skills)",
  );
} else {
  console.log(
    "[self-agents] agent state under ~/.agents (or $AGENTS_HOME); working repositories stay clean",
  );
}

if (mdscriptSkills.length) {
  console.log(
    `[self-agents] + ${mdscriptSkills.length} mdscript skills from ${mdscriptSkillsRoot}`,
  );
} else if (!skipMdscript) {
  console.warn(
    `[self-agents] mdscript-exec/mdscript-write not installed — every skill header requires mdscript-exec`,
  );
}

console.log(
  `[self] mode=${mode} installed ${skills.length} skills + ${sharedPacks.length} shared pack(s) + ${mdscriptSkills.length} mdscript skill(s) into ${Object.keys(results).length} target(s)`,
);
if (mode === "live") {
  console.log(`[self-agents] live root: ${liveRoot}`);
  if (liveMeta?.branch) {
    console.log(
      `[self-agents] live branch: ${liveMeta.branch} (sync origin/${liveMeta.base || "main"} via --pull; push branch + open PR for global skill changes)`,
    );
    console.log(
      `[self-agents] edit skills in-place, then: git -C ${liveRoot} add -A && git commit && git push -u origin ${liveMeta.branch}`,
    );
    console.log(
      `[self-agents] open PR: gh pr create --base ${liveMeta.base || "main"} --head ${liveMeta.branch}`,
    );
  } else {
    console.log(
      `[self-agents] edit skills in-place, then: git -C ${liveRoot} commit && git push (prefer a PR into main)`,
    );
  }
  if (markerPath) console.log(`[self-agents] live marker: ${markerPath}`);
}
for (const [target, paths] of Object.entries(results)) {
  console.log(`  ${target}`);
  for (const p of paths) {
    const dest = typeof p === "string" ? p : p.dest;
    let note = mode;
    if (mode === "live" && isSymlink(dest)) {
      try {
        note = `symlink -> ${readlinkSync(dest)}`;
      } catch {
        note = "symlink";
      }
    }
    console.log(`    - ${dest} (${note})`);
  }
}

try {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
  console.log(`[self-agents] package ${pkg.name}@${pkg.version}`);
} catch {
  // ignore
}
