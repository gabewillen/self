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
 * Override: SELF_AGENTS_LIVE_ROOT, --live-root <path>
 * Repo URL: SELF_AGENTS_REPO_URL (default github.com/gabewillen/self.git)
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
 *   SELF_AGENTS_INSTALL=0 npm i
 *   SELF_AGENTS_MODE=copy npm i
 *
 * Live branch (default): install creates/checks out a long-lived working branch
 * (live/<user>-<host>, override SELF_AGENTS_LIVE_BRANCH) that tracks origin's
 * default branch for sync. Push that branch and open a PR for global skill
 * changes; do not push straight to main. Set SELF_AGENTS_LIVE_BRANCH=0 to skip.
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
const localState =
  args.includes("--local") ||
  (process.env.SELF_AGENTS_LOCAL ?? process.env.GABE_AGENTS_LOCAL) === "1" ||
  (process.env.SELF_AGENTS_LOCAL ?? process.env.GABE_AGENTS_LOCAL) === "true";
const skipInstructions =
  args.includes("--no-instructions") ||
  (process.env.SELF_AGENTS_INSTRUCTIONS ?? process.env.GABE_AGENTS_INSTRUCTIONS) === "0";
const skipMdscript =
  args.includes("--no-mdscript") ||
  (process.env.SELF_AGENTS_MDSCRIPT ?? process.env.GABE_AGENTS_MDSCRIPT) === "0" ||
  (process.env.SELF_AGENTS_MDSCRIPT ?? process.env.GABE_AGENTS_MDSCRIPT) === "false";
const verifyOnly =
  args.includes("--verify-only") ||
  (process.env.SELF_AGENTS_VERIFY_ONLY ?? process.env.GABE_AGENTS_VERIFY_ONLY) === "1" ||
  (process.env.SELF_AGENTS_VERIFY_ONLY ?? process.env.GABE_AGENTS_VERIFY_ONLY) === "true";

const modeEnv = ((process.env.SELF_AGENTS_MODE ?? process.env.GABE_AGENTS_MODE) || "").toLowerCase();
const mode = args.includes("--copy") || modeEnv === "copy"
  ? "copy"
  : args.includes("--live") || modeEnv === "live" || modeEnv === "" || modeEnv === "symlink"
    ? "live"
    : "live";

