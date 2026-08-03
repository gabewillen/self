#!/usr/bin/env node
/**
 * Assert harness dialect + session id resolution is scoped correctly.
 *
 * Usage:
 *   node scripts/test-hook-session-scope.mjs
 */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startGoalRun } from "../skills/self-goal/hooks/self-lib.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const learnLib = join(pkgRoot, "skills/self-common/hooks/self-lib.ts");
const learnTouch = join(pkgRoot, "skills/self-common/hooks/learn-session-touch.ts");
const learnStop = join(pkgRoot, "skills/self-common/hooks/learn-stop.ts");
const watchStop = join(pkgRoot, "skills/self-watch/hooks/watch-stop.ts");
const bun = process.env.BUN_BIN || "bun";

const home = mkdtempSync(join(tmpdir(), "self-hook-scope-"));
const agentsHome = join(home, ".agents");
mkdirSync(join(agentsHome, "learn"), { recursive: true });
process.env.AGENTS_HOME = agentsHome;
process.env.HOME = home;

function runHook(script, payload, envExtra = {}) {
  const r = spawnSync(bun, [script], {
    encoding: "utf8",
    input: JSON.stringify(payload),
    env: {
      ...process.env,
      AGENTS_HOME: agentsHome,
      HOME: home,
      SELF_LEARN_SKIP_HOOKS: "0",
      SELF_WATCH_SKIP_HOOKS: "1",
      ...envExtra,
    },
  });
  return {
    status: r.status,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
}

function parseOut(stdout) {
  if (!stdout) return {};
  try {
    return JSON.parse(stdout);
  } catch {
    return { _raw: stdout };
  }
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok  ", msg);
  }
}

// --- dialect unit checks via a tiny bun eval importing self-lib ---
const dialectProbe = spawnSync(
  bun,
  [
    "-e",
    `
import { detectDialect, resolveConversationId, sessionKeyFor } from ${JSON.stringify(learnLib)};

const cases = [
  [{ conversation_id: "c1", workspace_roots: ["/tmp"] }, "cursor", "c1"],
  [{ session_id: "s1", transcript_path: "/t" }, "claude", "s1"],
  [{ session_id: "s1b", transcript_path: "/t", permission_mode: "default", hook_event_name: "Stop" }, "claude", "s1b"],
  [{ session_id: "s2", turn_id: "t1" }, "codex", "s2"],
  // Codex Stop without misclassifying camelCase as Grok when permission_mode present.
  [{ sessionId: "cx1", turnId: "t9", hook_event_name: "Stop", permission_mode: "default", stop_hook_active: false }, "codex", "cx1"],
  [{ session_id: "cx2", hook_event_name: "Stop", permission_mode: "default", last_assistant_message: "hi" }, "codex", "cx2"],
  [{ sessionId: "g1", hookEventName: "stop" }, "grok", "g1"],
];
for (const [raw, wantDialect, wantId] of cases) {
  const d = detectDialect(raw);
  const id = resolveConversationId(d, raw);
  if (d !== wantDialect || id !== wantId) {
    console.error(JSON.stringify({ raw, d, id, wantDialect, wantId }));
    process.exit(2);
  }
}
// GROK env wins even if payload looks like Cursor
process.env.GROK_HOOK_EVENT = "stop";
const d = detectDialect({ conversation_id: "c-x", workspace_roots: ["/x"] });
if (d !== "grok") { console.error("env grok expected", d); process.exit(3); }
console.log("dialect-ok");
`,
  ],
  { encoding: "utf8", env: { ...process.env } },
);
assert(dialectProbe.status === 0, `dialect probe (${dialectProbe.stderr || dialectProbe.stdout})`);

