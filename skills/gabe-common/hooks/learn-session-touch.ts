/**
 * UserPromptSubmit / beforeSubmitPrompt: clear the satisfied learn stamp so the
 * next Stop requires a new learn pass for the new user turn — without re-firing
 * learn on every stop after the first completion.
 */
import {
  clearLearnPass,
  finishHook,
  readHookInput,
  shouldSkipLearnHooks,
} from "./learn-lib.ts";

const input = readHookInput();

if (shouldSkipLearnHooks()) {
  finishHook();
}

const conversationId = input.conversationId || "unknown";
clearLearnPass(conversationId, input.root);
finishHook();
