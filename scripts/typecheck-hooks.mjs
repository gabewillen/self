#!/usr/bin/env node
/**
 * Compile every hook module. Nothing in this repo compiled the .ts hook layer,
 * so a Buffer passed to a string parser and two validators called with one of
 * their required arguments shipped and stayed invisible to `npm test`.
 */
import { readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const skillsRoot = join(here, "..", "skills");
const outDir = mkdtempSync(join(tmpdir(), "self-typecheck-"));
process.on("exit", () => {
  try {
    rmSync(outDir, { recursive: true, force: true });
  } catch {
    // best effort
  }
});

const entries = [];
for (const skill of readdirSync(skillsRoot)) {
  const hooks = join(skillsRoot, skill, "hooks");
  if (!existsSync(hooks)) continue;
  for (const file of readdirSync(hooks)) {
    if (file.endsWith(".ts")) entries.push(join(hooks, file));
  }
}
if (entries.length === 0) {
  console.error("[typecheck-hooks] BROKEN: no hook modules found");
  process.exit(1);
}

const result = spawnSync(
  "bun",
  ["build", "--target=node", "--outdir", outDir, ...entries],
  { encoding: "utf8" },
);
if (result.error || result.status !== 0) {
  console.error(result.stdout ?? "");
  console.error(result.stderr ?? "");
  console.error(`[typecheck-hooks] BROKEN: ${entries.length} hook module(s) failed to build`);
  process.exit(1);
}
console.log(`ok: ${entries.length} hook module(s) build clean`);
