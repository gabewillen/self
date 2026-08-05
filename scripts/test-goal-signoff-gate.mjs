#!/usr/bin/env node
/**
 * Execute the goal completion gate against the shipped functions.
 *
 * The gate decides whether a goal run may close, so every check here asserts a
 * refusal it must make: an unparseable record, a sign-off from another lane or
 * another round, a stale set that agrees with itself, and evidence that
 * survived invalidation. Each assertion fails when its behaviour is reverted.
 */
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const lib = await import(join(here, "..", "skills", "self-goal", "hooks", "self-lib.ts"));

const scratch = mkdtempSync(join(tmpdir(), "self-goal-signoff-"));
process.on("exit", () => {
  try {
    rmSync(scratch, { recursive: true, force: true });
  } catch {
    // best effort
  }
});

let failed = 0;
function check({ name, passed, detail }) {
  if (passed) {
    console.log(`ok   ${name}${detail ? ` (${detail})` : ""}`);
    return;
  }
  failed += 1;
  console.error(`not ok   ${name}${detail ? ` (${detail})` : ""}`);
}

const ROUND_3 = 3;
const ROUND_4 = 4;
const GOAL = "ship the running log";
const CONVERSATION = "conv-1";

function signoffText({ lane, round = 4, summary }) {
  return [
    "---",
    `reviewer_id: "${lane}"`,
    `reviewer_lane: "${lane}"`,
    `goal: "${GOAL}"`,
    `conversation_id: "${CONVERSATION}"`,
    `review_round: ${round}`,
    "signed_off: true",
    `verifier_summary: "${summary}"`,
    "evidence:",
    "  - ran the gate",
    "  - read the artifact",
    "commands_run:",
    "  - npm test",
    "attack_attempts:",
    "  - tried a forged sign-off",
    "  - tried a stale round",
    "p_findings: []",
    "rules_reviewed:",
    "  - AGENTS.md",
    "artifact_paths:",
    "  - artifacts/proof.log",
    "objectives_checked:",
    "  - the gate executes",
    "remaining_gaps: []",
    "---",
    "",
    "<!-- mdscript: use the mdscript-exec skill -->",
    "",
    "## Signoff",
    "",
    "* lane verdict recorded",
    "",
  ].join("\n");
}

// A record must actually parse off disk. This is the defect that made the whole
// gate inert: the read returned a Buffer and every parse threw into a null.
const recordPath = join(scratch, "record.mdscript.md");
writeFileSync(recordPath, signoffText({ lane: "rules", summary: "rules lane looked hard at the rules" }));
const loaded = lib.loadMdscriptRecord(recordPath);
check({ name: "a well-formed sign-off loads off disk", passed: loaded !== null });
check({
  name: "loaded record carries its round",
  passed: loaded?.review_round === 4,
  detail: `round=${loaded?.review_round}`,
});

// Discovery must prefer the newest minted name, never the legacy name, and must
// match the lane segment exactly.
const runDir = join(scratch, "run");
mkdirSync(runDir, { recursive: true });
const minted = ({ stamp, round, lane }) => `${stamp}-00${round}-subject-main-${lane}-signoff.mdscript.md`;
// name -> the lane the file's CONTENT claims. Discovery must believe content.
const runFixtures = {
  "signoff-reviewer-rules.mdscript.md": "rules",
  [minted({ stamp: "20260804T100000Z", round: ROUND_3, lane: "rules" })]: "rules",
  [minted({ stamp: "20260804T110000Z", round: ROUND_4, lane: "rules" })]: "rules",
  [minted({ stamp: "20260804T120000Z", round: ROUND_4, lane: "eng-hsm" })]: "eng-hsm",
  [minted({ stamp: "20260804T130000Z", round: ROUND_4, lane: "rules" }).replace(".mdscript.md", ".superseded.mdscript.md")]:
    "rules",
  // Named as this lane's newest, but its record says otherwise.
  "zzz-named-rules-but-claims-security-rules-signoff.mdscript.md": "security",
};
for (const [name, lane] of Object.entries(runFixtures)) {
  writeFileSync(join(runDir, name), signoffText({ lane, summary: `${lane} lane summary text` }));
}
const found = lib.findLaneSignoffPath({
  runDirectoryPath: runDir,
  laneId: "rules",
  fallbackPath: join(runDir, "fallback.mdscript.md"),
});
check({
  name: "a file whose record claims another lane never answers for this one",
  passed: found.endsWith(minted({ stamp: "20260804T110000Z", round: ROUND_4, lane: "rules" })),
  detail: found.split("/").pop(),
});
const hsm = lib.findLaneSignoffPath({
  runDirectoryPath: runDir,
  laneId: "hsm",
  fallbackPath: join(runDir, "hsm-fallback.mdscript.md"),
});
check({
  name: "an eng-hsm sign-off never answers for the hsm lane",
  passed: hsm.endsWith("hsm-fallback.mdscript.md"),
  detail: hsm.split("/").pop(),
});

