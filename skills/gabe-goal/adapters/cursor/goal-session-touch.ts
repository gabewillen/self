import {
  buildActiveGoalContext,
  ensureSessionDirectory,
  finishHook,
  readStdinJson,
  workspaceRootFromInput,
} from "./goal-lib.ts";

interface BeforeSubmitPromptInput {
  conversation_id?: string;
  workspace_roots?: string[];
  prompt?: string;
  model?: string;
}

const input = readStdinJson<BeforeSubmitPromptInput>();
const conversationId = input.conversation_id?.trim();
const root = workspaceRootFromInput(input.workspace_roots);
const orchestratorModel = input.model?.trim();

if (conversationId) {
  ensureSessionDirectory(root, conversationId);
}

const activeGoalContext = conversationId
  ? buildActiveGoalContext(root, conversationId, orchestratorModel)
  : null;

if (activeGoalContext) {
  finishHook({
    continue: true,
    additional_context: activeGoalContext,
  });
}

finishHook({ continue: true });
