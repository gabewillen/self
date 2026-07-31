#!/usr/bin/env node
/**
 * Assert the two agent-home derivations agree.
 *
 * scripts/agent-home.mjs (what the skills run) and goal-lib.ts (what the hooks
 * use) must resolve the same path for the same directory. When they drift, a
 * run is written where the stop hook never looks and the loop dies silently.
 *
 * Usage: node scripts/test-agent-home.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const GOAL_LIB = join(here, "..", "skills", "self-goal", "hooks", "goal-lib.ts");

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 23) {
  console.log(
    `SKIP: node ${process.versions.node} cannot import .ts without a loader; run on node >= 23`,
  );
  process.exit(0);
}

const { projectHome: scriptHome, projectSlug: scriptSlug } = await import("./agent-home.mjs");
const { agentProjectHome: libHome } = await import(GOAL_LIB);

const git = (cwd, ...argv) =>
  execFileSync("git", ["-C", cwd, ...argv], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

const tmp = mkdtempSync(join(tmpdir(), "self-agent-home-"));
const failures = [];
const checks = [];

function check(name, root, env = {}) {
  const saved = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const a = scriptHome(root);
  const b = libHome(root);
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  checks.push({ name, a, b });
  if (a !== b) failures.push(`${name}\n    agent-home.mjs: ${a}\n    goal-lib.ts   : ${b}`);
  return a;
}

try {
  // plain repository
  const repo = join(tmp, "voice-agent");
  mkdirSync(repo);
  git(repo, "init", "-q");
  git(repo, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "init");
  const repoHome = check("plain repository", repo, { AGENTS_HOME: undefined, SELF_AGENTS_LOCAL: undefined });

  // worktree of that repository must share the repository's home
  const wt = join(tmp, "worktrees", "nc55");
  git(repo, "worktree", "add", "-q", wt, "-b", "nc55");
  const wtHome = check("worktree", wt, { AGENTS_HOME: undefined, SELF_AGENTS_LOCAL: undefined });
  if (wtHome !== repoHome) {
    failures.push(`worktree does not share the repository home\n    repo: ${repoHome}\n    wt  : ${wtHome}`);
  }

  // not a repository at all
  const plain = join(tmp, "loose-dir");
  mkdirSync(plain);
  check("non-git directory", plain, { AGENTS_HOME: undefined, SELF_AGENTS_LOCAL: undefined });

  // name needing sanitizing
  const odd = join(tmp, "weird name (v2)");
  mkdirSync(odd);
  check("name with spaces and parens", odd, { AGENTS_HOME: undefined, SELF_AGENTS_LOCAL: undefined });

  // $AGENTS_HOME override
  check("AGENTS_HOME override", repo, { AGENTS_HOME: join(tmp, "alt-home"), SELF_AGENTS_LOCAL: undefined });

  // --local / SELF_AGENTS_LOCAL
  check("local mode", repo, { SELF_AGENTS_LOCAL: "1", AGENTS_HOME: undefined });

  // the slug itself, for the worktree case that caused the miss
  const slug = scriptSlug(wt);
  if (slug !== "voice-agent") {
    failures.push(`worktree slug is "${slug}", expected "voice-agent" (the main repository)`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

for (const c of checks) console.log(`  ${c.a === c.b ? "ok  " : "FAIL"} ${c.name} -> ${c.a}`);
if (failures.length) {
  console.error(`\n${failures.length} mismatch(es):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed; both derivations agree`);
