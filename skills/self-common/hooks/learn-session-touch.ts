/**
 * UserPromptSubmit / beforeSubmitPrompt: mark this turn as user-originated so
 * Stop may run learn once.
 *
 * Cursor submits stop-hook followup_message as a normal user prompt, which
 * re-fires this hook. Claude/Codex/Grok feed decision:block reasons the same
 * way. Those synthetic prompts must not clear learn stamps or re-arm USER_TURN
 * — that is what made Stop re-inject forever.
 */
import {
  clearLearnPass,
  finishHook,
  isHarnessFollowupPrompt,
  markUserTurn,
  promptFromHookInput,
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

const prompt = promptFromHookInput(input);
if (isHarnessFollowupPrompt(prompt)) {
  // Synthetic continuation from our own Stop / block decision — leave stamps alone.
  finishHook();
}

// Real user message: reset stamp and mark origin so Stop will run learn once
// for this dialect+session only.
clearLearnPass(input.sessionKey, input.root, input.dialect);
markUserTurn(input.conversationId, input.dialect);
finishHook();
