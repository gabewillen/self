/**
 * Stop hook: if this session's gabe-watch has unprocessed spool ticks,
 * force resume before the turn can end (listener is often already dead).
 *
 * Never inject watches armed by a different conversation_id — that is the
 * main cross-session leak users see as "hooks going to the wrong chat".
 */
import {
  continueWorkingPayload,
  finishHook,
  readHookInput,
} from "../../gabe-common/hooks/learn-lib.ts";
import {
  formatPendingWatchFollowup,
  listPendingWatchesForSession,
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

// Never chain on our own follow-ups (Cursor re-runs Stop after followup_message).
if (input.stopHookActive) {
  finishHook();
}

if (!input.conversationId) {
  finishHook();
}

const pending = listPendingWatchesForSession(
  input.conversationId,
  input.dialect,
);
if (!pending.length) {
  finishHook();
}

finishHook(
  continueWorkingPayload(input.dialect, formatPendingWatchFollowup(pending)),
);
