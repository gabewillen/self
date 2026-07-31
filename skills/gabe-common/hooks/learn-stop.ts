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
  listPendingWatchesForSession,
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

// Never chain on our own follow-ups (Cursor re-runs Stop after followup_message).
// Watch / learn / goal resumes set stop_hook_active; do not re-inject.
if (input.stopHookActive) {
  finishHook();
}

// Unscoped payload: do not touch shared learn/watch state or inject followups.
if (!input.conversationId || !input.sessionKey) {
  finishHook();
}

// Pending gabe-watch ticks for *this* session only (never steal another chat).
if (
  process.env.GABE_WATCH_SKIP_HOOKS !== "1" &&
  process.env.GABE_WATCH_SKIP_HOOKS !== "true"
) {
  const pending = listPendingWatchesForSession(
    input.conversationId,
    input.dialect,
  );
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

const passPath = learnPassPath(input.root, input.sessionKey);
const pass = loadLearnPass(passPath);
const learnMdscript = resolveLearnMdscriptPath();
const loopCount = input.loopCount || 0;

// Already completed learn for this user cycle → allow stop.
if (pass && pass.status === "satisfied") {
  finishHook();
}

// Only user-originated turns may start learn (UserPromptSubmit sets user-turn).
if (!hasUserTurn(input.conversationId, input.dialect)) {
  finishHook();
}

clearUserTurn(input.conversationId, input.dialect);

writeLearnPass(passPath, {
  conversation_id: input.conversationId,
  dialect: input.dialect,
  session_key: input.sessionKey,
  loop_count: loopCount,
  status: "required",
  required_at: new Date().toISOString(),
});

finishHook(
  continueWorkingPayload(input.dialect, formatLearnFollowup(learnMdscript)),
);