// Ordering is by the round each record states, so a high-sorting filename
// cannot make an older round win.
const orderDir = join(scratch, "order");
mkdirSync(orderDir, { recursive: true });
writeFileSync(
  join(orderDir, "zzzz-high-sorting-name-rules-signoff.mdscript.md"),
  signoffText({ lane: "rules", round: ROUND_3, summary: "rules lane wrote this in the older round three" }),
);
writeFileSync(
  join(orderDir, "aaaa-low-sorting-name-rules-signoff.mdscript.md"),
  signoffText({ lane: "rules", round: ROUND_4, summary: "rules lane wrote this in the newer round four" }),
);
const ordered = lib.findLaneSignoffPath({
  runDirectoryPath: orderDir,
  laneId: "rules",
  fallbackPath: join(orderDir, "none.mdscript.md"),
});
check({
  name: "the newest stated round wins over a higher-sorting filename",
  passed: ordered.endsWith("aaaa-low-sorting-name-rules-signoff.mdscript.md"),
  detail: ordered.split("/").pop(),
});

// The gate itself: three valid same-round sign-offs complete; a mixed round or
// an unstated round does not.
function paths(dir) {
  return {
    signoffReviewerRulesMdscript: join(dir, "signoff-reviewer-rules.mdscript.md"),
    signoffReviewerSecurityMdscript: join(dir, "signoff-reviewer-security.mdscript.md"),
    signoffReviewerCompletenessMdscript: join(dir, "signoff-reviewer-completeness.mdscript.md"),
    signoffReviewerHsmMdscript: join(dir, "signoff-reviewer-hsm.mdscript.md"),
    reviewVerdictMdscript: join(dir, "review-verdict.mdscript.md"),
  };
}

function writeLanes({ dir, rounds }) {
  mkdirSync(dir, { recursive: true });
  for (const [lane, round] of Object.entries(rounds)) {
    writeFileSync(
      join(dir, `signoff-reviewer-${lane}.mdscript.md`),
      signoffText({ lane, round, summary: `${lane} lane reasoned independently about ${lane}` }),
    );
  }
}

const okDir = join(scratch, "ok");
writeLanes({ dir: okDir, rounds: { rules: 4, security: 4, completeness: 4 } });
const okResult = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: paths(okDir),
  goal: GOAL,
  conversationId: CONVERSATION,
});
check({
  name: "three valid same-round sign-offs complete the gate",
  passed: okResult.complete === true,
  detail: okResult.reasons?.[0],
});

const mixedDir = join(scratch, "mixed");
writeLanes({ dir: mixedDir, rounds: { rules: 4, security: 3, completeness: 4 } });
const mixedResult = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: paths(mixedDir),
  goal: GOAL,
  conversationId: CONVERSATION,
});
check({
  name: "sign-offs spanning two rounds do not complete the gate",
  passed: mixedResult.complete === false,
  detail: mixedResult.reasons?.[0]?.slice(0, 60),
});

const identicalDir = join(scratch, "identical");
mkdirSync(identicalDir, { recursive: true });
for (const lane of ["rules", "security", "completeness"]) {
  writeFileSync(
    join(identicalDir, `signoff-reviewer-${lane}.mdscript.md`),
    signoffText({ lane, round: 4, summary: "the very same summary text from every lane here" }),
  );
}
const identicalResult = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: paths(identicalDir),
  goal: GOAL,
  conversationId: CONVERSATION,
});
check({ name: "identical lane summaries do not complete the gate", passed: identicalResult.complete === false });

