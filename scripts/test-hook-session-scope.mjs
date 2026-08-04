#!/usr/bin/env node
/**
 * Assert harness dialect + session id resolution is scoped correctly.
 *
 * Learn is deliberately absent: it is a user-invoked skill (/self-learn), not a
 * hook, so the only Stop hooks left to scope are self-goal and self-watch.
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
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startGoalRun } from "../skills/self-goal/hooks/self-lib.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const hookLib = join(pkgRoot, "skills/self-common/hooks/self-lib.ts");
const watchStop = join(pkgRoot, "skills/self-watch/hooks/watch-stop.ts");
const goalStop = join(pkgRoot, "skills/self-goal/hooks/goal-stop.ts");
const bun = process.env.BUN_BIN || "bun";

const home = mkdtempSync(join(tmpdir(), "self-hook-scope-"));
const agentsHome = join(home, ".agents");
mkdirSync(join(agentsHome, "hooks"), { recursive: true });
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

/** Arm a self-watch with one unprocessed tick owned by exactly one session. */
function armWatch(project, conversationId, dialect) {
  const spool = join(agentsHome, `projects/${project}/ticks.jsonl`);
  const goal = join(
    agentsHome,
    `projects/${project}/goals/self-watch-1.mdscript.md`,
  );
  mkdirSync(dirname(spool), { recursive: true });
  mkdirSync(dirname(goal), { recursive: true });
  writeFileSync(
    spool,
    JSON.stringify({ event: "tick", seq: 1, at: new Date().toISOString() }) + "\n",
  );
  writeFileSync(
    goal,
    [
      "---",
      "watch_active: true",
      'pr_number: "1"',
      `tick_spool: ${spool}`,
      "last_processed_seq: 0",
      `owner_conversation_id: ${conversationId}`,
      `owner_dialect: ${dialect}`,
      "---",
      "",
    ].join("\n"),
  );
  return { spool, goal };
}

