#!/usr/bin/env node
/**
 * Typecheck the hook layer with a real compiler.
 *
 * The first version of this script shelled out to `bun build`, which transpiles
 * and discards types: it reported "clean" on constructed type errors and on the
 * exact defect it was written to catch (a Buffer passed to a string parser).
 * A guard that cannot fail is worse than no guard, so this runs tsc --noEmit.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const tsc = join(repoRoot, "node_modules", ".bin", "tsc");
const tsconfig = join(repoRoot, "tsconfig.json");

if (!existsSync(tsconfig)) {
  console.error("[typecheck-hooks] BROKEN: tsconfig.json is missing");
  process.exit(1);
}
if (!existsSync(tsc)) {
  console.error(
    "[typecheck-hooks] BROKEN: typescript is not installed; run `npm install` before this check",
  );
  process.exit(1);
}

const result = spawnSync(tsc, ["--noEmit", "--project", tsconfig], {
  encoding: "utf8",
  cwd: repoRoot,
});
if (result.error) {
  console.error(`[typecheck-hooks] BROKEN: could not run tsc: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(result.stdout ?? "");
  console.error(result.stderr ?? "");
  console.error("[typecheck-hooks] BROKEN: hook layer does not typecheck");
  process.exit(1);
}
console.log("ok: hook layer typechecks clean");
