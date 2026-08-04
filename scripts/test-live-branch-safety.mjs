#!/usr/bin/env node
/**
 * The installer checks out a long-lived live/* branch. Two ways that used to
 * relocate the working tree onto stale content:
 *
 *   1. a live/* branch that exists locally but is behind origin/<base> was
 *      checked out and never synced, so the install ran against old files and
 *      reported current skills as missing;
 *   2. switching away from a branch holding commits the live branch does not
 *      contain, which hides them with no warning.
 *
 * Both are asserted here against a real throwaway repo.
 *
 * Usage:
 *   node scripts/test-live-branch-safety.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const install = join(pkgRoot, "scripts", "install.mjs");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok  ", msg);
  }
}

function git(cwd, ...args) {
  return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}
function head(cwd) {
  return git(cwd, "rev-parse", "HEAD").stdout.trim();
}
function branchOf(cwd) {
  return git(cwd, "branch", "--show-current").stdout.trim();
}

const home = mkdtempSync(join(tmpdir(), "self-live-branch-"));
const origin = join(home, "origin.git");
const work = join(home, "work");

// --- build an origin with main at two commits ---
mkdirSync(origin, { recursive: true });
git(origin, "init", "--bare", "--initial-branch=main");
mkdirSync(work, { recursive: true });
git(work, "init", "--initial-branch=main");
git(work, "config", "user.email", "t@t.t");
git(work, "config", "user.name", "t");
git(work, "remote", "add", "origin", origin);

writeFileSync(join(work, "old.txt"), "old\n");
git(work, "add", "-A");
git(work, "commit", "-qm", "first");
const firstSha = head(work);
git(work, "push", "-q", "origin", "main");

// The live branch is created here, then main moves on — the stale-branch setup.
git(work, "branch", "live/testhost");
git(work, "push", "-q", "origin", "live/testhost");

writeFileSync(join(work, "new.txt"), "new\n");
git(work, "add", "-A");
git(work, "commit", "-qm", "second (only on main)");
const mainSha = head(work);
git(work, "push", "-q", "origin", "main");

assert(firstSha !== mainSha, "setup: main advanced past the live branch");
assert(existsSync(join(work, "new.txt")), "setup: new.txt present on main");

// --- run the installer against this repo, live-branch logic enabled ---
const env = {
  ...process.env,
  HOME: home,
  AGENTS_HOME: join(home, ".agents"),
  SELF_LIVE_BRANCH: "live/testhost",
  SELF_REPO_URL: origin,
};
const r = spawnSync(
  process.execPath,
  [install, "--live", "--live-root", work, "--target", join(home, "skills"),
   "--no-instructions", "--no-mdscript", "--no-adapters"],
  { encoding: "utf8", env, cwd: pkgRoot },
);
const out = `${r.stdout || ""}\n${r.stderr || ""}`;

// --- the assertions that matter ---
assert(
  existsSync(join(work, "new.txt")),
  "installer must not leave the tree without main's newest file",
);

const finalSha = head(work);
const reachable = git(work, "merge-base", "--is-ancestor", mainSha, finalSha).status === 0;
assert(
  reachable,
  `every commit that was present before the install is still reachable (was ${mainSha.slice(0, 7)}, now on ${branchOf(work)} @ ${finalSha.slice(0, 7)})`,
);

// Either outcome is acceptable, as long as content is not rolled back:
//   - the live branch got synced with origin/main and checked out, or
//   - the installer declined to switch and stayed put.
const onLive = branchOf(work) === "live/testhost";
const declined = /staying on|kept-current/.test(out);
assert(
  onLive || declined,
  `installer either synced the live branch or declined to switch (branch=${branchOf(work)})`,
);
if (onLive) {
  assert(
    reachable,
    "when it does switch to live/*, that branch contains origin/main",
  );
}

rmSync(home, { recursive: true, force: true });

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nok: live-branch checkout never rolls the working tree back");
