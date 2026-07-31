/**
 * Cursor Stop hook: if an active gabe-watch has unprocessed spool ticks,
 * force resume before the turn can end (listener is often already dead).
 */
import { continueWorkingPayload, finishHook, readHookInput } from "../../gabe-common/hooks/learn-lib.ts";
import {
  formatPendingWatchFollowup,
  listPendingWatches,
} from "./watch-lib.ts";

const input = readHookInput();

if (input.dialect === "grok" && input.reason && input.reason !== "end_turn") {
  finishHook();
}

if (process.env.GABE_WATCH_SKIP_HOOKS === "1" || process.env.GABE_WATCH_SKIP_HOOKS === "true") {
  finishHook();
}

if (input.status === "aborted" || input.status === "error") {
  finishHook();
}

if (input.status !== "completed") {
  finishHook();
}

const pending = listPendingWatches();
if (!pending.length) {
  finishHook();
}

// Always force resume when ticks are pending — do not require stopHookActive.
finishHook(
  continueWorkingPayload(input.dialect, formatPendingWatchFollowup(pending)),
);
