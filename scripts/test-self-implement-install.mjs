#!/usr/bin/env node
/**
 * Assert the self-implement engineering-rules construction tree is complete.
 *
 * Usage:
 *   node scripts/test-self-implement-install.mjs
 *   node scripts/test-self-implement-install.mjs ~/.agents/skills/self-implement
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const defaultRoot = join(pkgRoot, "skills", "self-implement");
const root = resolve(process.argv[2] || defaultRoot);
const reviewRules = join(pkgRoot, "skills", "self-review", "references", "engineering-rules");

const required = [
  "SKILL.md",
  "workflows/select-implementation-rules.mdscript.md",
  "workflows/apply-selected-engineering-rules.mdscript.md",
  "workflows/engineering-rules/apply-engineering-rules.mdscript.md",
  "references/implementation-rules-catalog.md",
];

const ruleFiles = [
  "core",
  "dbc",
  "patterns",
  "rust",
  "python",
  "typescript",
  "go",
  "cpp",
  "dart",
  "react",
  "flutter",
  "hono",
  "pulumi",
  "webcomponents",
  "xstate",
  "sml",
  "hsm",
];


const missing = required.filter((rel) => !existsSync(join(root, rel)));
if (missing.length) {
  console.error("[test-self-implement-install] missing under", root);
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

const missingRules = ruleFiles.filter(
  (r) => !existsSync(join(reviewRules, `${r}.rules.md`)),
);
if (missingRules.length) {
  console.error(
    "[test-self-implement-install] missing shared rule files under",
    reviewRules,
  );
  for (const m of missingRules) console.error("  -", `${m}.rules.md`);
  process.exit(1);
}

// the one rule-pack catalog must name every shared rule file
const catalog = readFileSync(join(root, "references", "implementation-rules-catalog.md"), "utf8");
const uncataloged = ruleFiles.filter((r) => !catalog.includes(`\`${r}.rules.md\``));
if (uncataloged.length) {
  console.error("[test-self-implement-install] catalog does not name:", uncataloged.join(", "));
  process.exit(1);
}

// relative path from the shared apply workflow must resolve to shared rules
const relRules = join(
  root,
  "workflows",
  "engineering-rules",
  "..",
  "..",
  "..",
  "self-review",
  "references",
  "engineering-rules",
  "core.rules.md",
);
if (!existsSync(relRules)) {
  console.error(
    "[test-self-implement-install] relative path from the shared apply workflow to self-review rules broken:",
    relRules,
  );
  process.exit(1);
}

console.log(
  `[test-self-implement-install] ok ${root} (${ruleFiles.length} cataloged rule packs)`,
);
