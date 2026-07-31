import {
  abortGoalRun,
  appendProgressLog,
  completeGoalRun,
  evaluateGoalCompletion,
  finishHook,
  formatGoalFollowupMessage,
  loadGoalState,
  nextGoalIteration,
  continueWorkingPayload,
  readHookInput,
  reopenGoalRun,
  resolveActiveGoalPaths,
  resolveGoalPathsIgnoringActive,
  shouldSkipGoalHooks,
} from "./goal-lib.ts";

const input = readHookInput();
const root = input.root;
const conversationId = input.conversationId;

// grok also fires Stop at session end; only a real turn end can be continued.
if (input.dialect === "grok" && input.reason && input.reason !== "end_turn") {
  finishHook();
}

// Harness owns multi-round continuation via /goal — do not double-loop with Stop hooks.
if (shouldSkipGoalHooks(input.dialect)) {
  finishHook();
}

if (!conversationId) {
  finishHook();
}

// An inactive run still has to answer to the review gate, so fall back to
// resolving this conversation's run even when it is no longer marked active.
const paths =
  resolveActiveGoalPaths(root, conversationId) ??
  resolveGoalPathsIgnoringActive(root, conversationId);
if (!paths) {
  finishHook();
}

const state = loadGoalState(paths);
if (!state) {
  finishHook();
}

// Per-run opt-out (front matter skip_hooks / loop_driver: harness-goal).
if (shouldSkipGoalHooks(input.dialect, state)) {
  finishHook();
}

// An inactive run is only legitimate when gabe-review actually closed it.
// Without this check, marking the goal complete in its own front matter ends
// the loop, and the review gate never runs.
if (!state.active) {
  if (input.status !== "completed") {
    finishHook();
  }
  // A deliberate stop or blocker is a legitimate way to leave a run inactive;
  // only a completion claim has to answer to the gabe-review gate.
  const claimedComplete = !state.status || state.status === "completed";
  if (!claimedComplete) {
    finishHook();
  }
  const closed = evaluateGoalCompletion(root, paths, conversationId);
  if (closed.complete) {
    finishHook();
  }
  reopenGoalRun(root, paths, state);
  const reopenIteration = nextGoalIteration(input.loopCount, paths);
  appendProgressLog(paths, {
    event: "completion_rejected",
    iteration: reopenIteration,
    loop_count: input.loopCount,
    reasons: closed.reasons,
  });
  finishHook(
    continueWorkingPayload(
      input.dialect,
      formatGoalFollowupMessage(
        root,
        paths,
        { ...state, active: true, resume_heading: "pursue-goal" },
        reopenIteration,
        [
          "This goal was marked complete without a gabe-review verdict; the run has been re-opened.",
          ...closed.reasons,
        ],
      ),
    ),
  );
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

const iteration = nextGoalIteration(input.loopCount, paths);
appendProgressLog(paths, {
  event: "iteration_blocked",
  iteration,
  loop_count: input.loopCount,
  reasons: completion.reasons,
});

const followupMessage = formatGoalFollowupMessage(
  root,
  paths,
  state,
  iteration,
  completion.reasons,
);

finishHook(continueWorkingPayload(input.dialect, followupMessage));
