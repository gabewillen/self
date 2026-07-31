/**
 * Inject active/pending gabe-watch context at session start so Cursor agents
 * re-attach listeners after chat/session cleanup.
 */
import { finishHook, readHookInput } from "../../gabe-common/hooks/learn-lib.ts";
import { formatActiveWatchSessionContext } from "./watch-lib.ts";

const input = readHookInput();

if (process.env.GABE_WATCH_SKIP_HOOKS === "1" || process.env.GABE_WATCH_SKIP_HOOKS === "true") {
  finishHook();
}

const context = formatActiveWatchSessionContext();
if (!context) {
  finishHook();
}

// Cursor sessionStart wants additional_context; other harnesses use hookSpecificOutput.
if (input.dialect === "cursor") {
  finishHook({ continue: true, additional_context: context });
}

finishHook({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: context,
  },
});