if ((process.env.SELF_AGENTS_INSTALL ?? process.env.GABE_AGENTS_INSTALL) === "0" || (process.env.SELF_AGENTS_INSTALL ?? process.env.GABE_AGENTS_INSTALL) === "false") {
  console.log("[self-agents] skip install (SELF_AGENTS_INSTALL=0)");
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
 * Else use SELF_AGENTS_LIVE_ROOT / --live-root / default clone path.
 */
function resolveLiveRoot() {
  if (explicitLiveRoot) return explicitLiveRoot;
  const liveRootEnv = process.env.SELF_AGENTS_LIVE_ROOT || process.env.GABE_AGENTS_LIVE_ROOT;
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
  const raw = (process.env.SELF_AGENTS_LIVE_BRANCH ?? process.env.GABE_AGENTS_LIVE_BRANCH);
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
      (process.env.SELF_AGENTS_REPO_URL ?? process.env.GABE_AGENTS_REPO_URL) ||
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

    if (doPull || (process.env.SELF_AGENTS_PULL ?? process.env.GABE_AGENTS_PULL) === "1" || opts.sync) {
      console.log(
        `[self-agents] sync ${branch} with origin/${base} (merge --ff-only, then merge)`,
      );
      let sync = trySh("git", [
        "-C",
        root,
        "merge",
        "--ff-only",
        `origin/${base}`,
      ]);
      if (!sync.ok) {
        sync = trySh("git", ["-C", root, "merge", "--no-edit", `origin/${base}`]);
        if (!sync.ok) {
          console.warn(
            `[self-agents] merge origin/${base} into ${branch} failed (resolve manually): ${sync.err}`,
          );
        } else {
          console.log(`[self-agents] merged origin/${base} into ${branch}`);
        }
      } else {
        console.log(`[self-agents] fast-forwarded ${branch} to origin/${base}`);
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
    (process.env.SELF_AGENTS_REPO_URL ?? process.env.GABE_AGENTS_REPO_URL) ||
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
      sync: doPull || (process.env.SELF_AGENTS_PULL ?? process.env.GABE_AGENTS_PULL) === "1",
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
    process.env.SELF_AGENTS_MDSCRIPT_ROOT || process.env.GABE_AGENTS_MDSCRIPT_ROOT;
  const root =
    explicitMdscriptRoot ||
    (mdscriptRootEnv ? resolve(mdscriptRootEnv) : DEFAULT_MDSCRIPT_ROOT);
  const repoUrl =
    process.env.SELF_AGENTS_MDSCRIPT_REPO_URL ||
    process.env.GABE_AGENTS_MDSCRIPT_REPO_URL ||
    MDSCRIPT_REPO_URL;
  const skillsRoot = join(root, "skills");

  if (dryRun) {
    console.log(
      `[dry-run] ensure mdscript checkout at ${root} from ${repoUrl}`,
    );
    return existsSync(skillsRoot) ? skillsRoot : null;
  }

  if (existsSync(root) && isGitRepo(root)) {
    if (doPull || (process.env.SELF_AGENTS_PULL ?? process.env.GABE_AGENTS_PULL) === "1") {
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

function installSkillSymlink(src, dest) {
  const absSrc = resolve(src);
  if (dryRun) {
    console.log(`[dry-run] symlink ${dest} -> ${absSrc}`);
    return;
  }
  ensureDir(dirname(dest));
  if (existsSync(dest) || isSymlink(dest)) {
    // Replace previous managed install (dir or symlink)
    removePath(dest);
  }
  // Relative symlink when possible for portability inside home
  let linkTarget = absSrc;
  try {
    linkTarget = relative(dirname(dest), absSrc) || absSrc;
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
  "self-review": [
    "SKILL.md",
    "workflows/select-review-lanes.md",
    "workflows/select-language-framework-lanes.md",
    "workflows/triple-adversarial-blind-review.mdscript.md",
    "workflows/neutral-review-packet.md",
    "workflows/blind-reviewers/rules.mdscript.md",
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
    "hsm/SKILL.md",
    "hsm/workflows/triage.mdscript.md",
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
    "hooks/watch-lib.ts",
    "hooks/watch-stop.ts",
    "hooks/watch-session-start.ts",
    "adapters/cursor/hooks.json",
  ],
  "self-common": [
    "SKILL.md",
    "workflows/goal-mdscript.md",
    "workflows/file-task-comments.md",
    "workflows/update-living-skills.md",
    "workflows/load-operating-context.md",
    "workflows/self-learn.mdscript.md",
    "hooks/learn-stop.ts",
    "hooks/learn-session-touch.ts",
    "hooks/learn-lib.ts",
    "adapters/claude/hooks.json",
    "adapters/cursor/hooks.json",
    "adapters/codex/hooks.json",
    "adapters/grok/hooks.json",
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
  "MDScript); explicit routes cover self-watch, self-goal, self-automate, and self-learn " +
  "(MDScript only); HSM is a self-review lane.";
const ROUTER_BLOCK_START = "<!-- self-agents:router -->";
const ROUTER_BLOCK_END = "<!-- /self-agents:router -->";
const ROUTER_BLOCK_RE =
  /<!-- self-agents:router -->[\s\S]*?<!-- \/self-agents:router -->\n?/;
/** Pre-rename marker — strip so installs do not leave two router blocks. */
const LEGACY_GABE_ROUTER_BLOCK_RE =
  /<!-- gabe-agents:router -->[\s\S]*?<!-- \/gabe-agents:router -->\n?/g;
/** Pre-marker directive, so the first upgrade adopts it instead of duplicating it. */
const LEGACY_DIRECTIVE_RE =
  /^.*ALWAYS use (?:the )?[`'"]?(?:gabe|self)[`'"]? router skill.*$\n?/im;

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

/**
 * Rewrite the managed block in place when its wording has changed, so an
 * install that reworded the directive actually reaches existing users. Matching
 * on "some self-router text is present" would pin everyone to whatever they
 * installed first.
 */
function applyRouterDirective(existing, block) {
  const original = existing || "";
  // Drop pre-rename gabe-agents router blocks so they never sit beside self-agents.
  let body = original.replace(LEGACY_GABE_ROUTER_BLOCK_RE, "");
  const strippedLegacy = body !== original;
  if (ROUTER_BLOCK_RE.test(body)) {
    const next = body.replace(ROUTER_BLOCK_RE, block);
    if (next === body && !strippedLegacy) {
      return { body, action: "present" };
    }
    return { body: next, action: "updated" };
  }
  if (LEGACY_DIRECTIVE_RE.test(body)) {
    return { body: body.replace(LEGACY_DIRECTIVE_RE, block), action: "updated" };
  }
  if (!body) {
    return { body: `# Global agent instructions\n\n${block}`, action: "created" };
  }
  return {
    body: `${body.replace(/\n*$/, "")}\n\n${block}`,
    action: "appended",
  };
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
    const { body, action } = applyRouterDirective(existing, block);
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
const RETIRED_SKILLS = ["self-hsm-review", "gabe", "gabe-automate", "gabe-common", "gabe-goal", "gabe-implement", "gabe-orchestrate", "gabe-review", "gabe-unwatch", "gabe-voice", "gabe-watch", "gabe-hsm-review"];

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

function installInto(targetRoot, skills, skillsRoot) {
  ensureDir(targetRoot);
  installAgentHomeScript(targetRoot, skillsRoot);
  removeRetiredSkills(targetRoot);
  const installed = [];
  for (const skill of skills) {
    const src = join(skillsRoot, skill);
    const dest = join(targetRoot, skill);
    if (!existsSync(join(src, "SKILL.md"))) {
      console.warn(`[self-agents] skip missing skill source ${src}`);
      continue;
    }
    if (mode === "live") installSkillSymlink(src, dest);
    else installSkillCopy(src, dest);
    installed.push({ skill, dest, src, mode });
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
const NESTED_HOOK_TARGETS = {
  "claude-settings": { home: ".claude", file: () => "settings.json" },
  "codex-hooks": { home: ".codex", file: () => "hooks.json" },
  "grok-hooks": { home: ".grok", file: (skill) => join("hooks", `${skill}.json`) },
};

function mergeNestedHooks({ skillInstallDir, manifest, runtime, targetPath }) {
  const existing = readJson(targetPath, null) || {};
  if (!existing.hooks || typeof existing.hooks !== "object") existing.hooks = {};

  const needles = [
    ...(Array.isArray(manifest.replaceLegacyCommands)
      ? manifest.replaceLegacyCommands
      : []),
    `skills/${manifest.skill}/hooks/`,
    `skills/${manifest.skill}/adapters/`,
  ];

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
        if (commandMatchesLegacy(handler?.command, needles)) {
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
  const replaceNeedles = [
    ...legacy,
    `skills/${manifest.skill}/adapters/`,
    // Hook scripts live under the skill, not under an adapter. Without this the
    // needles stop matching the moment a script moves, and re-installing appends
    // a second copy of every hook instead of replacing the first.
    `skills/${manifest.skill}/hooks/`,
    "skills/goal/scripts/",
  ];

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
      if (id && incomingIds.has(String(id))) {
        replaced += 1;
        return false;
      }
      if (commandMatchesLegacy(cmd, replaceNeedles)) {
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
        ? `automatic on commit via .git/hooks/post-commit (disable: SELF_AGENTS_SKIP_PR_HOOK=1); base ${base} head ${branch}`
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
          sync: doPull || (process.env.SELF_AGENTS_PULL ?? process.env.GABE_AGENTS_PULL) === "1",
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
if (skills.length === 0) {
  console.error(`[self-agents] no skills found under ${skillsRoot}`);
  const staleRoots = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();
  reportBrokenSkillDirs(staleRoots, []);
  process.exit(1);
}

const targets = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();

// --verify-only: md5 every managed script at every destination and harness hook;
// do not write skills, hooks, or markers.
if (verifyOnly) {
  console.log(
    `[self-agents] verify-only: source=${skillsRoot} targets=${targets.length} skills=${skills.length}`,
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
    managedSkills: skills,
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
  results[target] = installInto(target, skills, skillsRoot);
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

const adapterReport = installAdapters(skills, [...targets], skillsRoot);

let brokenSkills = [];
let missingAssets = [];
let scriptIntegrity = null;
let integrityPath = null;
if (!dryRun) {
  // Warn about any unreadable skill dirs (including third-party dangling links).
  brokenSkills = reportBrokenSkillDirs(targets, skills) || [];
  // Hard-fail only when THIS pack's required nested assets are incomplete —
  // e.g. self-review without engineering-rules / eng-* lanes.
  missingAssets = reportMissingSkillAssets(targets, skills) || [];
  const managedBroken = brokenSkills.filter((b) =>
    skills.some((s) => b.includes(`/${s}`) || b.includes(`/${s} `) || b.endsWith(`/${s}`)),
  );
  if (missingAssets.length || managedBroken.length) {
    console.error(
      `[self-agents] install incomplete: ${managedBroken.length} managed broken skill dir(s), ${missingAssets.length} missing asset(s)`,
    );
    process.exit(1);
  }
  console.log(
    `[self-agents] asset integrity ok (${skills.length} skills, self-review multi-lane assets present)`,
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
    managedSkills: skills,
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
  const changed = instructionReport.filter((r) => r.action !== "present");
  if (changed.length) {
    console.log(
      `[self-agents] router directive ${dryRun ? "would be written to" : "written to"} ${changed.length} file(s):`,
    );
    for (const r of changed) console.log(`    - ${r.path} (${r.action})`);
  } else {
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
    "[self-agents] --local: agent state goes under <repo>/.agents (export SELF_AGENTS_LOCAL=1 for hooks and skills)",
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
  `[self-agents] mode=${mode} installed ${skills.length + mdscriptSkills.length} skills into ${Object.keys(results).length} target(s)`,
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
