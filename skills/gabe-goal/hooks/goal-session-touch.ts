import {
  buildActiveGoalContext,
  ensureSessionDirectory,
  finishHook,
  additionalContextPayload,
  readHookInput,
} from "./goal-lib.ts";

const input = readHookInput();
const conversationId = input.conversationId;
const root = input.root;
const orchestratorModel = input.model;

if (conversationId) {
  ensureSessionDirectory(root, conversationId);
}

const activeGoalContext = conversationId
  ? buildActiveGoalContext(root, conversationId, orchestratorModel)
  : null;

if (activeGoalContext) {
  finishHook(
    additionalContextPayload(input.dialect, "UserPromptSubmit", activeGoalContext),
  );
}

finishHook({ continue: true });
