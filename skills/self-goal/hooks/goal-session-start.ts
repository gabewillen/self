import { join } from "node:path";
import {
  buildActiveGoalContext,
  ensureSessionDirectory,
  finishHook,
  PROJECT_GOAL_LOG_PATH,
  additionalContextPayload,
  readHookInput,
  safeSessionId,
  shouldSkipGoalHooks,
  SESSIONS_DIR,
} from "./goal-lib.ts";

const input = readHookInput();
const conversationId = input.conversationId;
const root = input.root;

// When the harness owns /goal, skip self-goal session injection — host goal drives rounds.
if (shouldSkipGoalHooks(input.dialect)) {
  finishHook();
}

if (!conversationId) {
  finishHook();
}

ensureSessionDirectory(root, conversationId);
const sessionDir = join(SESSIONS_DIR, safeSessionId(conversationId));
const activeGoalContext = buildActiveGoalContext(root, conversationId);

const contextLines = [
  "Goal multi-agent session (this chat only):",
  `- conversation_id: ${conversationId}`,
  `- session_dir: ${sessionDir}`,
  `- runs/: ${sessionDir}/runs/<run_id>/ — one immutable directory per goal run`,
  `- current run: the newest runs/<run_id>/goal.mdscript.md with active: true in front matter`,
  `- session-log.jsonl: append-only per conversation — never truncate or overwrite`,
  `- ${PROJECT_GOAL_LOG_PATH}: append-only project audit log — never truncate or overwrite`,
  `- start each goal with startGoalRun → runs/<run_id>/goal.mdscript.md (front matter is sole run state)`,
  `- goal.mdscript.md: durable executable tracker; resume with mdscript-exec <run>/goal.mdscript.md#pursue-goal`,
  `- progress.jsonl: append-only per run (one JSON line per iteration)`,
  `- proof_kind in front matter: tui → captures required; ui → images required; default → logs sufficient`,
  "Parallel chats use separate session directories. Never write another conversation's runs or logs.",
];

if (activeGoalContext) {
  contextLines.push("", activeGoalContext);
}

finishHook(
  additionalContextPayload(input.dialect, "SessionStart", contextLines.join("\n")),
);