// Cursor session A arms learn (real user prompt)
const touchA = runHook(learnTouch, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  generation_id: "gen-1",
  hook_event_name: "beforeSubmitPrompt",
  prompt: "please fix the hooks",
});
assert(touchA.status === 0, "touch session A exits 0");
const turnA = join(agentsHome, "learn/user-turn/cursor_cursor-A.json");
// sanitize keeps : → may become cursor:cursor-A with colon allowed
const turnFiles = spawnSync("find", [join(agentsHome, "learn"), "-type", "f"], {
  encoding: "utf8",
});
assert(
  (turnFiles.stdout || "").includes("cursor-A") ||
    existsSync(join(agentsHome, "learn/user-turn/cursor:cursor-A.json")) ||
    existsSync(join(agentsHome, "learn/user-turn/cursor_cursor-A.json")),
  "user-turn stamp for session A exists",
);

// Session B stop must NOT see A's user turn / must not inject learn
const stopB = runHook(learnStop, {
  conversation_id: "cursor-B",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
});
const outB = parseOut(stopB.stdout);
assert(stopB.status === 0, "stop B exits 0");
assert(
  !outB.followup_message,
  `stop B must not inject followup (got ${JSON.stringify(outB)})`,
);

// Session A stop should inject learn
const stopA = runHook(learnStop, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
});
const outA = parseOut(stopA.stdout);
assert(stopA.status === 0, "stop A exits 0");
assert(
  typeof outA.followup_message === "string" &&
    outA.followup_message.includes("reflect-and-learn"),
  `stop A injects learn (got ${JSON.stringify(outA)})`,
);
assert(
  !existsSync(join(agentsHome, "learn/ACTIVE")),
  "learn does not write a global ACTIVE pointer",
);
assert(
  (spawnSync("find", [join(agentsHome, "learn"), "-name", "ACTIVE.*"], {
    encoding: "utf8",
  }).stdout || "").includes("cursor:cursor-A"),
  "learn writes a session-scoped ACTIVE pointer",
);

// Unscoped (no conversation id) must not write global unknown stamps
const touchEmpty = runHook(learnTouch, {
  workspace_roots: [pkgRoot],
  status: "completed",
});
assert(touchEmpty.status === 0, "empty session touch exits 0");
assert(
  !existsSync(join(agentsHome, "learn/unknown.json")) &&
    !existsSync(join(agentsHome, "learn/USER_TURN")),
  "no unknown/USER_TURN global stamp after unscoped touch",
);