// --- dialect unit checks via a tiny bun eval importing self-lib ---
const dialectProbe = spawnSync(
  bun,
  [
    "-e",
    `
import { detectDialect, resolveConversationId, sessionKeyFor } from ${JSON.stringify(hookLib)};

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
if (sessionKeyFor("cursor", "c1") !== "cursor:c1") process.exit(4);
// An empty conversation id must never produce a usable key.
if (sessionKeyFor("cursor", "") !== "") process.exit(5);
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

// --- self-learn must not be reachable as a hook anymore ---
for (const retired of [
  "skills/self-common/hooks/learn-stop.ts",
  "skills/self-common/hooks/learn-session-touch.ts",
  "skills/self-common/workflows/self-learn.mdscript.md",
]) {
  assert(
    !existsSync(join(pkgRoot, retired)),
    `retired learn hook artifact is gone: ${retired}`,
  );
}
assert(
  existsSync(join(pkgRoot, "skills/self-learn/SKILL.md")),
  "self-learn ships as a user-invoked skill",
);
for (const adapter of ["claude", "cursor", "codex", "grok"]) {
  const manifest = JSON.parse(
    spawnSync("cat", [join(pkgRoot, `skills/self-common/adapters/${adapter}/hooks.json`)], {
      encoding: "utf8",
    }).stdout,
  );
  const handlers = Object.values(manifest.hooks || {}).flat();
  assert(
    handlers.length === 0,
    `${adapter} self-common adapter installs no hooks (got ${JSON.stringify(handlers)})`,
  );
  assert(
    Object.keys(manifest.hooks || {}).length > 0,
    `${adapter} self-common adapter keeps empty event lists so install scrubs old learn hooks`,
  );
}

// --- Cursor: a watch armed by session A must never fire in session B ---
armWatch("watch-cursor", "cursor-A", "cursor");
const cursorWatchPayload = {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
  generation_id: "cursor-A-gen-1",
};
const foreignStop = runHook(
  watchStop,
  { ...cursorWatchPayload, conversation_id: "cursor-B", generation_id: "cursor-B-gen-1" },
  { SELF_WATCH_SKIP_HOOKS: "0" },
);
assert(
  !parseOut(foreignStop.stdout).followup_message,
  `session B never inherits session A's watch (got ${JSON.stringify(foreignStop.stdout)})`,
);
const ownerStop = runHook(watchStop, cursorWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const ownerOut = parseOut(ownerStop.stdout);
assert(
  typeof ownerOut.followup_message === "string" &&
    ownerOut.followup_message.includes("#resume-watch"),
  `owning cursor session drains its pending tick (got ${JSON.stringify(ownerOut)})`,
);
const ownerStopRepeat = runHook(watchStop, cursorWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
assert(
  !parseOut(ownerStopRepeat.stdout).followup_message,
  `same cursor generation cannot re-fire (got ${JSON.stringify(ownerStopRepeat.stdout)})`,
);
const ownerStopNextTurn = runHook(
  watchStop,
  { ...cursorWatchPayload, generation_id: "cursor-A-gen-2" },
  { SELF_WATCH_SKIP_HOOKS: "0" },
);
assert(
  String(parseOut(ownerStopNextTurn.stdout).followup_message || "").includes(
    "#resume-watch",
  ),
  `a later cursor turn may still drain the tick (got ${JSON.stringify(ownerStopNextTurn.stdout)})`,
);

// --- Unscoped payloads must never write global "unknown" state ---
const unscoped = runHook(
  watchStop,
  { workspace_roots: [pkgRoot], status: "completed", stop_hook_active: false },
  { SELF_WATCH_SKIP_HOOKS: "0" },
);
assert(
  unscoped.status === 0 && unscoped.stdout === "",
  `unscoped payload allows stop with empty stdout (got ${JSON.stringify(unscoped)})`,
);
assert(
  !existsSync(join(agentsHome, "hooks/unknown.json")),
  "unscoped payload writes no global stamp",
);

// --- Claude: decision:block vocabulary + same-turn dedupe ---
armWatch("watch-claude", "claude-watch", "claude");
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

// --- Codex: decision:block + systemMessage (universal allowed field) ---
armWatch("watch-codex", "codex-sess", "codex");
const codexWatchPayload = {
  session_id: "codex-sess",
  turn_id: "t-c2",
  hook_event_name: "Stop",
  permission_mode: "default",
  stop_hook_active: false,
  last_assistant_message: "done",
  status: "completed",
};
const codexWatch = runHook(watchStop, codexWatchPayload, {
  SELF_WATCH_SKIP_HOOKS: "0",
});
const codexOut = parseOut(codexWatch.stdout);
assert(
  codexOut.decision === "block" &&
    typeof codexOut.reason === "string" &&
    codexOut.reason.includes("resume-watch") &&
    codexOut.systemMessage === "self stop hook continuing turn",
  `codex stop blocks with systemMessage (got ${JSON.stringify(codexOut)})`,
);

// Empty allow-stop should use empty stdout (no bare {}).
const codexStopActive = runHook(
  watchStop,
  { ...codexWatchPayload, turn_id: "t-c3", stop_hook_active: true },
  { SELF_WATCH_SKIP_HOOKS: "0" },
);
assert(
  codexStopActive.stdout === "",
  `codex stop_hook_active empty stdout (got ${JSON.stringify(codexStopActive.stdout)})`,
);

// --- self-goal: an active incomplete run drives its own continuation ---
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
const goalPayload = {
  conversation_id: goalConversationId,
  workspace_roots: [pkgRoot],
  status: "completed",
  loop_count: 0,
  stop_hook_active: false,
  generation_id: "goal-generation-0",
};
const goalFirst = runHook(goalStop, goalPayload, { SELF_GOAL_FORCE_HOOKS: "1" });
assert(
  goalFirst.status === 0 && !goalFirst.stderr,
  `goal-first probe imports cleanly (got ${JSON.stringify(goalFirst)})`,
);
assert(
  typeof parseOut(goalFirst.stdout).followup_message === "string",
  `incomplete goal injects its own followup with no learn gate (got ${JSON.stringify(goalFirst.stdout)})`,
);
const goalSecond = runHook(goalStop, goalPayload, { SELF_GOAL_FORCE_HOOKS: "1" });
assert(
  goalSecond.status === 0 &&
    !goalSecond.stderr &&
    !parseOut(goalSecond.stdout).followup_message,
  `same goal generation cannot emit a second followup (got ${JSON.stringify(goalSecond)})`,
);

const goalEmptyProbe = spawnSync(bun, [goalStop], {
  input: "",
  encoding: "utf8",
  env: {
    ...process.env,
    AGENTS_HOME: agentsHome,
    SELF_GOAL_FORCE_HOOKS: "1",
  },
});
assert(
  goalEmptyProbe.status === 0 && !goalEmptyProbe.stderr && goalEmptyProbe.stdout === "",
  `goal empty payload import exits cleanly with empty stdout (got ${JSON.stringify({ status: goalEmptyProbe.status, stdout: goalEmptyProbe.stdout, stderr: goalEmptyProbe.stderr })})`,
);

// CamelCase Codex payloads must resolve to the same dialect/session namespace.
const camelCodexConversation = "camel-codex-1";
const camelPaths = startGoalRun(pkgRoot, camelCodexConversation, {
  active: true,
  goal: "camel codex ordering",
  status: "active",
  resume_heading: "pursue-goal",
  conversation_id: camelCodexConversation,
});
assert(existsSync(camelPaths.goalMdscript), "camel codex goal tracker exists");
const camelPayload = {
  sessionId: camelCodexConversation,
  turnId: "camel-stop",
  hook_event_name: "Stop",
  permission_mode: "default",
  stop_hook_active: false,
  status: "completed",
  last_assistant_message: "done",
};
const camelGoalFirst = runHook(goalStop, camelPayload, { SELF_GOAL_FORCE_HOOKS: "1" });
assert(
  camelGoalFirst.status === 0 &&
    !camelGoalFirst.stderr &&
    parseOut(camelGoalFirst.stdout).decision === "block",
  `camel codex goal blocks on its own run (got ${JSON.stringify(camelGoalFirst)})`,
);
const camelGoalAfter = runHook(goalStop, camelPayload, { SELF_GOAL_FORCE_HOOKS: "1" });
assert(
  camelGoalAfter.status === 0 &&
    !camelGoalAfter.stderr &&
    camelGoalAfter.stdout === "",
  `camel codex goal cannot duplicate same generation (got ${JSON.stringify(camelGoalAfter)})`,
);

// Marker claims fail closed on unavailable paths, distinguish long ids that
// share a truncated prefix, and retain only a bounded marker set.
const markerProbe = spawnSync(
  bun,
  [
    "-e",
`import { readdirSync as rd, writeFileSync as wf } from "node:fs";
import { join as j } from "node:path";
import { claimStopEvent, stopEventMarkerPath, hookStateHome } from ${JSON.stringify(hookLib)};
const base = {
  dialect: "cursor", conversationId: "session", sessionKey: "cursor:session",
  root: process.cwd(), status: "completed", loopCount: 0, stopHookActive: false, raw: {}
};
const inaccessible = j(${JSON.stringify(home)}, "not-a-directory");
wf(inaccessible, "file");
process.env.AGENTS_HOME = inaccessible;
if (claimStopEvent("self-stop", { ...base, turnId: "blocked" })) process.exit(2);
process.env.AGENTS_HOME = ${JSON.stringify(join(home, "marker-home"))};
const prefix = "x".repeat(180);
const keyA = "cursor:" + prefix + "a";
const keyB = "cursor:" + prefix + "b";
if (stopEventMarkerPath("self-stop", { ...base, sessionKey: keyA }) === stopEventMarkerPath("self-stop", { ...base, sessionKey: keyB })) process.exit(7);
if (!claimStopEvent("self-stop", { ...base, sessionKey: keyA, turnId: "turn" })) process.exit(3);
if (!claimStopEvent("self-stop", { ...base, sessionKey: keyB, turnId: "turn" })) process.exit(4);
// The same session+turn may only ever be claimed once.
if (claimStopEvent("self-stop", { ...base, sessionKey: keyA, turnId: "turn" })) process.exit(13);
for (let i = 0; i < 130; i++) {
  if (!claimStopEvent("retention", { ...base, turnId: "turn-" + i })) process.exit(5);
}
const retentionPath = stopEventMarkerPath("retention", base);
const count = rd(retentionPath).filter((name) => name.endsWith(".json")).length;
if (count > 128) { console.error("retention count", count); process.exit(6); }
// Nested multi-session global retention must walk session dirs.
for (let s = 0; s < 6; s++) {
  for (let t = 0; t < 100; t++) {
    if (!claimStopEvent("global-retention", {
      ...base,
      sessionKey: "cursor:global-session-" + s,
      turnId: "gturn-" + t,
    })) process.exit(9);
  }
}
function countJsonMarkers(dir) {
  let total = 0;
  for (const name of rd(dir)) {
    if (name.startsWith(".")) continue;
    const p = j(dir, name);
    try {
      if (name.endsWith(".json")) { total += 1; continue; }
      for (const nested of rd(p)) {
        if (nested.endsWith(".json")) total += 1;
        else {
          try {
            for (const deep of rd(j(p, nested))) {
              if (deep.endsWith(".json")) total += 1;
            }
          } catch {}
        }
      }
    } catch {}
  }
  return total;
}
const globalRoot = j(hookStateHome(), "stop-events");
const globalCount = countJsonMarkers(globalRoot);
if (globalCount > 512) { console.error("global retention count", globalCount); process.exit(10); }
console.log(JSON.stringify({ count, globalCount }));
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
