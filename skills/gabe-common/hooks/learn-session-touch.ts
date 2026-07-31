/**
 * UserPromptSubmit / beforeSubmitPrompt: mark this turn as user-originated so
 * Stop may run learn. Watch ticks and stop-hook followups never set this.
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

const conversationId = input.conversationId || "unknown";
// New user message: reset stamp and mark origin so Stop will run learn once.
clearLearnPass(conversationId, input.root);
markUserTurn(conversationId);
finishHook();
