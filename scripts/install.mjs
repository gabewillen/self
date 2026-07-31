#!/usr/bin/env node
/**
 * Install @gabewillen/agents skills + per-adapter scripts/hooks.
 *
 * Modes:
 *   live (default)  Clone/update a living git checkout and symlink each skill
 *                   into agent skill dirs. Edits are real repo files — commit/push.
 *   copy            Snapshot-copy skills (immutable install; no shared git tree)
 *
 * Living checkout default: ~/.agents/repos/gabewillen-agents
 * Override: GABE_AGENTS_LIVE_ROOT, --live-root <path>
 * Repo URL: GABE_AGENTS_REPO_URL (default github.com/gabewillen/agents.git)
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
 *   GABE_AGENTS_INSTALL=0 npm i
 *   GABE_AGENTS_MODE=copy npm i
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
import { dirname, join, resolve, delimiter, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const DEFAULT_REPO_URL = "https://github.com/gabewillen/agents.git";
const DEFAULT_LIVE_ROOT = join(homedir(), ".agents", "repos", "gabewillen-agents");
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
  process.env.GABE_AGENTS_LOCAL === "1" ||
  process.env.GABE_AGENTS_LOCAL === "true";
const skipInstructions =
  args.includes("--no-instructions") ||
  process.env.GABE_AGENTS_INSTRUCTIONS === "0";
const skipMdscript =
  args.includes("--no-mdscript") ||
  process.env.GABE_AGENTS_MDSCRIPT === "0" ||
  process.env.GABE_AGENTS_MDSCRIPT === "false";

const modeEnv = (process.env.GABE_AGENTS_MODE || "").toLowerCase();
const mode = args.includes("--copy") || modeEnv === "copy"
  ? "copy"
  : args.includes("--live") || modeEnv === "live" || modeEnv === "" || modeEnv === "symlink"
    ? "live"
    : "live";

if (process.env.GABE_AGENTS_INSTALL === "0" || process.env.GABE_AGENTS_INSTALL === "false") {
  console.log("[gabe-agents] skip install (GABE_AGENTS_INSTALL=0)");
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
 * Else use GABE_AGENTS_LIVE_ROOT / --live-root / default clone path.
 */
function resolveLiveRoot() {
  if (explicitLiveRoot) return explicitLiveRoot;
  if (process.env.GABE_AGENTS_LIVE_ROOT) return resolve(process.env.GABE_AGENTS_LIVE_ROOT);

  const pkgGit = gitTopLevel(pkgRoot);
  if (pkgGit) {
    // If this package is already a clone (dev or git dep), live there.
    const hasSkills = existsSync(join(pkgGit, "skills"));
    if (hasSkills) return pkgGit;
  }
  return DEFAULT_LIVE_ROOT;
}

