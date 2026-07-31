import {
  continueWorkingPayload,
  finishHook,
  formatLearnFollowup,
  loadLearnPass,
  readHookInput,
  resolveLearnMdscriptPath,
  shouldSkipLearnHooks,
  writeLearnPass,
  learnPassPath,
} from "./learn-lib.ts";

const input = readHookInput();

// grok also fires Stop at session end; only a real turn end can be continued.
if (input.dialect === "grok" && input.reason && input.reason !== "end_turn") {
  finishHook();
}

if (shouldSkipLearnHooks()) {
  finishHook();
}

if (input.status === "aborted" || input.status === "error") {
  finishHook();
}

if (input.status !== "completed") {
  finishHook();
}

const conversationId = input.conversationId || "unknown";
const passPath = learnPassPath(input.root, conversationId);
const pass = loadLearnPass(passPath);
const learnMdscript = resolveLearnMdscriptPath();
const loopCount = input.loopCount || 0;

// After a learn follow-up: allow exit only when the MDScript stamped satisfied.
if (input.stopHookActive) {
  if (pass && pass.status === "satisfied" && pass.conversation_id === conversationId) {
    finishHook();
  }
  // Still required or missing stamp — force the learn MDScript again.
  writeLearnPass(passPath, {
    conversation_id: conversationId,
    loop_count: loopCount,
    status: "required",
    required_at: pass?.required_at || new Date().toISOString(),
  });
  finishHook(
    continueWorkingPayload(
      input.dialect,
      formatLearnFollowup(learnMdscript, passPath, loopCount),
    ),
  );
}

// Fresh end of turn (user turn completed): always require a learn pass.
writeLearnPass(passPath, {
  conversation_id: conversationId,
  loop_count: loopCount,
  status: "required",
  required_at: new Date().toISOString(),
});

finishHook(
  continueWorkingPayload(
    input.dialect,
    formatLearnFollowup(learnMdscript, passPath, loopCount),
  ),
);
