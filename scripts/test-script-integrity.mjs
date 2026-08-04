#!/usr/bin/env node
/**
 * Assert install script-md5 integrity helpers catch stale destinations.
 *
 * Usage:
 *   node scripts/test-script-integrity.mjs
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const install = join(pkgRoot, "scripts", "install.mjs");
const watchStop = join(
  pkgRoot,
  "skills",
  "self-watch",
  "hooks",
  "watch-stop.ts",
);

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

if (!existsSync(watchStop)) {
  console.error(`missing ${watchStop}`);
  process.exit(1);
}

const expected = md5(watchStop);
const root = mkdtempSync(join(tmpdir(), "self-integrity-"));
const skillHooks = join(root, "self-watch", "hooks");
mkdirSync(skillHooks, { recursive: true });
cpSync(watchStop, join(skillHooks, "watch-stop.ts"));
writeFileSync(join(skillHooks, "watch-stop.ts"), "// deliberately stale\n", "utf8");

const r = spawnSync(process.execPath, [install, "--verify-only", "--target", root], {
  encoding: "utf8",
  cwd: pkgRoot,
});
const out = `${r.stdout || ""}\n${r.stderr || ""}`;
rmSync(root, { recursive: true, force: true });

if (r.status === 0) {
  console.error("expected verify-only to fail on stale md5, got exit 0");
  console.error(out);
  process.exit(1);
}
if (!out.includes("md5-mismatch") && !out.includes("STALE")) {
  console.error("expected STALE/md5-mismatch in output");
  console.error(out);
  process.exit(1);
}
if (!out.includes(expected) && !out.includes("watch-stop.ts")) {
  console.error("expected watch-stop.ts reference in stale report");
  console.error(out);
  process.exit(1);
}

// Build and verify a clean isolated copy. Never inspect or rewrite a user's
// live ~/.agents receipt, hooks, or skill roots.
const cleanHome = mkdtempSync(join(tmpdir(), "self-integrity-home-"));
const cleanRoot = join(cleanHome, "skills");
const cleanEnv = {
  ...process.env,
  HOME: cleanHome,
  AGENTS_HOME: join(cleanHome, ".agents"),
  SELF_LIVE_BRANCH: "0",
  GABE_LIVE_BRANCH: "0",
};
const installClean = spawnSync(
  process.execPath,
  [
    install,
    "--copy",
    "--target",
    cleanRoot,
    "--no-instructions",
    "--no-mdscript",
    "--no-adapters",
  ],
  { encoding: "utf8", cwd: pkgRoot, env: cleanEnv },
);
if (installClean.status !== 0) {
  console.error("expected isolated copy install to pass");
  console.error(`${installClean.stdout || ""}\n${installClean.stderr || ""}`);
  rmSync(cleanHome, { recursive: true, force: true });
  process.exit(1);
}
const clean = spawnSync(
  process.execPath,
  [install, "--verify-only", "--target", cleanRoot],
  { encoding: "utf8", cwd: pkgRoot, env: cleanEnv },
);
rmSync(cleanHome, { recursive: true, force: true });
if (clean.status !== 0) {
  console.error("expected isolated --verify-only to pass on a clean copy");
  console.error(`${clean.stdout || ""}\n${clean.stderr || ""}`);
  process.exit(1);
}

console.log("ok: script integrity detects stale md5 and isolated clean install verifies");
console.log(`    source watch-stop.ts md5=${expected}`);
