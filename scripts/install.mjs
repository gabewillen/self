#!/usr/bin/env node
/**
 * Install @gabewillen/agents skills into agent skill directories.
 *
 * Default target: ~/.agents/skills/<skill>
 * Also installs into detected agent homes when present:
 *   ~/.claude/skills, ~/.cursor/skills, ~/.codex/skills, ~/.copilot/skills
 *
 * Usage:
 *   node scripts/install.mjs
 *   node scripts/install.mjs --target ~/.agents/skills
 *   node scripts/install.mjs --dry-run
 *   GABE_AGENTS_INSTALL=0 npm i   # skip postinstall
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const skillsRoot = join(pkgRoot, "skills");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const targetIdx = args.indexOf("--target");
const explicitTarget = targetIdx >= 0 ? resolve(args[targetIdx + 1]) : null;

if (process.env.GABE_AGENTS_INSTALL === "0" || process.env.GABE_AGENTS_INSTALL === "false") {
  console.log("[gabe-agents] skip install (GABE_AGENTS_INSTALL=0)");
  process.exit(0);
}

function listSkillDirs(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => {
      const skillMd = join(root, name, "SKILL.md");
      return existsSync(skillMd);
    })
    .sort();
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function installInto(targetRoot, skills) {
  ensureDir(targetRoot);
  const installed = [];
  for (const skill of skills) {
    const src = join(skillsRoot, skill);
    const dest = join(targetRoot, skill);
    if (dryRun) {
      console.log(`[dry-run] ${src} -> ${dest}`);
      installed.push(dest);
      continue;
    }
    if (existsSync(dest)) {
      const st = statSync(dest);
      // Replace prior install (dir or symlink)
      rmSync(dest, { recursive: true, force: true });
      if (st.isSymbolicLink?.()) {
        // already removed
      }
    }
    cpSync(src, dest, { recursive: true });
    installed.push(dest);
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
  // Always install to ~/.agents/skills; only mirror into other agents if their home exists
  const roots = [join(home, ".agents", "skills")];
  for (const c of candidates.slice(1)) {
    const agentHome = dirname(c);
    if (existsSync(agentHome)) roots.push(c);
  }
  return [...new Set(roots)];
}

const skills = listSkillDirs(skillsRoot);
if (skills.length === 0) {
  console.error(`[gabe-agents] no skills found under ${skillsRoot}`);
  process.exit(1);
}

const targets = explicitTarget ? [explicitTarget] : detectAgentSkillRoots();
const results = {};
for (const target of targets) {
  results[target] = installInto(target, skills);
}

// Write a small install receipt next to the package for debugging
const receipt = {
  installed_at: new Date().toISOString(),
  package_root: pkgRoot,
  skills,
  targets: results,
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

console.log(`[gabe-agents] installed ${skills.length} skills into ${targets.length} target(s):`);
for (const [target, paths] of Object.entries(results)) {
  console.log(`  ${target}`);
  for (const p of paths) console.log(`    - ${p}`);
}

// Surface package.json name for lock tooling
try {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
  console.log(`[gabe-agents] package ${pkg.name}@${pkg.version}`);
} catch {
  // ignore
}
