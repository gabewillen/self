#!/usr/bin/env node
/**
 * Execute the goal completion gate. Three review rounds found defects here that
 * `npm test` could not see, because nothing imported this module: a Buffer
 * handed to a string parser made every sign-off read as absent, validators were
 * called with one of their required arguments, and sign-off discovery accepted
 * a forged or stale file. These tests run the shipped functions.
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
function check(name, ok, detail) {
  if (ok) {
    console.log(`ok   ${name}${detail ? ` (${detail})` : ""}`);
    return;
  }
  failed += 1;
  console.error(`not ok   ${name}${detail ? ` (${detail})` : ""}`);
}

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
check("a well-formed sign-off loads off disk", loaded !== null);
check("loaded record carries its round", loaded?.review_round === 4, `round=${loaded?.review_round}`);

// Discovery must prefer the newest minted name, never the legacy name, and must
// match the lane segment exactly.
const runDir = join(scratch, "run");
mkdirSync(runDir, { recursive: true });
const minted = (stamp, round, lane) => `${stamp}-00${round}-subject-main-${lane}-signoff.mdscript.md`;
// name -> the lane the file's CONTENT claims. Discovery must believe content.
const runFixtures = {
  "signoff-reviewer-rules.mdscript.md": "rules",
  [minted("20260804T100000Z", 3, "rules")]: "rules",
  [minted("20260804T110000Z", 4, "rules")]: "rules",
  [minted("20260804T120000Z", 4, "eng-hsm")]: "eng-hsm",
  [minted("20260804T130000Z", 4, "rules").replace(".mdscript.md", ".superseded.mdscript.md")]:
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
check(
  "a file whose record claims another lane never answers for this one",
  found.endsWith(minted("20260804T110000Z", 4, "rules")),
  found.split("/").pop(),
);
const hsm = lib.findLaneSignoffPath({
  runDirectoryPath: runDir,
  laneId: "hsm",
  fallbackPath: join(runDir, "hsm-fallback.mdscript.md"),
});
check(
  "an eng-hsm sign-off never answers for the hsm lane",
  hsm.endsWith("hsm-fallback.mdscript.md"),
  hsm.split("/").pop(),
);

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

function writeLanes(dir, rounds) {
  mkdirSync(dir, { recursive: true });
  for (const [lane, round] of Object.entries(rounds)) {
    writeFileSync(
      join(dir, `signoff-reviewer-${lane}.mdscript.md`),
      signoffText({ lane, round, summary: `${lane} lane reasoned independently about ${lane}` }),
    );
  }
}

const okDir = join(scratch, "ok");
writeLanes(okDir, { rules: 4, security: 4, completeness: 4 });
const okResult = lib.validateTripleBlindSignoffs(scratch, paths(okDir), GOAL, CONVERSATION);
check("three valid same-round sign-offs complete the gate", okResult.complete === true, okResult.reasons?.[0]);

const mixedDir = join(scratch, "mixed");
writeLanes(mixedDir, { rules: 4, security: 3, completeness: 4 });
const mixedResult = lib.validateTripleBlindSignoffs(scratch, paths(mixedDir), GOAL, CONVERSATION);
check(
  "sign-offs spanning two rounds do not complete the gate",
  mixedResult.complete === false,
  mixedResult.reasons?.[0]?.slice(0, 60),
);

const identicalDir = join(scratch, "identical");
mkdirSync(identicalDir, { recursive: true });
for (const lane of ["rules", "security", "completeness"]) {
  writeFileSync(
    join(identicalDir, `signoff-reviewer-${lane}.mdscript.md`),
    signoffText({ lane, round: 4, summary: "the very same summary text from every lane here" }),
  );
}
const identicalResult = lib.validateTripleBlindSignoffs(
  scratch,
  paths(identicalDir),
  GOAL,
  CONVERSATION,
);
check("identical lane summaries do not complete the gate", identicalResult.complete === false);

if (failed) {
  console.error(`\n[test-goal-signoff-gate] BROKEN: ${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nok: goal sign-off gate executes, authenticates, and dates its evidence");
