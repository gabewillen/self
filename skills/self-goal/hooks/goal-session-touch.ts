import {
  buildActiveGoalContext,
  ensureSessionDirectory,
  finishHook,
  additionalContextPayload,
  readHookInput,
  shouldSkipGoalHooks,
} from "./goal-lib.ts";

const input = readHookInput();
const conversationId = input.conversationId;
const root = input.root;
const orchestratorModel = input.model;

// When the harness owns /goal, skip self-goal prompt injection.
if (shouldSkipGoalHooks(input.dialect)) {
  finishHook({ continue: true });
}

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
