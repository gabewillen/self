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
} from "./self-lib.ts";
import {
  claimStopEvent,
  learnPassRequiredForStop,
  releaseStopEventClaim,
  stopEventClaimFailed,
} from "../../self-common/hooks/self-lib.ts";

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
if (input.stopHookActive) {
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
// self-learn owns priority for a real user turn, including inactive runs that
// would otherwise reopen themselves before the required learn pass.
if (learnPassRequiredForStop(input)) {
  finishHook();
}

// An inactive run is only legitimate when self-review actually closed it.
// Without this check, marking the goal complete in its own front matter ends
// the loop, and the review gate never runs.
if (!state.active) {
  if (input.status !== "completed") {
    finishHook();
  }
  // A deliberate stop or blocker is a legitimate way to leave a run inactive;
  // only a completion claim has to answer to the self-review gate.
  const claimedComplete = !state.status || state.status === "completed";
  if (!claimedComplete) {
    finishHook();
  }
  const closed = evaluateGoalCompletion(root, paths, conversationId);
  if (closed.complete) {
    finishHook();
  }
  if (!claimStopEvent("self-stop", input)) {
    if (stopEventClaimFailed()) {
      finishHook(
        continueWorkingPayload(
          input.dialect,
          "Stop-hook marker storage is unavailable; do not end this turn until goal completion can be recorded.",
        ),
      );
    }
    finishHook();
  }
  try {
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
            "This goal was marked complete without a self-review verdict; the run has been re-opened.",
            ...closed.reasons,
          ],
        ),
      ),
    );
} catch {
    releaseStopEventClaim("self-stop", input);
    finishHook(
      continueWorkingPayload(
        input.dialect,
        "Stop-hook could not record goal reopen state; do not end this turn until goal progress can be written.",
      ),
    );
  }
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
if (!claimStopEvent("self-stop", input)) {
  if (stopEventClaimFailed()) {
    finishHook(
      continueWorkingPayload(
        input.dialect,
        "Stop-hook marker storage is unavailable; do not end this turn until goal progress can be recorded.",
      ),
    );
  }
  finishHook();
}

const iteration = nextGoalIteration(input.loopCount, paths);
try {
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
} catch {
  releaseStopEventClaim("self-stop", input);
  finishHook(
    continueWorkingPayload(
      input.dialect,
      "Stop-hook could not record goal progress; do not end this turn until goal state can be written.",
    ),
  );
}