function ensureLiveCheckout(liveRoot) {
  const repoUrl =
    process.env.GABE_AGENTS_REPO_URL ||
    process.env.npm_package_repository_url?.replace(/^git\+/, "") ||
    DEFAULT_REPO_URL;

  if (dryRun) {
    console.log(`[dry-run] ensure live checkout at ${liveRoot} from ${repoUrl}`);
    return { liveRoot, repoUrl, action: existsSync(liveRoot) ? "exists" : "clone" };
  }

  ensureDir(dirname(liveRoot));

  if (existsSync(liveRoot) && isGitRepo(liveRoot)) {
    if (doPull || process.env.GABE_AGENTS_PULL === "1") {
      console.log(`[gabe-agents] git pull --ff-only in ${liveRoot}`);
      const r = trySh("git", ["-C", liveRoot, "pull", "--ff-only"]);
      if (!r.ok) {
        console.warn(`[gabe-agents] pull failed (continuing with local tree): ${r.err}`);
      }
    }
    return { liveRoot, repoUrl, action: "reuse" };
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
  console.log(`[gabe-agents] cloning ${repoUrl} -> ${liveRoot}`);
  sh("git", ["clone", repoUrl, liveRoot], { stdio: ["ignore", "inherit", "inherit"] });
  return { liveRoot, repoUrl, action: "clone" };
}

/**
 * Ensure a checkout of the mdscript repo and return its skills root.
 * Never fatal: the pack still installs if this repo is unreachable, so an
 * offline install degrades to "mdscript skills not refreshed" instead of
 * failing outright.
 */
function ensureMdscriptSkillsRoot() {
  if (skipMdscript) return null;
  const root =
    explicitMdscriptRoot ||
    (process.env.GABE_AGENTS_MDSCRIPT_ROOT
      ? resolve(process.env.GABE_AGENTS_MDSCRIPT_ROOT)
      : DEFAULT_MDSCRIPT_ROOT);
  const repoUrl = process.env.GABE_AGENTS_MDSCRIPT_REPO_URL || MDSCRIPT_REPO_URL;
  const skillsRoot = join(root, "skills");

  if (dryRun) {
    console.log(
      `[dry-run] ensure mdscript checkout at ${root} from ${repoUrl}`,
    );
    return existsSync(skillsRoot) ? skillsRoot : null;
  }

  if (existsSync(root) && isGitRepo(root)) {
    if (doPull || process.env.GABE_AGENTS_PULL === "1") {
      const r = trySh("git", ["-C", root, "pull", "--ff-only"]);
      if (!r.ok) {
        console.warn(`[gabe-agents] mdscript pull failed (using local tree)`);
      }
    }
  } else if (existsSync(root)) {
    console.warn(
      `[gabe-agents] mdscript root exists but is not a git repo: ${root}`,
    );
  } else {
    ensureDir(dirname(root));
    console.log(`[gabe-agents] cloning ${repoUrl} -> ${root}`);
    const r = trySh("git", ["clone", "--depth", "1", repoUrl, root]);
    if (!r.ok) {
      console.warn(
        `[gabe-agents] could not clone mdscript (${repoUrl}); ` +
          `mdscript-exec/mdscript-write not installed. ` +
          `Install them manually or re-run with network access.`,
      );
      return null;
    }
  }

  if (!existsSync(skillsRoot)) {
    console.warn(`[gabe-agents] no skills/ directory in ${root}`);
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
 * Missing lane/rules files leave gabe-review "installed" but unable to select
 * engineering or language lanes.
 */
const REQUIRED_SKILL_ASSETS = {
  "gabe-review": [
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
  ],
  "gabe-hsm-review": ["SKILL.md", "workflows/triage.mdscript.md"],
  "gabe-common": ["SKILL.md", "workflows/goal-mdscript.md", "workflows/file-task-comments.md"],
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
    `[gabe-agents] BROKEN: ${missing.length} required skill asset(s) missing after install:`,
  );
  for (const m of missing.slice(0, 40)) console.error(`    - ${m}`);
  if (missing.length > 40) {
    console.error(`    … and ${missing.length - 40} more`);
  }
  console.error(
    "[gabe-agents] re-run from a checkout that contains the multi-lane gabe-review tree, or use --copy from this package",
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
    `[gabe-agents] BROKEN: ${broken.length} skill dir(s) have no readable SKILL.md:`,
  );
  for (const b of broken) console.error(`    - ${b}`);
  console.error(
    "[gabe-agents] a symlinked skill needs its live root present on THIS machine; re-run install after fixing the source",
  );
  return broken;
}

const ROUTER_DIRECTIVE =
  "- ALWAYS enter through the `gabe` router skill. Run it first on every request, before " +
  "planning or answering, and let it choose the role: it routes to gabe-orchestrate, " +
  "gabe-implement, gabe-review, gabe-watch, gabe-goal, gabe-hsm-review, and gabe-automate.";
const ROUTER_BLOCK_START = "<!-- gabe-agents:router -->";
const ROUTER_BLOCK_END = "<!-- /gabe-agents:router -->";
const ROUTER_BLOCK_RE =
  /<!-- gabe-agents:router -->[\s\S]*?<!-- \/gabe-agents:router -->\n?/;
/** Pre-marker directive, so the first upgrade adopts it instead of duplicating it. */
const LEGACY_DIRECTIVE_RE =
  /^.*ALWAYS use (?:the )?[`'"]?gabe[`'"]? router skill.*$\n?/im;

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
 * on "some gabe-router text is present" would pin everyone to whatever they
 * installed first.
 */
function applyRouterDirective(existing, block) {
  if (ROUTER_BLOCK_RE.test(existing)) {
    const next = existing.replace(ROUTER_BLOCK_RE, block);
    return next === existing
      ? { body: existing, action: "present" }
      : { body: next, action: "updated" };
  }
  if (LEGACY_DIRECTIVE_RE.test(existing)) {
    return { body: existing.replace(LEGACY_DIRECTIVE_RE, block), action: "updated" };
  }
  if (!existing) {
    return { body: `# Global agent instructions\n\n${block}`, action: "created" };
  }
  return {
    body: `${existing.replace(/\n*$/, "")}\n\n${block}`,
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
 * gabe-common tells agents to run `{{skills_root}}/../scripts/agent-home.mjs`.
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

function installInto(targetRoot, skills, skillsRoot) {
  ensureDir(targetRoot);
  installAgentHomeScript(targetRoot, skillsRoot);
  const installed = [];
  for (const skill of skills) {
    const src = join(skillsRoot, skill);
    const dest = join(targetRoot, skill);
    if (!existsSync(join(src, "SKILL.md"))) {
      console.warn(`[gabe-agents] skip missing skill source ${src}`);
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
  existing.metadata["gabe-agents"] = {
    ...(existing.metadata["gabe-agents"] || {}),
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

  const managedPrefix = `gabe-agents:${manifest.skill}:`;
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
  existing.metadata["gabe-agents"] = {
    ...(existing.metadata["gabe-agents"] || {}),
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
      console.warn(`[gabe-agents] adapter source missing, skipping: ${from}`);
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
    console.log("[gabe-agents] skip adapters (--no-adapters)");
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
        `[gabe-agents] cursor hooks for ${skill}: +${result.added} replaced~${result.replaced} -> ${result.hooksPath} (runtime ${runtime.path})`,
      );
    } else if (manifestPath && NESTED_HOOK_TARGETS[readJson(manifestPath, {})?.target]) {
      const manifest = { ...readJson(manifestPath, {}), skill, adapter };
      const target = NESTED_HOOK_TARGETS[manifest.target];
      const harnessHome = join(homedir(), target.home);
      if (!existsSync(harnessHome)) {
        entry.actions.push({ type: "skipped", note: `${target.home} not installed` });
        console.log(`[gabe-agents] adapter ${skill}/${adapter}: skipped, no ${target.home}`);
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
        `[gabe-agents] ${adapter} hooks for ${skill}: +${result.added} replaced~${result.replaced} -> ${result.hooksPath} (runtime ${runtime.path})`,
      );
    } else if (adapter !== "cursor") {
      entry.actions.push({
        type: "copied-with-skill",
        note: `adapter '${adapter}' files ship inside skill; add adapters/${adapter}/install.json for extra side installs`,
      });
      console.log(
        `[gabe-agents] adapter ${skill}/${adapter}: shipped with skill (no special wiring)`,
      );
    }

    report.push(entry);
  }

  return { adapters: report, cursorSkillRoot, skillRoots: roots };
}

function writeLiveMarker(liveRoot, skills) {
  const marker = {
    mode: "live",
    live_root: liveRoot,
    skills,
    updated_at: new Date().toISOString(),
    howto: {
      edit: `edit files under ${liveRoot}/skills/<skill>/`,
      commit: `git -C ${liveRoot} add -A && git -C ${liveRoot} commit && git -C ${liveRoot} push`,
      update: `node ${join(pkgRoot, "scripts/install.mjs")} --pull`,
      re_symlink: `node ${join(pkgRoot, "scripts/install.mjs")} --live`,
    },
  };
  const markerPath = join(homedir(), ".agents", "gabe-agents-live.json");
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
    liveMeta = { liveRoot, action: "pkg-root", repoUrl: "local-package" };
    if (doPull && isGitRepo(pkgRoot)) {
      console.log(`[gabe-agents] --pull on package root ${pkgRoot}`);
      if (!dryRun) {
        const r = trySh("git", ["-C", pkgRoot, "pull", "--ff-only"]);
        if (!r.ok) console.warn(`[gabe-agents] pull failed: ${r.err}`);
      }
    }
  } else {
    liveMeta = ensureLiveCheckout(liveRoot);
  }
}

const skillsRoot = skillsRootForMode(liveRoot);
const skills = listSkillDirs(skillsRoot);
if (skills.length === 0) {
  console.error(`[gabe-agents] no skills found under ${skillsRoot}`);
  const staleRoots = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();
  reportBrokenSkillDirs(staleRoots, []);
  process.exit(1);
}

const targets = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();
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
if (!dryRun) {
  // Warn about any unreadable skill dirs (including third-party dangling links).
  brokenSkills = reportBrokenSkillDirs(targets, skills) || [];
  // Hard-fail only when THIS pack's required nested assets are incomplete —
  // e.g. gabe-review without engineering-rules / eng-* lanes.
  missingAssets = reportMissingSkillAssets(targets, skills) || [];
  const managedBroken = brokenSkills.filter((b) =>
    skills.some((s) => b.includes(`/${s}`) || b.includes(`/${s} `) || b.endsWith(`/${s}`)),
  );
  if (missingAssets.length || managedBroken.length) {
    console.error(
      `[gabe-agents] install incomplete: ${managedBroken.length} managed broken skill dir(s), ${missingAssets.length} missing asset(s)`,
    );
    process.exit(1);
  }
  console.log(
    `[gabe-agents] install integrity ok (${skills.length} skills, gabe-review multi-lane assets present)`,
  );
}

let instructionReport = [];
if (localState) {
  console.log(
    "[gabe-agents] --local: skipping the global router directive; add it to this project's AGENTS.md yourself",
  );
} else if (skipInstructions) {
  console.log("[gabe-agents] skipping the router directive (--no-instructions)");
} else {
  instructionReport = ensureRouterDirective();
  const changed = instructionReport.filter((r) => r.action !== "present");
  if (changed.length) {
    console.log(
      `[gabe-agents] router directive ${dryRun ? "would be written to" : "written to"} ${changed.length} file(s):`,
    );
    for (const r of changed) console.log(`    - ${r.path} (${r.action})`);
  } else {
    console.log(
      `[gabe-agents] router directive already present in ${instructionReport.length} instruction file(s)`,
    );
  }
}

let markerPath = null;
if (mode === "live") {
  markerPath = writeLiveMarker(liveRoot, skills);
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
    "[gabe-agents] --local: agent state goes under <repo>/.agents (export GABE_AGENTS_LOCAL=1 for hooks and skills)",
  );
} else {
  console.log(
    "[gabe-agents] agent state under ~/.agents (or $AGENTS_HOME); working repositories stay clean",
  );
}

if (mdscriptSkills.length) {
  console.log(
    `[gabe-agents] + ${mdscriptSkills.length} mdscript skills from ${mdscriptSkillsRoot}`,
  );
} else if (!skipMdscript) {
  console.warn(
    `[gabe-agents] mdscript-exec/mdscript-write not installed — every skill header requires mdscript-exec`,
  );
}

console.log(
  `[gabe-agents] mode=${mode} installed ${skills.length + mdscriptSkills.length} skills into ${Object.keys(results).length} target(s)`,
);
if (mode === "live") {
  console.log(`[gabe-agents] live root: ${liveRoot}`);
  console.log(`[gabe-agents] edit skills in-place, then: git -C ${liveRoot} commit && git push`);
  if (markerPath) console.log(`[gabe-agents] live marker: ${markerPath}`);
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
  console.log(`[gabe-agents] package ${pkg.name}@${pkg.version}`);
} catch {
  // ignore
}
