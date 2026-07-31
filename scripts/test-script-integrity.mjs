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
const learnStop = join(
  pkgRoot,
  "skills",
  "gabe-common",
  "hooks",
  "learn-stop.ts",
);

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

if (!existsSync(learnStop)) {
  console.error(`missing ${learnStop}`);
  process.exit(1);
}

const expected = md5(learnStop);
const root = mkdtempSync(join(tmpdir(), "gabe-integrity-"));
const skillHooks = join(root, "gabe-common", "hooks");
mkdirSync(skillHooks, { recursive: true });
cpSync(learnStop, join(skillHooks, "learn-stop.ts"));
writeFileSync(join(skillHooks, "learn-stop.ts"), "// deliberately stale\n", "utf8");

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
if (!out.includes(expected) && !out.includes("learn-stop.ts")) {
  console.error("expected learn-stop.ts reference in stale report");
  console.error(out);
  process.exit(1);
}

// Clean machine: default verify-only must pass when install is healthy.
const clean = spawnSync(process.execPath, [install, "--verify-only"], {
  encoding: "utf8",
  cwd: pkgRoot,
});
if (clean.status !== 0) {
  console.error("expected clean --verify-only to pass on this machine");
  console.error(`${clean.stdout || ""}\n${clean.stderr || ""}`);
  process.exit(1);
}

console.log("ok: script integrity detects stale md5 and clean install verifies");
console.log(`    source learn-stop.ts md5=${expected}`);
