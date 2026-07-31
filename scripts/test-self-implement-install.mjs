#!/usr/bin/env node
/**
 * Assert the self-implement engineering-rules construction tree is complete.
 *
 * Usage:
 *   node scripts/test-self-implement-install.mjs
 *   node scripts/test-self-implement-install.mjs ~/.agents/skills/self-implement
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const defaultRoot = join(pkgRoot, "skills", "self-implement");
const root = resolve(process.argv[2] || defaultRoot);
const reviewRules = join(pkgRoot, "skills", "self-review", "references", "engineering-rules");

const required = [
  "SKILL.md",
  "workflows/select-implementation-rules.md",
  "workflows/select-language-framework-rules.md",
  "workflows/apply-selected-engineering-rules.md",
  "workflows/engineering-rules/apply-engineering-rules.mdscript.md",
  "references/implementation-rules-catalog.md",
];

const implPacks = [
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

for (const pack of implPacks) {
  required.push(`workflows/engineering-rules/impl-${pack}.mdscript.md`);
}

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

// relative path from each impl pack entrypoint must resolve to shared rules
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
    "[test-self-implement-install] relative path from impl packs to self-review rules broken:",
    relRules,
  );
  process.exit(1);
}

console.log(
  `[test-self-implement-install] ok ${root} (${implPacks.length} impl packs, ${ruleFiles.length} shared rules)`,
);
