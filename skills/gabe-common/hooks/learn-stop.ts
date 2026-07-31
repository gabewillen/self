import {
  clearUserTurn,
  continueWorkingPayload,
  finishHook,
  formatLearnFollowup,
  hasUserTurn,
  loadLearnPass,
  readHookInput,
  resolveLearnMdscriptPath,
  shouldSkipLearnHooks,
  writeLearnPass,
  learnPassPath,
} from "./learn-lib.ts";
import {
  formatPendingWatchFollowup,
  listPendingWatches,
} from "../../gabe-watch/hooks/watch-lib.ts";

const input = readHookInput();

// grok also fires Stop at session end; only a real turn end can be continued.
if (input.dialect === "grok" && input.reason && input.reason !== "end_turn") {
  finishHook();
}

if (input.status === "aborted" || input.status === "error") {
  finishHook();
}

if (input.status !== "completed") {
  finishHook();
}

// Pending gabe-watch ticks beat learn.
if (
  process.env.GABE_WATCH_SKIP_HOOKS !== "1" &&
  process.env.GABE_WATCH_SKIP_HOOKS !== "true"
) {
  const pending = listPendingWatches();
  if (pending.length) {
    const msg = formatPendingWatchFollowup(pending);
    if (msg) {
      finishHook(continueWorkingPayload(input.dialect, msg));
    }
  }
}

if (shouldSkipLearnHooks()) {
  finishHook();
}

const conversationId = input.conversationId || "unknown";
const passPath = learnPassPath(input.root, conversationId);
const pass = loadLearnPass(passPath);
const learnMdscript = resolveLearnMdscriptPath();
const loopCount = input.loopCount || 0;
const userOriginated = hasUserTurn(conversationId);
const learnPending = pass?.status === "required";

// Already completed learn for this cycle → allow stop.
if (pass && pass.status === "satisfied") {
  finishHook();
}

// Watch / loop / stop-hook resumes never set USER_TURN. Skip learn unless we
// already asked for a pass (status=required) and are waiting for the stamp.
if (!userOriginated && !learnPending) {
  finishHook();
}

// Consuming USER_TURN here so the learn follow-up's own stop is not treated as
// a new user message (it still re-fires while status stays required until stamp).
if (userOriginated) {
  clearUserTurn();
}

writeLearnPass(passPath, {
  conversation_id: conversationId,
  loop_count: loopCount,
  status: "required",
  required_at: pass?.required_at || new Date().toISOString(),
});

finishHook(
  continueWorkingPayload(input.dialect, formatLearnFollowup(learnMdscript)),
);
