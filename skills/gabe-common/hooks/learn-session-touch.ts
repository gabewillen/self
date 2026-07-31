/**
 * UserPromptSubmit / beforeSubmitPrompt: mark this turn as user-originated so
 * Stop may run learn. Watch ticks and stop-hook followups never set this.
 *
 * Requires a real harness session id — unscoped prompts do not arm learn.
 */
import {
  clearLearnPass,
  finishHook,
  markUserTurn,
  readHookInput,
  shouldSkipLearnHooks,
} from "./learn-lib.ts";

const input = readHookInput();

if (shouldSkipLearnHooks()) {
  finishHook();
}

// No session id → refuse to write global/"unknown" stamps (cross-chat bleed).
if (!input.conversationId || !input.sessionKey) {
  finishHook();
}

// New user message: reset stamp and mark origin so Stop will run learn once
// for this dialect+session only.
clearLearnPass(input.sessionKey, input.root, input.dialect);
markUserTurn(input.conversationId, input.dialect);
finishHook();
