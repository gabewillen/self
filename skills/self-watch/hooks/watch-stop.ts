/**
 * Stop hook: if this session's self-watch has unprocessed spool ticks,
 * force resume before the turn can end (listener is often already dead).
 *
 * Never inject watches armed by a different conversation_id — that is the
 * main cross-session leak users see as "hooks going to the wrong chat".
 */
import {
  continueWorkingPayload,
  finishHook,
  readHookInput,
} from "../../self-common/hooks/self-lib.ts";
import {
  formatPendingWatchFollowup,
  listPendingWatchesForSession,
} from "./self-lib.ts";

const input = readHookInput();

if (input.dialect === "grok" && input.reason && input.reason !== "end_turn") {
  finishHook();
}

{
  const watchSkip =
    process.env.SELF_WATCH_SKIP_HOOKS || process.env.GABE_WATCH_SKIP_HOOKS;
  if (watchSkip === "1" || watchSkip === "true") {
    finishHook();
  }
}

if (input.status === "aborted" || input.status === "error") {
  finishHook();
}

if (input.status !== "completed") {
  finishHook();
}

// Never chain on our own follow-ups.
// Cursor maps loop_count > 0 → stopHookActive in readHookInput; Claude/Codex/Grok
// set stop_hook_active. Without this, pending ticks re-inject every Stop until
// Cursor's loop_limit (default 5).
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
