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

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const learnLib = join(pkgRoot, "skills/gabe-common/hooks/learn-lib.ts");
const learnTouch = join(pkgRoot, "skills/gabe-common/hooks/learn-session-touch.ts");
const learnStop = join(pkgRoot, "skills/gabe-common/hooks/learn-stop.ts");
const bun = process.env.BUN_BIN || "bun";

const home = mkdtempSync(join(tmpdir(), "gabe-hook-scope-"));
const agentsHome = join(home, ".agents");
mkdirSync(join(agentsHome, "learn"), { recursive: true });

function runHook(script, payload, envExtra = {}) {
  const r = spawnSync(bun, [script], {
    encoding: "utf8",
    input: JSON.stringify(payload),
    env: {
      ...process.env,
      AGENTS_HOME: agentsHome,
      HOME: home,
      GABE_LEARN_SKIP_HOOKS: "0",
      GABE_WATCH_SKIP_HOOKS: "1",
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

// --- dialect unit checks via a tiny bun eval importing learn-lib ---
const dialectProbe = spawnSync(
  bun,
  [
    "-e",
    `
import { detectDialect, resolveConversationId, sessionKeyFor } from ${JSON.stringify(learnLib)};

const cases = [
  [{ conversation_id: "c1", workspace_roots: ["/tmp"] }, "cursor", "c1"],
  [{ session_id: "s1", transcript_path: "/t" }, "claude", "s1"],
  [{ session_id: "s2", turn_id: "t1" }, "codex", "s2"],
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

// Cursor session A arms learn
const touchA = runHook(learnTouch, {
  conversation_id: "cursor-A",
  workspace_roots: [pkgRoot],
  generation_id: "gen-1",
  hook_event_name: "beforeSubmitPrompt",
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

rmSync(home, { recursive: true, force: true });

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nok: hook session scope tests passed");