// Invalidation must retire every live sign-off, not just the one discovery
// returns: a surviving sibling lets the next discovery re-complete the gate
// with no fresh review.
const replayDir = join(scratch, "replay");
writeLanes({ dir: replayDir, rounds: { rules: ROUND_4, security: ROUND_4, completeness: ROUND_4 } });
for (const lane of ["rules", "security", "completeness"]) {
  writeFileSync(
    join(replayDir, minted({ stamp: "20260804T090000Z", round: ROUND_4, lane })),
    signoffText({ lane, round: ROUND_4, summary: `${lane} lane attacked this change from the ${lane} angle and recorded older minted evidence` }),
  );
}
const replayPaths = paths(replayDir);
const beforeInvalidate = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: replayPaths,
  goal: GOAL,
  conversationId: CONVERSATION,
});
check({
  name: "the gate completes before invalidation",
  passed: beforeInvalidate.complete === true,
  detail: beforeInvalidate.reasons?.[0]?.slice(0, 90),
});
lib.invalidateReviewerSignoffs(replayPaths);
const afterInvalidate = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: replayPaths,
  goal: GOAL,
  conversationId: CONVERSATION,
});
check({
  name: "no stale sign-off survives invalidation to re-complete the gate",
  passed: afterInvalidate.complete === false,
  detail: afterInvalidate.reasons?.[0]?.slice(0, 48),
});

// A whole stale set agrees with itself, so lane consistency alone is not enough.
const staleDir = join(scratch, "stale");
writeLanes({ dir: staleDir, rounds: { rules: ROUND_3, security: ROUND_3, completeness: ROUND_3 } });
const staleResult = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: paths(staleDir),
  goal: GOAL,
  conversationId: CONVERSATION,
  currentReviewRound: ROUND_4,
});
check({
  name: "a consistent stale round does not satisfy the run's current round",
  passed: staleResult.complete === false,
  detail: staleResult.reasons?.[0]?.slice(0, 48),
});

// The citation gate needs a root that actually holds AGENTS.md to bind.
const rootDir = join(scratch, "withagents");
mkdirSync(rootDir, { recursive: true });
writeFileSync(join(rootDir, "AGENTS.md"), "# AGENTS\n\n- a rule\n");
const citeDir = join(rootDir, "run");
mkdirSync(citeDir, { recursive: true });
for (const lane of ["rules", "security", "completeness"]) {
  writeFileSync(
    join(citeDir, `signoff-reviewer-${lane}.mdscript.md`),
    signoffText({ lane, round: ROUND_4, summary: `${lane} lane reasoned independently about ${lane}` }).replace(
      "rules_reviewed:\n  - AGENTS.md",
      "rules_reviewed:\n  - core.rules.md",
    ),
  );
}
const citeResult = lib.validateTripleBlindSignoffs({
  root: rootDir,
  paths: paths(citeDir),
  goal: GOAL,
  conversationId: CONVERSATION,
  currentReviewRound: ROUND_4,
});
check({
  name: "a sign-off that never cites AGENTS.md does not complete the gate",
  passed: citeResult.complete === false,
  detail: citeResult.reasons?.[0]?.slice(0, 48),
});

// A sign-off that states no round cannot be dated to this one.
const unstatedDir = join(scratch, "unstated");
mkdirSync(unstatedDir, { recursive: true });
for (const lane of ["rules", "security", "completeness"]) {
  writeFileSync(
    join(unstatedDir, `signoff-reviewer-${lane}.mdscript.md`),
    signoffText({ lane, round: ROUND_4, summary: `${lane} lane reasoned independently about ${lane}` }).replace(
      `review_round: ${ROUND_4}\n`,
      "",
    ),
  );
}
const unstatedResult = lib.validateTripleBlindSignoffs({
  root: scratch,
  paths: paths(unstatedDir),
  goal: GOAL,
  conversationId: CONVERSATION,
});
check({
  name: "a sign-off that states no round does not complete the gate",
  passed: unstatedResult.complete === false,
  detail: unstatedResult.reasons?.[0]?.slice(0, 48),
});

// The round must survive the real path — written to goal front matter and
// mapped back on load — not merely be accepted as an argument.
const fmRoundTrip = lib.goalStateFromFrontMatter(
  lib.parseMdscriptFrontMatter(
    [
      "---",
      'id: "run-1"',
      'goal: "g"',
      'conversation_id: "c"',
      "active: true",
      "review_round: 6",
      "---",
      "",
      "<!-- mdscript: use the mdscript-exec skill -->",
      "",
      "## Pursue Goal",
      "",
      "* keep going",
      "",
    ].join("\n"),
  ),
);
check({
  name: "review_round survives the goal front matter round trip",
  passed: String(fmRoundTrip?.review_round) === "6",
  detail: `review_round=${fmRoundTrip?.review_round}`,
});

if (failed) {
  console.error(`\n[test-goal-signoff-gate] BROKEN: ${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nok: goal sign-off gate executes, authenticates, and dates its evidence");
