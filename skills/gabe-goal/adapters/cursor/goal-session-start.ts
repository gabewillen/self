import { join } from "node:path";
import {
  buildActiveGoalContext,
  ensureSessionDirectory,
  finishHook,
  PROJECT_GOAL_LOG_PATH,
  readStdinJson,
  safeSessionId,
  SESSIONS_DIR,
  workspaceRootFromInput,
} from "./goal-lib";

interface SessionStartInput {
  session_id: string;
  workspace_roots?: string[];
}

const input = readStdinJson<SessionStartInput>();
const conversationId = input.session_id?.trim();
const root = workspaceRootFromInput(input.workspace_roots);

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
  `- active-run.json: pointer to the current run only (never delete prior runs/)`,
  `- session-log.jsonl: append-only per conversation — never truncate or overwrite`,
  `- ${PROJECT_GOAL_LOG_PATH}: append-only project audit log — never truncate or overwrite`,
  `- start each goal with startGoalRun → runs/<run_id>/goal.mdscript.md (front matter is run state; no goal.json)`,
  `- goal.mdscript.md: durable executable tracker; stop hook resumes with mdscript-exec <run>/goal.mdscript.md#pursue-goal`,
  `- progress.jsonl: append-only per run (one JSON line per iteration)`,
  `- proof_kind in goal.json: tui → captures required; ui → images required; default → logs sufficient`,
  "Parallel chats use separate session directories. Never write another conversation's runs or logs.",
];

if (activeGoalContext) {
  contextLines.push("", activeGoalContext);
}

finishHook({
  additional_context: contextLines.join("\n"),
});
