#!/usr/bin/env node
/**
 * Assert self-implement and self-review keep non-negotiable OTEL telemetry
 * requirements, require cardinality analysis, and re-enter recovery states.
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
const engCore = join(
  pkgRoot,
  "skills",
  "self-review",
  "workflows",
  "blind-reviewers",
  "eng-core.mdscript.md",
);

const missing = [skill, contract, verify, reviewCore, engCore].filter(
  (p) => !existsSync(p),
);
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
const engCoreText = readFileSync(engCore, "utf8");

if (!/OpenTelemetry \(OTEL\).*non-negotiable|non-negotiable.*OpenTelemetry \(OTEL\)/s.test(skillText)) {
  fail("SKILL.md must require OpenTelemetry (OTEL) as non-negotiable");
}

if (!/cardinality analysis/.test(skillText)) {
  fail("self-implement SKILL.md must require OTEL cardinality analysis");
}

if (!/non-negotiable.*`\{\{contract_postconditions\}\}`|non-negotiable `\{\{contract_postconditions\}\}`/.test(contractText)
  && !/non-negotiable `\{\{contract_postconditions\}\}` and `\{\{contract_invariants\}\}`/.test(contractText)) {
  fail("implementation-contract must mark OTEL as non-negotiable contract postcondition/invariant");
}

if (!/require cardinality analysis for every new or changed OTEL/.test(contractText)) {
  fail("implementation-contract must require cardinality analysis for OTEL signals");
}

if (!/emit telemetry through OpenTelemetry \(OTEL\)/.test(contractText)) {
  fail("Implement Narrowly must require emit telemetry through OpenTelemetry (OTEL)");
}

if (!/analyze cardinality of every new or changed OTEL/.test(contractText)) {
  fail("Implement Narrowly must analyze OTEL cardinality");
}

if (!/verify OpenTelemetry \(OTEL\) instrumentation/.test(verifyText)) {
  fail("verify-real-proof must verify OpenTelemetry (OTEL) instrumentation");
}

if (!/verify cardinality was analyzed for every new or changed OTEL/.test(verifyText)) {
  fail("verify-real-proof must verify OTEL cardinality analysis");
}

if (!/# CORE-OBS-001 MUST OpenTelemetry Telemetry/.test(coreText)) {
  fail("core.rules.md must define CORE-OBS-001 MUST OpenTelemetry Telemetry");
}

if (!/# CORE-OBS-002 MUST Analyze Telemetry Cardinality/.test(coreText)) {
  fail("core.rules.md must define CORE-OBS-002 MUST Analyze Telemetry Cardinality");
}

if (!/Cardinality MUST be analyzed/.test(coreText)) {
  fail("CORE-OBS-002 must require cardinality analysis");
}

if (!/attack missing or incomplete cardinality analysis under CORE-OBS-002/.test(engCoreText)) {
  fail("eng-core blind review must attack missing OTEL cardinality analysis");
}

if (!/treat unanalyzed cardinality or unbounded high-cardinality keys left unbound as a release-blocking finding/.test(engCoreText)) {
  fail("eng-core must treat unanalyzed OTEL cardinality as release-blocking");
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

// cardinality recovery re-enters
const cardIdx = contractText.indexOf("if the planned OTEL instrumentation lacks cardinality analysis");
if (cardIdx < 0) {
  fail("implementation-contract missing OTEL cardinality-analysis recovery condition");
}
const cardWindow = contractText.slice(cardIdx, cardIdx + 500);
if (!/\[Define Implementation Contract\]\(#define-implementation-contract\)/.test(cardWindow)) {
  fail(
    "cardinality-analysis recovery must re-enter via [Define Implementation Contract](#define-implementation-contract)",
  );
}

const vcardIdx = verifyText.indexOf("if cardinality analysis is missing");
if (vcardIdx < 0) {
  fail("verify-real-proof missing cardinality-analysis recovery condition");
}
const vcardWindow = verifyText.slice(vcardIdx, vcardIdx + 400);
if (!/\[Verify Real Proof\]\(#verify-real-proof\)/.test(vcardWindow)) {
  fail("cardinality-analysis verify recovery must re-enter via [Verify Real Proof](#verify-real-proof)");
}

console.log(
  `[test-otel-implement-requirement] ok ${root} (OTEL non-negotiable + cardinality analysis + recovery re-entry)`,
);
