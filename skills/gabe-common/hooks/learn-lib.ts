/**
 * Minimal stop-hook helpers for /gabe-learn (MDScript only — not a skill).
 * Keep this small; do not import gabe-goal's large goal-lib.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

export type HookDialect = "cursor" | "claude" | "codex" | "grok";

export interface HookInput {
  dialect: HookDialect;
  conversationId: string;
  root: string;
  status: "completed" | "aborted" | "error";
  loopCount: number;
  stopHookActive: boolean;
  reason?: string;
}

export interface LearnPass {
  conversation_id: string;
  loop_count: number;
  status: "required" | "satisfied";
  learn_status?: string;
  required_at?: string;
  completed_at?: string;
}

function readStdinJson<T>(): T {
  const text = readFileSync(0, "utf-8");
  if (!text.trim()) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function detectDialect(raw: Record<string, unknown>): HookDialect {
  if (process.env.GROK_HOOK_EVENT) return "grok";
  if (raw.hookEventName !== undefined || raw.sessionId !== undefined) return "grok";
  if (raw.conversation_id !== undefined || raw.workspace_roots !== undefined) {
    return "cursor";
  }
  if (raw.turn_id !== undefined) return "codex";
  return "claude";
}

export function readHookInput(): HookInput {
  const raw = readStdinJson<Record<string, unknown>>();
  const dialect = detectDialect(raw);
  const roots = Array.isArray(raw.workspace_roots)
    ? (raw.workspace_roots as unknown[]).filter(
        (r): r is string => typeof r === "string" && r.length > 0,
      )
    : [];
  const status = firstString(raw.status);
  return {
    dialect,
    conversationId: firstString(raw.conversation_id, raw.session_id, raw.sessionId),
    root:
      firstString(
        roots[0],
        raw.workspaceRoot,
        raw.cwd,
        process.env.GROK_WORKSPACE_ROOT,
        process.env.CLAUDE_PROJECT_DIR,
      ) || process.cwd(),
    status:
      status === "aborted" || status === "error"
        ? (status as "aborted" | "error")
        : "completed",
    loopCount: typeof raw.loop_count === "number" ? raw.loop_count : 0,
    stopHookActive: Boolean(raw.stop_hook_active ?? raw.stopHookActive),
    reason: firstString(raw.reason) || undefined,
  };
}

export function continueWorkingPayload(
  dialect: HookDialect,
  message: string,
): Record<string, unknown> {
  if (dialect === "cursor") {
    return { followup_message: message };
  }
  return { decision: "block", reason: message };
}

export function respond(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(payload) + "\n");
}

export function finishHook(payload: Record<string, unknown> = {}): never {
  respond(payload);
  process.exit(0);
}

export function shouldSkipLearnHooks(): boolean {
  const v = process.env.GABE_LEARN_SKIP_HOOKS;
  return v === "1" || v === "true";
}

/** Stable learn dir — not project-cwd dependent. */
export function learnHome(): string {
  const home = process.env.AGENTS_HOME
    ? resolvePath(process.env.AGENTS_HOME)
    : join(homedir(), ".agents");
  return join(home, "learn");
}

export function learnPassPath(_root: string, conversationId: string): string {
  const id = (conversationId || "unknown")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
  return join(learnHome(), `${id}.json`);
}

/** Pointer so the MDScript always finds the active stamp without conversation_id. */
export function learnActivePath(): string {
  return join(learnHome(), "ACTIVE");
}

export function loadLearnPass(path: string): LearnPass | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as LearnPass;
  } catch {
    return null;
  }
}

export function writeLearnPass(path: string, pass: LearnPass): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(pass, null, 2) + "\n", "utf8");
  writeFileSync(learnActivePath(), path + "\n", "utf8");
}

export function clearLearnPass(conversationId: string, root = process.cwd()): void {
  const path = learnPassPath(root, conversationId);
  writeLearnPass(path, {
    conversation_id: conversationId || "unknown",
    loop_count: 0,
    status: "required",
    required_at: new Date().toISOString(),
  });
}

/** Marker: next Stop may run learn because this turn started from a user message. */
export function userTurnPath(): string {
  return join(learnHome(), "USER_TURN");
}

export function markUserTurn(conversationId: string): void {
  mkdirSync(learnHome(), { recursive: true });
  writeFileSync(
    userTurnPath(),
    JSON.stringify(
      {
        conversation_id: conversationId || "unknown",
        at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

/**
 * True if a user-originated turn is pending for this conversation.
 * Watch / loop / stop-hook resumes do not set this marker.
 */
export function hasUserTurn(conversationId: string): boolean {
  const p = userTurnPath();
  if (!existsSync(p)) return false;
  try {
    const text = readFileSync(p, "utf8").trim();
    if (!text || text === "{}") return false;
    const raw = JSON.parse(text) as { conversation_id?: string };
    const id = conversationId || "unknown";
    if (
      raw.conversation_id &&
      raw.conversation_id !== "unknown" &&
      id !== "unknown" &&
      raw.conversation_id !== id
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearUserTurn(): void {
  const p = userTurnPath();
  try {
    if (existsSync(p)) unlinkSync(p);
  } catch {
    try {
      writeFileSync(p, "{}\n", "utf8");
    } catch {
      // ignore
    }
  }
}

export function resolveLearnMdscriptPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const sibling = join(here, "..", "workflows", "gabe-learn.mdscript.md");
  if (existsSync(sibling)) {
    try {
      return realpathSync(sibling);
    } catch {
      return sibling;
    }
  }
  const candidates = [
    join(homedir(), ".agents", "skills", "gabe-common", "workflows", "gabe-learn.mdscript.md"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return sibling;
}

/** Stop-hook followup: single mdscript-exec clause only. */
export function formatLearnFollowup(learnMdscript: string): string {
  return `/mdscript-exec ${learnMdscript}#reflect-and-learn`;
}
