/**
 * Minimal stop-hook helpers for /self-learn (MDScript only — not a skill).
 * Keep this small; do not import self-goal's large hooks/self-lib.
 *
 * Session identity (from harness docs):
 * - Cursor: conversation_id (+ generation_id per prompt; workspace_roots)
 * - Claude Code: session_id (+ transcript_path; stop_hook_active)
 * - Codex: session_id (+ turn_id per turn; stop_hook_active)
 * - Grok: sessionId / GROK_SESSION_ID (+ stopHookActive; reason end_turn)
 *
 * All durable stamps are namespaced by dialect + session so parallel chats
 * cannot steal USER_TURN, learn passes, or ACTIVE pointers from each other.
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
  /** Stable chat/session id for this harness. Empty when the payload is unscoped. */
  conversationId: string;
  /** Namespaced key: "<dialect>:<conversationId>". Empty when unscoped. */
  sessionKey: string;
  root: string;
  status: "completed" | "aborted" | "error";
  loopCount: number;
  stopHookActive: boolean;
  reason?: string;
  /** Cursor generation_id or Codex turn_id when present (turn-scoped; not for durable state). */
  turnId?: string;
  model?: string;
  /** Raw stdin object for dialect-specific fields (last_assistant_message, etc.). */
  raw: Record<string, unknown>;
}