// Claude + Codex use decision:block vocabulary
const touchClaude = runHook(learnTouch, {
  session_id: "claude-1",
  transcript_path: "/tmp/t.jsonl",
  cwd: pkgRoot,
  prompt: "real claude user prompt",
});
assert(touchClaude.status === 0, "claude touch ok");
const stopClaude = runHook(learnStop, {
  session_id: "claude-1",
  transcript_path: "/tmp/t.jsonl",
  cwd: pkgRoot,
  stop_hook_active: false,
});
const outClaude = parseOut(stopClaude.stdout);
assert(
  outClaude.decision === "block" &&
    String(outClaude.reason || "").includes("reflect-and-learn"),
  `claude stop blocks with reason (got ${JSON.stringify(outClaude)})`,
);
const claudeWatchSpool = join(agentsHome, "projects/claude-watch/ticks.jsonl");
const claudeWatchGoal = join(
  agentsHome,
  "projects/claude-watch/goals/self-watch-1.mdscript.md",
);
mkdirSync(dirname(claudeWatchSpool), { recursive: true });
mkdirSync(dirname(claudeWatchGoal), { recursive: true });
writeFileSync(
  claudeWatchSpool,
  JSON.stringify({ event: "tick", seq: 1, at: new Date().toISOString() }) + "\n",
);
writeFileSync(
  claudeWatchGoal,
  [
    "---",
    "watch_active: true",
    'pr_number: "1"',
    `tick_spool: ${claudeWatchSpool}`,
    "last_processed_seq: 0",
    "owner_conversation_id: claude-watch",
    "owner_dialect: claude",
    "---",
    "",
  ].join("\n"),
);
const claudeWatchPayload = {
  session_id: "claude-watch",
  transcript_path: "/tmp/claude-watch.jsonl",
  cwd: pkgRoot,
  hook_event_name: "Stop",
  permission_mode: "default",
  status: "completed",
  stop_hook_active: false,
  last_assistant_message: "same completed Claude assistant turn",
};
const claudeWatchFirst = runHook(watchStop, claudeWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const claudeWatchFirstOut = parseOut(claudeWatchFirst.stdout);
assert(
  claudeWatchFirst.status === 0 &&
    claudeWatchFirstOut.decision === "block" &&
    String(claudeWatchFirstOut.reason || "").includes("resume-watch"),
  `Claude watch owns its session (got ${JSON.stringify(claudeWatchFirst)})`,
);
const claudeWatchSecond = runHook(watchStop, claudeWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
assert(
  claudeWatchSecond.status === 0 && !claudeWatchSecond.stdout,
  `same Claude assistant turn is deduplicated (got ${JSON.stringify(claudeWatchSecond)})`,
);


// Codex stop must continue with decision:block + systemMessage (universal field).
const touchCodex = runHook(learnTouch, {
  session_id: "codex-sess",
  turn_id: "t-c1",
  hook_event_name: "UserPromptSubmit",
  permission_mode: "default",
  prompt: "please fix the bug",
});
assert(touchCodex.status === 0, "codex touch ok");
const stopCodex = runHook(learnStop, {
  session_id: "codex-sess",
  turn_id: "t-c2",
  hook_event_name: "Stop",
  permission_mode: "default",
  stop_hook_active: false,
  last_assistant_message: "done",
  status: "completed",
});
const outCodex = parseOut(stopCodex.stdout);
assert(
  outCodex.decision === "block" &&
    typeof outCodex.reason === "string" &&
    outCodex.reason.includes("reflect-and-learn") &&
    outCodex.systemMessage === "self stop hook continuing turn",
  `codex stop blocks with systemMessage (got ${JSON.stringify(outCodex)})`,
);

// Empty allow-stop should use empty stdout (no bare {}).
const stopCodexActive = runHook(learnStop, {
  session_id: "codex-sess",
  turn_id: "t-c3",
  hook_event_name: "Stop",
  permission_mode: "default",
  stop_hook_active: true,
  status: "completed",
});
assert(
  stopCodexActive.stdout === "",
  `codex stop_hook_active empty stdout (got ${JSON.stringify(stopCodexActive.stdout)})`,
);

// stop_hook_active must never re-inject
const stopActive = runHook(learnStop, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  status: "completed",
  stop_hook_active: true,
});
const outActive = parseOut(stopActive.stdout);
assert(
  !outActive.followup_message,
  `stop_hook_active yields empty followup (got ${JSON.stringify(outActive)})`,
);

// After inject, a second Stop without a new user arm must not re-inject
// (Cursor has no stop_hook_active; in_flight stamp is the brake).
const stopA2 = runHook(learnStop, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 1,
  stop_hook_active: false,
});
const outA2 = parseOut(stopA2.stdout);
assert(
  !outA2.followup_message,
  `second stop after inject must not re-fire (got ${JSON.stringify(outA2)})`,
);

// Cursor re-submits followup_message as beforeSubmitPrompt — must not re-arm.
const touchFollowup = runHook(learnTouch, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  generation_id: "gen-2",
  prompt:
    "/mdscript-exec /tmp/skills/self-common/workflows/self-learn.mdscript.md#reflect-and-learn",
});
assert(touchFollowup.status === 0, "synthetic followup touch exits 0");
const stopAfterSynthetic = runHook(learnStop, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 1,
  stop_hook_active: false,
});
const outSynth = parseOut(stopAfterSynthetic.stdout);
assert(
  !outSynth.followup_message,
  `synthetic followup must not re-arm learn (got ${JSON.stringify(outSynth)})`,
);

