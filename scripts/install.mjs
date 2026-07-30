#!/usr/bin/env node
/**
 * Install @gabewillen/agents skills + per-adapter scripts/hooks.
 *
 * Skills land in agent skill dirs (default ~/.agents/skills and detected homes).
 * When a skill has adapters/<adapter>/, those scripts are installed and wired:
 *
 *   adapters/cursor/hooks.json  -> merges into ~/.cursor/hooks.json
 *   adapters/<name>/install.json -> optional extra copy targets
 *   adapters/<name>/            -> copied with the skill tree
 *
 * Usage:
 *   node scripts/install.mjs
 *   node scripts/install.mjs --target ~/.agents/skills
 *   node scripts/install.mjs --dry-run
 *   node scripts/install.mjs --no-adapters
 *   GABE_AGENTS_INSTALL=0 npm i
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { dirname, join, resolve, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const skillsRoot = join(pkgRoot, "skills");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noAdapters = args.includes("--no-adapters");
const targetIdx = args.indexOf("--target");
const explicitTarget = targetIdx >= 0 ? resolve(args[targetIdx + 1]) : null;

if (process.env.GABE_AGENTS_INSTALL === "0" || process.env.GABE_AGENTS_INSTALL === "false") {
  console.log("[gabe-agents] skip install (GABE_AGENTS_INSTALL=0)");
  process.exit(0);
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
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (ent.isFile()) {
        const looksExec =
          ent.name.endsWith(".sh") ||
          ent.name === "review-snapshot" ||
          (!ent.name.includes(".") &&
            !ent.name.endsWith(".ts") &&
            !ent.name.endsWith(".json") &&
            !ent.name.endsWith(".md") &&
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

function installInto(targetRoot, skills) {
  ensureDir(targetRoot);
  const installed = [];
  for (const skill of skills) {
    const src = join(skillsRoot, skill);
    const dest = join(targetRoot, skill);
    if (dryRun) {
      console.log(`[dry-run] skill ${src} -> ${dest}`);
      installed.push(dest);
      continue;
    }
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    chmodTreeExecutables(dest);
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

function listAdapterNames(skillSrc) {
  const adaptersRoot = join(skillSrc, "adapters");
  if (!existsSync(adaptersRoot)) return [];
  return readdirSync(adaptersRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function discoverAdapters(skills) {
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
    `skills/${manifest.skill}/adapters/cursor/`,
    "skills/goal/scripts/",
  ];

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
      if (commandMatchesLegacy(cmd, replaceNeedles)) {
        replaced += 1;
        return false;
      }
      return true;
    });

    for (const entry of entries) {
      const scriptRel = entry.script || entry.command;
      if (!scriptRel) continue;
      const scriptAbs = join(skillInstallDir, "adapters", "cursor", scriptRel);
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
    ensureDir(dirname(to));
    if (existsSync(from) && statSync(from).isDirectory()) {
      ensureDir(to);
      cpSync(from, to, { recursive: true });
    } else if (existsSync(from)) {
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

function installAdapters(skills, skillRoots) {
  if (noAdapters) {
    console.log("[gabe-agents] skip adapters (--no-adapters)");
    return { adapters: [] };
  }

  const discovered = discoverAdapters(skills);
  const report = [];
  const roots = [...skillRoots];
  const cursorSkillRoot = preferCursorSkillRoot(roots);

  if (discovered.some((d) => d.adapter === "cursor") && !roots.includes(cursorSkillRoot)) {
    if (!dryRun) {
      installInto(cursorSkillRoot, skills);
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
        installInto(cursorSkillRoot, [skill]);
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

const adapterReport = installAdapters(skills, [...targets]);

const receipt = {
  installed_at: new Date().toISOString(),
  package_root: pkgRoot,
  skills,
  targets: results,
  adapters: adapterReport,
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

console.log(`[gabe-agents] installed ${skills.length} skills into ${Object.keys(results).length} target(s):`);
for (const [target, paths] of Object.entries(results)) {
  console.log(`  ${target}`);
  for (const p of paths) console.log(`    - ${p}`);
}

try {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
  console.log(`[gabe-agents] package ${pkg.name}@${pkg.version}`);
} catch {
  // ignore
}