export interface LearnPass {
  conversation_id: string;
  dialect?: HookDialect;
  session_key?: string;
  loop_count: number;
  status: "required" | "satisfied" | "in_flight";
  learn_status?: string;
  required_at?: string;
  completed_at?: string;
  /** Set when Stop already injected the learn followup for this user cycle. */
  followup_injected_at?: string;
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

/**
 * Detect harness from payload + env.
 * Order matters: Grok also loads Cursor/Claude hook files, so prefer
 * GROK_* env and camelCase sessionId before snake_case conversation_id.
 */
export function detectDialect(raw: Record<string, unknown>): HookDialect {
  if (
    process.env.GROK_HOOK_EVENT ||
    process.env.GROK_SESSION_ID ||
    process.env.GROK_HOOK_NAME
  ) {
    return "grok";
  }
  // Cursor: conversation_id + workspace_roots (+ generation_id, loop_count).
  if (
    raw.conversation_id !== undefined ||
    raw.workspace_roots !== undefined ||
    raw.generation_id !== undefined
  ) {
    return "cursor";
  }
  // Codex CLI/app wire format: turn_id/turnId on turn-scoped events, or
  // permission_mode + hook_event_name on SessionStart/Stop/UserPromptSubmit.
  // IMPORTANT: do not classify Codex as Grok just because sessionId is camelCase.
  const hookEventRaw = raw.hook_event_name ?? raw.hookEventName;
  const hookEvent = typeof hookEventRaw === "string" ? hookEventRaw : "";
  if (
    raw.turn_id !== undefined ||
    raw.turnId !== undefined ||
    (
      (raw.permission_mode !== undefined || raw.permissionMode !== undefined) &&
      (raw.session_id !== undefined || raw.sessionId !== undefined) &&
      /^(Stop|SubagentStop|UserPromptSubmit|SessionStart|SessionEnd|PreToolUse|PostToolUse|PreCompact|PostCompact|PermissionRequest|SubagentStart)$/i.test(
        hookEvent,
      )
    )
  ) {
    return "codex";
  }
  // Grok stdin is camelCase throughout (hookEventName, sessionId, stopHookActive)
  // without Codex permission_mode / turn ids.
  if (raw.hookEventName !== undefined || raw.sessionId !== undefined) {
    return "grok";
  }
  // Claude Code default: snake_case session_id, no turn_id/permission_mode pair.
  return "claude";
}

/**
 * Resolve the stable session id for the current hook payload.
 * Never invents "unknown" — callers must fail closed when empty.
 */
export function resolveConversationId(
  dialect: HookDialect,
  raw: Record<string, unknown>,
): string {
  if (dialect === "cursor") {
    // Official Cursor common schema uses conversation_id; sessionStart also
    // documents session_id as "same as conversation_id".
    return firstString(raw.conversation_id, raw.session_id);
  }
  if (dialect === "grok") {
    return firstString(
      raw.sessionId,
      process.env.GROK_SESSION_ID,
      raw.session_id,
    );
  }
  // Claude + Codex
  return firstString(raw.session_id, raw.sessionId, process.env.GROK_SESSION_ID);
}

export function sessionKeyFor(dialect: HookDialect, conversationId: string): string {
  const id = (conversationId || "").trim();
  if (!id) return "";
  return `${dialect}:${id}`;
}

export function sanitizeSessionKey(sessionKey: string): string {
  return (sessionKey || "unscoped")
    .replace(/[^a-zA-Z0-9._:-]+/g, "_")
    .slice(0, 160);
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
  const conversationId = resolveConversationId(dialect, raw);
  const sessionKey = sessionKeyFor(dialect, conversationId);
  const loopCount =
    typeof raw.loop_count === "number"
      ? raw.loop_count
      : typeof raw.loopCount === "number"
        ? raw.loopCount
        : 0;
  // Claude/Codex/Grok set stop_hook_active / stopHookActive on Stop continuations.
  // Cursor does not document that field; it uses loop_count (do not map loop_count
  // into stopHookActive — it may not reset every user turn and would permanently
  // suppress learn). Cursor self-chain is broken by ignoring synthetic prompts in
  // session-touch and by requiring USER_TURN before inject.
  const stopHookActive = Boolean(raw.stop_hook_active ?? raw.stopHookActive);
  return {
    dialect,
    conversationId,
    sessionKey,
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
    loopCount,
    stopHookActive,
    reason: firstString(raw.reason) || undefined,
    turnId:
      firstString(raw.generation_id, raw.turn_id, raw.turnId) || undefined,
    model: firstString(raw.model) || undefined,
    raw,
  };
}

/**
 * Prompt text from beforeSubmitPrompt / UserPromptSubmit when the harness
 * includes it (Cursor: `prompt`; Claude/Codex often `prompt` too).
 */
export function promptFromHookInput(input: HookInput): string {
  return firstString(
    input.raw.prompt,
    input.raw.user_prompt,
    input.raw.userPrompt,
    input.raw.message,
    input.raw.text,
  );
}

/**
 * True when the submitted "user" text is actually a stop-hook / block-decision
 * continuation we (or sibling self hooks) injected. Cursor re-fires
 * beforeSubmitPrompt for followup_message; Claude/Codex/Grok feed decision
 * reasons back as the next user turn. Those must not re-arm USER_TURN or
 * clear a satisfied learn pass.
 */
export function isHarnessFollowupPrompt(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  // Learn / watch / goal MDScript followups (single-line form).
  if (/^\/?mdscript-exec\b/i.test(t)) return true;
  if (/#reflect-and-learn\b/i.test(t)) return true;
  if (/#resume-watch\b/i.test(t)) return true;
  if (/self-learn\.mdscript\.md/i.test(t)) return true;
  if (/self-watch-.*\.mdscript\.md/i.test(t)) return true;
  // Goal stop followups are also mdscript-exec clauses from formatGoalFollowupMessage.
  if (/\/mdscript-exec\b/i.test(t) && /#/.test(t)) return true;
  return false;
}

export function continueWorkingPayload(
  dialect: HookDialect,
  message: string,
): Record<string, unknown> {
  if (dialect === "cursor") {
    return { followup_message: message };
  }
  // Claude, Codex, Grok: block-stop with reason fed back as the next user message.
  // Codex Stop is deny_unknown_fields; systemMessage is a universal allowed field
  // and makes the continuation visible in the TUI.
  if (dialect === "codex") {
    return {
      decision: "block",
      reason: message,
      systemMessage: "self stop hook continuing turn",
    };
  }
  return { decision: "block", reason: message };
}

export function respond(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(payload) + "\n");
}

export function finishHook(payload: Record<string, unknown> = {}): never {
  // Empty allow-stop: empty stdout is the documented Codex completed/no-op form.
  if (!payload || Object.keys(payload).length === 0) {
    process.exit(0);
  }
  respond(payload);
  process.exit(0);
}

export function shouldSkipLearnHooks(): boolean {
  const v = process.env.SELF_LEARN_SKIP_HOOKS ?? process.env.GABE_LEARN_SKIP_HOOKS;
  return v === "1" || v === "true";
}

/** Stable learn dir — not project-cwd dependent. */
export function learnHome(): string {
  const home = process.env.AGENTS_HOME
    ? resolvePath(process.env.AGENTS_HOME)
    : join(homedir(), ".agents");
  return join(home, "learn");
}

/**
 * Per-session learn pass path. Prefer sessionKey (dialect-scoped);
 * fall back to raw conversationId for legacy stamps only when reading.
 */
export function learnPassPath(
  _root: string,
  sessionKeyOrConversationId: string,
): string {
  const id = sanitizeSessionKey(sessionKeyOrConversationId);
  return join(learnHome(), `${id}.json`);
}

/** Pointer so the MDScript finds the active stamp for *this* session. */
export function learnActivePath(sessionKey?: string): string {
  if (sessionKey) {
    return join(learnHome(), `ACTIVE.${sanitizeSessionKey(sessionKey)}`);
  }
  // Legacy global pointer — only written alongside the per-session one for
  // older MDScripts that still read ACTIVE with no session key.
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
  const key = pass.session_key || sessionKeyFor(
    (pass.dialect as HookDialect) || "cursor",
    pass.conversation_id,
  );
  if (key) {
    writeFileSync(learnActivePath(key), path + "\n", "utf8");
  }
  // Keep legacy ACTIVE for MDScripts that have not migrated yet, but only
  // when we have a real session key (never write unscoped ACTIVE).
  if (key) {
    writeFileSync(learnActivePath(), path + "\n", "utf8");
  }
}

export function clearLearnPass(
  conversationIdOrSessionKey: string,
  root = process.cwd(),
  dialect?: HookDialect,
): void {
  const sessionKey =
    conversationIdOrSessionKey.includes(":")
      ? conversationIdOrSessionKey
      : dialect
        ? sessionKeyFor(dialect, conversationIdOrSessionKey)
        : conversationIdOrSessionKey;
  if (!sessionKey || sessionKey === "unscoped" || sessionKey.endsWith(":")) {
    return;
  }
  const path = learnPassPath(root, sessionKey);
  const conversationId = conversationIdOrSessionKey.includes(":")
    ? conversationIdOrSessionKey.split(":").slice(1).join(":")
    : conversationIdOrSessionKey;
  writeLearnPass(path, {
    conversation_id: conversationId || sessionKey,
    dialect,
    session_key: sessionKey,
    loop_count: 0,
    status: "required",
    required_at: new Date().toISOString(),
  });
}

/** Per-session marker: next Stop may run learn for this session only. */
export function userTurnPath(sessionKey: string): string {
  const id = sanitizeSessionKey(sessionKey);
  return join(learnHome(), "user-turn", `${id}.json`);
}

export function markUserTurn(
  conversationId: string,
  dialect: HookDialect = "cursor",
): void {
  const sessionKey = sessionKeyFor(dialect, conversationId);
  if (!sessionKey) return;
  const p = userTurnPath(sessionKey);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(
    p,
    JSON.stringify(
      {
        conversation_id: conversationId,
        dialect,
        session_key: sessionKey,
        at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  // Remove legacy global USER_TURN so old hooks cannot bleed across sessions.
  try {
    const legacy = join(learnHome(), "USER_TURN");
    if (existsSync(legacy)) unlinkSync(legacy);
  } catch {
    // ignore
  }
}

/**
 * True only when a user-originated turn is pending for this exact session.
 * Empty / unknown session ids never match.
 */
export function hasUserTurn(
  conversationId: string,
  dialect: HookDialect = "cursor",
): boolean {
  const sessionKey = sessionKeyFor(dialect, conversationId);
  if (!sessionKey) return false;

  const p = userTurnPath(sessionKey);
  if (existsSync(p)) {
    try {
      const raw = JSON.parse(readFileSync(p, "utf8")) as {
        conversation_id?: string;
        session_key?: string;
      };
      if (raw.session_key && raw.session_key === sessionKey) return true;
      if (raw.conversation_id && raw.conversation_id === conversationId) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Legacy single-file USER_TURN: only honor exact conversation_id match.
  const legacy = join(learnHome(), "USER_TURN");
  if (!existsSync(legacy)) return false;
  try {
    const text = readFileSync(legacy, "utf8").trim();
    if (!text || text === "{}") return false;
    const raw = JSON.parse(text) as {
      conversation_id?: string;
      session_key?: string;
    };
    if (raw.session_key && raw.session_key === sessionKey) return true;
    if (
      raw.conversation_id &&
      raw.conversation_id !== "unknown" &&
      raw.conversation_id === conversationId
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function clearUserTurn(
  conversationId: string,
  dialect: HookDialect = "cursor",
): void {
  const sessionKey = sessionKeyFor(dialect, conversationId);
  if (sessionKey) {
    const p = userTurnPath(sessionKey);
    try {
      if (existsSync(p)) unlinkSync(p);
    } catch {
      // ignore
    }
  }
  // Never leave a global USER_TURN that another session can inherit.
  try {
    const legacy = join(learnHome(), "USER_TURN");
    if (existsSync(legacy)) unlinkSync(legacy);
  } catch {
    // ignore
  }
}

export function resolveLearnMdscriptPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const sibling = join(here, "..", "workflows", "self-learn.mdscript.md");
  if (existsSync(sibling)) {
    try {
      return realpathSync(sibling);
    } catch {
      return sibling;
    }
  }
  const candidates = [
    join(homedir(), ".agents", "skills", "self-common", "workflows", "self-learn.mdscript.md"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return sibling;
}

/** Stop-hook followup: single mdscript-exec clause only. */
export function formatLearnFollowup(learnMdscript: string): string {
  return [
    "Stop-hook required action before ending this turn:",
    `Run exactly: /mdscript-exec ${learnMdscript}#reflect-and-learn`,
    "Scan only direct user corrections from this turn. If none, stamp nothing-to-learn and stop.",
  ].join("\n");
}
