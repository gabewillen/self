/**
 * Stop hook: if this session's self-watch has unprocessed spool ticks,
 * force resume before the turn can end (listener is often already dead).
 *
 * Never inject watches armed by a different conversation_id — that is the
 * main cross-session leak users see as "hooks going to the wrong chat".
 */
import {
  claimStopEvent,
  continueWorkingPayload,
  finishHook,
  learnPassRequiredForStop,
  readHookInput,
  stopEventClaimFailed,
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
// Claude/Codex/Grok set stop_hook_active. Cursor does not expose that field,
// so claim the generation_id once below; a repeated Stop for the same turn
// exits, while a later turn remains eligible to drain the pending tick.
if (input.stopHookActive) {
  finishHook();
}

if (!input.conversationId) {
  finishHook();
}
// self-learn owns priority for a real user turn. Deferring before claiming
// lets learn-stop win even when hooks are invoked in reverse order.
if (learnPassRequiredForStop(input)) {
  finishHook();
}

const pending = listPendingWatchesForSession(
  input.conversationId,
  input.dialect,
);
if (!pending.length) {
  finishHook();
}
if (!claimStopEvent("self-stop", input)) {
  if (stopEventClaimFailed()) {
    finishHook(
      continueWorkingPayload(
        input.dialect,
        "Stop-hook marker storage is unavailable; do not end this turn until the pending watch can be recorded.",
      ),
    );
  }
  finishHook();
}
try {
  finishHook(
    continueWorkingPayload(input.dialect, formatPendingWatchFollowup(pending)),
  );
} catch {
  // Keep claim until TTL recovery if finishHook itself fails mid-write.
  finishHook(
    continueWorkingPayload(
      input.dialect,
      "Stop-hook could not emit the pending watch followup; do not end this turn until the watch can be recorded.",
    ),
  );
}
