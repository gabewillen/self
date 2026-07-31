/**
 * Inject active/pending self-watch context at session start so Cursor agents
 * re-attach listeners after chat/session cleanup.
 */
import { finishHook, readHookInput } from "../../self-common/hooks/self-lib.ts";
import { formatActiveWatchSessionContext } from "./self-lib.ts";

const input = readHookInput();

{
  const watchSkip =
    process.env.SELF_WATCH_SKIP_HOOKS || process.env.GABE_WATCH_SKIP_HOOKS;
  if (watchSkip === "1" || watchSkip === "true") {
    finishHook();
  }
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
