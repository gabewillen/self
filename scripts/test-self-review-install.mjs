#!/usr/bin/env node
/**
 * Assert the self-review multi-lane tree is complete in the package source
 * (and optionally in an install destination).
 *
 * Usage:
 *   node scripts/test-self-review-install.mjs
 *   node scripts/test-self-review-install.mjs ~/.agents/skills/self-review
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const defaultRoot = join(pkgRoot, "skills", "self-review");
const root = resolve(process.argv[2] || defaultRoot);

const required = [
  "SKILL.md",
  "workflows/select-review-lanes.mdscript.md",
  "workflows/select-language-framework-lanes.mdscript.md",
  "workflows/triple-adversarial-blind-review.mdscript.md",
  "workflows/blind-reviewers/engineering-rules.mdscript.md",
"workflows/blind-reviewers/hsm.mdscript.md",
  "hsm/hsm.mdscript.md",
  "hsm/references/anti-patterns.md",
  "hsm/references/bindings.md",
  "hsm/references/check-patterns.md",
  "hsm/references/hsm-core-rules.md",
  "hsm/references/source-notes.md",
  "hsm/workflows/audit-actor-boundary.mdscript.md",
  "hsm/workflows/audit-control-flow.mdscript.md",
  "hsm/workflows/audit-hierarchy.mdscript.md",
  "hsm/workflows/audit-ownership.mdscript.md",
  "hsm/workflows/audit-reachability.mdscript.md",
  "hsm/workflows/audit-structure.mdscript.md",
  "hsm/workflows/audit-tests.mdscript.md",
  "hsm/workflows/audit-time-determinism.mdscript.md",
  "hsm/workflows/emit-findings.mdscript.md",
  "hsm/workflows/extract-model.mdscript.md",
  "hsm/workflows/request-waiver.mdscript.md",
  "hsm/workflows/triage.mdscript.md",
  "hsm/workflows/verify-findings.mdscript.md",
  "references/lane-catalog.md",
  "references/engineering-rules/SOURCE.md",
];

const engLanes = [
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

for (const lane of engLanes) {
  required.push(`workflows/blind-reviewers/eng-${lane}.mdscript.md`);
}
for (const r of ruleFiles) {
  required.push(`references/engineering-rules/${r}.rules.md`);
}

const missing = required.filter((rel) => !existsSync(join(root, rel)));
if (missing.length) {
  console.error(`[test-self-review-install] FAIL under ${root}`);
  for (const m of missing) console.error(`  missing: ${m}`);
  process.exit(1);
}
const nestedSkillManifests = ["hsm/SKILL.md"].filter((rel) =>
  existsSync(join(root, rel)),
);
if (nestedSkillManifests.length) {
  console.error(
    "[test-self-review-install] FAIL: internal HSM pack must not expose nested SKILL.md manifests",
  );
  for (const rel of nestedSkillManifests) console.error(`  forbidden: ${rel}`);
  process.exit(1);
}

const engCount = readdirSync(join(root, "workflows", "blind-reviewers")).filter(
  (n) => n.startsWith("eng-") && n.endsWith(".mdscript.md"),
).length;
const rulesCount = readdirSync(join(root, "references", "engineering-rules")).filter(
  (n) => n.endsWith(".rules.md"),
).length;

if (engCount < engLanes.length) {
  console.error(
    `[test-self-review-install] FAIL: expected >= ${engLanes.length} eng-* lanes, found ${engCount}`,
  );
  process.exit(1);
}
if (rulesCount < ruleFiles.length) {
  console.error(
    `[test-self-review-install] FAIL: expected >= ${ruleFiles.length} *.rules.md, found ${rulesCount}`,
  );
  process.exit(1);
}

console.log(
  `[test-self-review-install] ok ${root} (${engCount} eng lanes, ${rulesCount} rules files)`,
);
