import {
  claimStopEvent,
  clearUserTurn,
  continueWorkingPayload,
  finishHook,
  formatLearnFollowup,
  hasUserTurn,
  learnPassRequiredForStop,
  loadLearnPass,
  readHookInput,
  resolveLearnMdscriptPath,
  shouldSkipLearnHooks,
  stopEventClaimFailed,
  releaseStopEventClaim,
  writeLearnPass,
  learnPassPath,
} from "./self-lib.ts";

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

// Never chain on Claude/Codex/Grok stop-hook continuations.
if (input.stopHookActive) {
  finishHook();
}

// Unscoped payload: do not touch shared learn/watch state or inject followups.
if (!input.conversationId || !input.sessionKey) {
  finishHook();
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

// Already injected the learn followup for this cycle (Cursor has no
// stop_hook_active; this stamp stops the re-inject loop).
if (pass && (pass.status === "in_flight" || pass.followup_injected_at)) {
  finishHook();
}

// Only a real user-originated turn may start learn (session-touch sets USER_TURN).
// Followup prompts must not re-arm USER_TURN (see learn-session-touch).
if (!hasUserTurn(input.conversationId, input.dialect)) {
  finishHook();
}
if (!learnPassRequiredForStop(input)) {
  finishHook();
}
if (!claimStopEvent("self-stop", input)) {
  if (stopEventClaimFailed()) {
    finishHook(
      continueWorkingPayload(
        input.dialect,
        "Stop-hook marker storage is unavailable; do not end this turn until the required learn pass can be recorded.",
      ),
    );
  }
  finishHook();
}
try {
  // Write the durable in-flight stamp before clearing the arm. If this fails,
  // release the claim and leave USER_TURN armed so the next Stop retries.
  writeLearnPass(passPath, {
    conversation_id: input.conversationId,
    dialect: input.dialect,
    session_key: input.sessionKey,
    loop_count: loopCount,
    status: "in_flight",
    required_at: new Date().toISOString(),
    followup_injected_at: new Date().toISOString(),
  });
  clearUserTurn(input.conversationId, input.dialect);
} catch {
  releaseStopEventClaim("self-stop", input);
  finishHook();
}

finishHook(
  continueWorkingPayload(
    input.dialect,
    formatLearnFollowup(learnMdscript, input.sessionKey),
  ),
);
