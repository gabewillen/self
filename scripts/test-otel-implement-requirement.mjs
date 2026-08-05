#!/usr/bin/env node
/**
 * Assert self-implement keeps non-negotiable OTEL telemetry requirements and
 * that the OTEL-omit recovery nest re-enters Define Implementation Contract.
 *
 * Usage:
 *   node scripts/test-otel-implement-requirement.mjs
 *   node scripts/test-otel-implement-requirement.mjs /path/to/skills/self-implement
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const defaultRoot = join(pkgRoot, "skills", "self-implement");
const root = resolve(process.argv[2] || defaultRoot);
const reviewCore = join(
  pkgRoot,
  "skills",
  "self-review",
  "references",
  "engineering-rules",
  "core.rules.md",
);

const skill = join(root, "SKILL.md");
const contract = join(root, "workflows", "implementation-contract.mdscript.md");
const verify = join(root, "workflows", "verify-real-proof.mdscript.md");

const missing = [skill, contract, verify, reviewCore].filter((p) => !existsSync(p));
if (missing.length) {
  console.error("[test-otel-implement-requirement] missing files:");
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

function fail(msg) {
  console.error("[test-otel-implement-requirement]", msg);
  process.exit(1);
}

const skillText = readFileSync(skill, "utf8");
const contractText = readFileSync(contract, "utf8");
const verifyText = readFileSync(verify, "utf8");
const coreText = readFileSync(reviewCore, "utf8");

if (!/OpenTelemetry \(OTEL\).*non-negotiable|non-negotiable.*OpenTelemetry \(OTEL\)/s.test(skillText)) {
  fail("SKILL.md must require OpenTelemetry (OTEL) as non-negotiable");
}

if (!/non-negotiable.*`\{\{contract_postconditions\}\}`|non-negotiable `\{\{contract_postconditions\}\}`/.test(contractText)
  && !/non-negotiable `\{\{contract_postconditions\}\}` and `\{\{contract_invariants\}\}`/.test(contractText)) {
  fail("implementation-contract must mark OTEL as non-negotiable contract postcondition/invariant");
}

if (!/emit telemetry through OpenTelemetry \(OTEL\)/.test(contractText)) {
  fail("Implement Narrowly must require emit telemetry through OpenTelemetry (OTEL)");
}

if (!/verify OpenTelemetry \(OTEL\) instrumentation/.test(verifyText)) {
  fail("verify-real-proof must verify OpenTelemetry (OTEL) instrumentation");
}

if (!/# CORE-OBS-001 MUST OpenTelemetry Telemetry/.test(coreText)) {
  fail("core.rules.md must define CORE-OBS-001 MUST OpenTelemetry Telemetry");
}

// OTEL-omit recovery: set blocker → repair → re-enter Define Implementation Contract
const omitIdx = contractText.indexOf("if the planned edit omits OTEL instrumentation");
if (omitIdx < 0) {
  fail("implementation-contract missing OTEL-omit recovery condition");
}
const omitWindow = contractText.slice(omitIdx, omitIdx + 600);
if (!/set `\{\{blocker\}\}` to `OTEL telemetry is non-negotiable/.test(omitWindow)) {
  fail("OTEL-omit branch must set {{blocker}} for missing instrumentation");
}
if (!/repair the contract and implementation plan to include OTEL/.test(omitWindow)) {
  fail("OTEL-omit branch must repair the plan to include OTEL");
}
if (!/\[Define Implementation Contract\]\(#define-implementation-contract\)/.test(omitWindow)) {
  fail(
    "OTEL-omit branch must re-enter via [Define Implementation Contract](#define-implementation-contract)",
  );
}

// verify missing-OTEL recovery re-enters Verify Real Proof
const missIdx = verifyText.indexOf("if OTEL telemetry is missing");
if (missIdx < 0) {
  fail("verify-real-proof missing OTEL-missing recovery condition");
}
const missWindow = verifyText.slice(missIdx, missIdx + 400);
if (!/\[Verify Real Proof\]\(#verify-real-proof\)/.test(missWindow)) {
  fail("OTEL-missing verify branch must re-enter via [Verify Real Proof](#verify-real-proof)");
}

console.log(
  `[test-otel-implement-requirement] ok ${root} (OTEL non-negotiable + recovery re-entry)`,
);