// A real new user message may arm learn again after prior in_flight/satisfied.
const touchA3 = runHook(learnTouch, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  generation_id: "gen-3",
  prompt: "another real question",
});
assert(touchA3.status === 0, "new real user touch ok");
const stopA3 = runHook(learnStop, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
});
const outA3 = parseOut(stopA3.stdout);
assert(
  typeof outA3.followup_message === "string" &&
    outA3.followup_message.includes("reflect-and-learn"),
  `new user turn may inject learn again (got ${JSON.stringify(outA3)})`,
);
// A required learn pass wins regardless of whether watch or learn Stop runs
// first. Secondary hooks defer before claiming the shared generation marker.
const watchSpool = join(agentsHome, "projects/watch-demo/ticks.jsonl");
const watchGoal = join(
  agentsHome,
  "projects/watch-demo/goals/self-watch-1.mdscript.md",
);
mkdirSync(dirname(watchSpool), { recursive: true });
mkdirSync(dirname(watchGoal), { recursive: true });
writeFileSync(
  watchSpool,
  JSON.stringify({ event: "tick", seq: 1, at: new Date().toISOString() }) + "\n",
);
writeFileSync(
  watchGoal,
  [
    "---",
    "watch_active: true",
    'pr_number: "1"',
    `tick_spool: ${watchSpool}`,
    "last_processed_seq: 0",
    "owner_conversation_id: cursor-watch",
    "owner_dialect: cursor",
    "---",
    "",
  ].join("\n"),
);
const watchStopPayload = {
  conversation_id: "cursor-watch",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
  generation_id: "watch-generation-0",
};
const touchWatch = runHook(learnTouch, {
  conversation_id: "cursor-watch",
  workspace_roots: [pkgRoot],
  generation_id: "watch-user-generation",
  prompt: "watch session user turn",
});
assert(touchWatch.status === 0, "watch ordering user touch exits 0");
const watchFirst = runHook(watchStop, watchStopPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const watchFirstOut = parseOut(watchFirst.stdout);
assert(
  !watchFirstOut.followup_message,
  `watch-first defers to required learn (got ${JSON.stringify(watchFirstOut)})`,
);
const learnAfterWatch = runHook(learnStop, watchStopPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const learnAfterWatchOut = parseOut(learnAfterWatch.stdout);
assert(
  typeof learnAfterWatchOut.followup_message === "string" &&
    learnAfterWatchOut.followup_message.includes("reflect-and-learn"),
  `learn-after-watch still injects required learn (got ${JSON.stringify(learnAfterWatchOut)})`,
);
const watchAfterLearn = runHook(watchStop, watchStopPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
assert(
  !parseOut(watchAfterLearn.stdout).followup_message,
  `watch-after-learn cannot duplicate same-generation followup (got ${JSON.stringify(parseOut(watchAfterLearn.stdout))})`,
);

const firstWatchPayload = {
  ...watchStopPayload,
  generation_id: "watch-generation-2",
};
const watchStop3 = runHook(watchStop, firstWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const watchOut3 = parseOut(watchStop3.stdout);
assert(
  typeof watchOut3.followup_message === "string" &&
    watchOut3.followup_message.includes("#resume-watch"),
  `later watch turn may drain pending tick (got ${JSON.stringify(watchOut3)})`,
);
const watchStop4 = runHook(watchStop, firstWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const watchOut4 = parseOut(watchStop4.stdout);
assert(
  !watchOut4.followup_message,
  `repeated independent watch stop must not re-fire (got ${JSON.stringify(watchOut4)})`,
);

// An active incomplete goal is also subordinate to learn in either invocation
// order, and cannot emit a second followup after learn claims the generation.
const goalConversationId = "cursor-goal-order";
const goalPaths = startGoalRun(pkgRoot, goalConversationId, {
  active: true,
  goal: "exercise incomplete goal ordering",
  conversation_id: goalConversationId,
  proof_kind: "default",
  skip_hooks: false,
  loop_driver: "self-hooks",
});
assert(existsSync(goalPaths.goalMdscript), "active incomplete goal tracker exists");
const touchGoal = runHook(learnTouch, {
  conversation_id: goalConversationId,
  workspace_roots: [pkgRoot],
  generation_id: "goal-user-generation",
  prompt: "goal session user turn",
});
assert(touchGoal.status === 0, "goal ordering user touch exits 0");
const goalPayload = {
  conversation_id: goalConversationId,
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
  generation_id: "goal-generation-0",
};
const goalFirst = runHook(
  join(pkgRoot, "skills/self-goal/hooks/goal-stop.ts"),
  goalPayload,
  { SELF_GOAL_FORCE_HOOKS: "1" },
);
assert(
  goalFirst.status === 0 && !goalFirst.stderr,
  `goal-first probe imports cleanly (got ${JSON.stringify(goalFirst)})`,
);
assert(
  !parseOut(goalFirst.stdout).followup_message,
  `goal-first defers to required learn (got ${JSON.stringify(parseOut(goalFirst.stdout))})`,
);
const learnAfterGoal = runHook(learnStop, goalPayload);
const learnAfterGoalOut = parseOut(learnAfterGoal.stdout);
assert(
  typeof learnAfterGoalOut.followup_message === "string" &&
    learnAfterGoalOut.followup_message.includes("reflect-and-learn"),
  `learn-after-goal still injects required learn (got ${JSON.stringify(learnAfterGoalOut)})`,
);
const goalAfterLearn = runHook(
  join(pkgRoot, "skills/self-goal/hooks/goal-stop.ts"),
  goalPayload,
  { SELF_GOAL_FORCE_HOOKS: "1" },
);
assert(
  goalAfterLearn.status === 0 && !goalAfterLearn.stderr,
  `goal-after-learn probe imports cleanly (got ${JSON.stringify(goalAfterLearn)})`,
);
assert(
  !parseOut(goalAfterLearn.stdout).followup_message,
  `goal-after-learn cannot duplicate same-generation followup (got ${JSON.stringify(parseOut(goalAfterLearn.stdout))})`,
);

const goalEmptyProbe = spawnSync(
  bun,
  [join(pkgRoot, "skills/self-goal/hooks/goal-stop.ts")],
  {
    input: "",
    encoding: "utf8",
    env: {
      ...process.env,
      AGENTS_HOME: agentsHome,
      SELF_GOAL_FORCE_HOOKS: "1",
    },
  },
);
assert(
  goalEmptyProbe.status === 0 && !goalEmptyProbe.stderr,
  `goal empty payload import exits cleanly (got ${JSON.stringify({ status: goalEmptyProbe.status, stderr: goalEmptyProbe.stderr })})`,
);

// Marker claims fail closed on unavailable paths, distinguish long ids that
// share a truncated prefix, and retain only a bounded marker set.
const markerProbe = spawnSync(
  bun,
  [
    "-e",
    `import { writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { claimStopEvent, stopEventMarkerPath } from ${JSON.stringify(learnLib)};
const base = {
  dialect: "cursor", conversationId: "session", sessionKey: "cursor:session",
  root: process.cwd(), status: "completed", loopCount: 0, stopHookActive: false, raw: {}
};
process.env.AGENTS_HOME = ${JSON.stringify(join(home, "marker-home"))};
const inaccessible = join(${JSON.stringify(home)}, "not-a-directory");
writeFileSync(inaccessible, "file");
process.env.AGENTS_HOME = inaccessible;
if (claimStopEvent("self-stop", { ...base, turnId: "blocked" })) process.exit(2);
process.env.AGENTS_HOME = ${JSON.stringify(join(home, "marker-home"))};
const prefix = "x".repeat(180);
if (!claimStopEvent("self-stop", { ...base, sessionKey: "cursor:" + prefix + "a", turnId: "turn" })) process.exit(3);
if (!claimStopEvent("self-stop", { ...base, sessionKey: "cursor:" + prefix + "b", turnId: "turn" })) process.exit(4);
for (let i = 0; i < 130; i++) {
  if (!claimStopEvent("retention", { ...base, turnId: "turn-" + i })) process.exit(5);
}
const retentionPath = stopEventMarkerPath("retention", base);
const count = readdirSync(retentionPath).filter((name) => name.endsWith(".json")).length;
if (count > 128) { console.error("retention count", count); process.exit(6); }
console.log(JSON.stringify({ count }));
`,
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      AGENTS_HOME: join(home, "marker-home"),
    },
  },
);
assert(
  markerProbe.status === 0,
  `marker claims fail closed, avoid collisions, and clean up (got ${markerProbe.stderr || markerProbe.stdout})`,
);

rmSync(home, { recursive: true, force: true });

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nok: hook session scope tests passed");
