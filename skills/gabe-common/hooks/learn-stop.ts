import {
  continueWorkingPayload,
  finishHook,
  formatLearnFollowup,
  loadLearnPass,
  readHookInput,
  resolveLearnMdscriptPath,
  shouldSkipLearnHooks,
  writeLearnPass,
  learnPassPath,
} from "./learn-lib.ts";
import {
  formatPendingWatchFollowup,
  listPendingWatches,
} from "../../gabe-watch/hooks/watch-lib.ts";

const input = readHookInput();

// grok also fires Stop at session end; only a real turn end can be continued.
if (input.dialect === "grok" && input.reason && input.reason !== "end_turn") {
  finishHook();
}

if (input.status === "aborted" || input.status === "error") {
  finishHook();
}

if (input.status !== "completed") {
  finishHook();
}

// Pending gabe-watch ticks beat learn.
if (
  process.env.GABE_WATCH_SKIP_HOOKS !== "1" &&
  process.env.GABE_WATCH_SKIP_HOOKS !== "true"
) {
  const pending = listPendingWatches();
  if (pending.length) {
    const msg = formatPendingWatchFollowup(pending);
    if (msg) {
      finishHook(continueWorkingPayload(input.dialect, msg));
    }
  }
}

if (shouldSkipLearnHooks()) {
  finishHook();
}

const conversationId = input.conversationId || "unknown";
const passPath = learnPassPath(input.root, conversationId);
const pass = loadLearnPass(passPath);
const learnMdscript = resolveLearnMdscriptPath();
const loopCount = input.loopCount || 0;

// Learn already completed for this conversation → allow the stop.
// Do not depend on stop_hook_active: Cursor often omits it, which previously
// re-wrote status=required and re-fired learn forever.
if (pass && pass.status === "satisfied") {
  finishHook();
}

// Not satisfied yet: require one learn pass and inject a single mdscript-exec.
writeLearnPass(passPath, {
  conversation_id: conversationId,
  loop_count: loopCount,
  status: "required",
  required_at: pass?.required_at || new Date().toISOString(),
});

finishHook(
  continueWorkingPayload(input.dialect, formatLearnFollowup(learnMdscript)),
);
