import {
  abortGoalRun,
  appendProgressLog,
  completeGoalRun,
  evaluateGoalCompletion,
  finishHook,
  formatGoalFollowupMessage,
  loadGoalState,
  nextGoalIteration,
  readStdinJson,
  resolveActiveGoalPaths,
} from "./goal-lib";

interface StopHookInput {
  conversation_id?: string;
  status: "completed" | "aborted" | "error";
  loop_count: number;
  workspace_roots?: string[];
}

const input = readStdinJson<StopHookInput>();
const root = input.workspace_roots?.filter(Boolean)[0] ?? process.cwd();
const conversationId = input.conversation_id?.trim();

if (!conversationId) {
  finishHook();
}

const paths = resolveActiveGoalPaths(root, conversationId);
if (!paths) {
  finishHook();
}

const state = loadGoalState(paths);
if (!state?.active) {
  finishHook();
}

if (input.status === "aborted" || input.status === "error") {
  abortGoalRun(root, paths, state, input.status);
  finishHook();
}

if (input.status !== "completed") {
  finishHook();
}

const completion = evaluateGoalCompletion(root, paths, conversationId);

if (completion.complete) {
  completeGoalRun(root, paths, state);
  finishHook();
}

const iteration = nextGoalIteration(input.loop_count, paths);
appendProgressLog(paths, {
  event: "iteration_blocked",
  iteration,
  loop_count: input.loop_count,
  reasons: completion.reasons,
});

const followupMessage = formatGoalFollowupMessage(
  root,
  paths,
  state,
  iteration,
  completion.reasons,
);

finishHook({ followup_message: followupMessage });
