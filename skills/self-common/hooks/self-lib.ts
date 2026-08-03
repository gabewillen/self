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
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
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

/** Roll back a claim when durable followup generation fails after claiming. */
export function releaseStopEventClaim(hookName: string, input: HookInput): void {
  if (!input.sessionKey || !input.turnId) return;
  const markerKey = (value: string): string =>
    createHash("sha256").update(value, "utf8").digest("hex");
  const markerDirectory = stopEventMarkerPath(hookName, input);
  const marker = join(markerDirectory, `${markerKey(input.turnId)}.json`);
  try {
    unlinkSync(marker);
  } catch {
    // Rollback is best effort; the stale-claim TTL remains the recovery path.
  }
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
  // Claude Code Stop payloads overlap Codex on session_id, permission_mode,
  // and hook_event_name. transcript_path/Claude version are authoritative
  // Claude-only fields and must win before the generic Codex branch.
  if (
    raw.transcript_path !== undefined ||
    raw.claude_code_version !== undefined ||
    raw.claudeCodeVersion !== undefined
  ) {
    return "claude";
  }
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
  const raw = sessionKey || "unscoped";
  // Hash the full identity so long prefix-sharing keys never collide on disk.
  // Keep a short readable prefix for local debugging only.
  const digest = createHash("sha256").update(raw, "utf8").digest("hex");
  const readable = raw
    .replace(/[^a-zA-Z0-9._:-]+/g, "_")
    .slice(0, 48);
  return `${readable}.${digest}`;
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
      firstString(
        raw.generation_id,
        raw.turn_id,
        raw.turnId,
        // Claude Stop has no turn_id. The assistant message is stable for the
        // completed generation and provides a collision-safe fallback.
        raw.last_assistant_message,
        raw.lastAssistantMessage,
      ) || undefined,
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

/** True only for the current claim when marker storage was unavailable. */
export function stopEventClaimFailed(): boolean {
  return stopEventClaimFailure;
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

const STOP_EVENT_RETENTION = 128;
const STOP_EVENT_GLOBAL_RETENTION = 512;
const STOP_EVENT_CLAIM_TTL_MS = 5 * 60 * 1000;
const STOP_EVENT_CLEANUP_LOCK_TTL_MS = 60 * 1000;
const LEARN_IN_FLIGHT_TTL_MS = 5 * 60 * 1000;
let stopEventClaimFailure = false;

/**
 * Collision-safe marker directory for the complete hook/session identity.
 * Hashing the full values avoids truncation collisions while keeping path
 * components below filesystem limits.
 */
export function stopEventMarkerPath(hookName: string, input: HookInput): string {
  const markerKey = (value: string): string =>
    createHash("sha256").update(value, "utf8").digest("hex");
  return join(
    learnHome(),
    "stop-events",
    markerKey(hookName),
    markerKey(input.sessionKey),
  );
}

/**
 * Retain only the newest bounded set for one hook/session directory. A
 * lockfile serializes cleanup workers without participating in claims; claim
 * creation remains atomic and never waits on cleanup.
 */
function cleanupStopEventMarkers(directory: string): void {
  const lock = join(directory, ".cleanup.lock");
  let lockFd: number | undefined;
  try {
    try {
      lockFd = openSync(lock, "wx");
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined;
      if (code !== "EEXIST") throw error;
      try {
        if (Date.now() - statSync(lock).mtimeMs > STOP_EVENT_CLEANUP_LOCK_TTL_MS) {
          unlinkSync(lock);
          lockFd = openSync(lock, "wx");
        } else {
          return;
        }
      } catch {
        return;
      }
    }
    const files = readdirSync(directory)
      .filter((name) => name.endsWith(".json"))
      .map((name) => {
        const path = join(directory, name);
        try {
          return { path, mtimeMs: statSync(path).mtimeMs };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is { path: string; mtimeMs: number } => entry !== null)
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const entry of files.slice(STOP_EVENT_RETENTION)) {
      try {
        unlinkSync(entry.path);
      } catch {
        // A concurrent process may have removed it; retention is best effort.
      }
    }
  } catch {
    // Cleanup must never turn a successful atomic claim into a failed claim.
  } finally {
    if (lockFd !== undefined) {
      try {
        closeSync(lockFd);
      } catch {
        // ignore
      }
      try {
        unlinkSync(lock);
      } catch {
        // ignore
      }
    }
  }
}

/** Bound the aggregate marker tree so abandoned sessions cannot grow it forever. */
function cleanupGlobalStopEventMarkers(): void {
  const root = join(learnHome(), "stop-events");
  const lock = join(root, ".global-cleanup.lock");
  let lockFd: number | undefined;
  try {
    if (!existsSync(root)) return;
    try {
      lockFd = openSync(lock, "wx");
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined;
      if (code !== "EEXIST") return;
      try {
        if (Date.now() - statSync(lock).mtimeMs > STOP_EVENT_CLEANUP_LOCK_TTL_MS) {
          unlinkSync(lock);
          lockFd = openSync(lock, "wx");
        } else {
          return;
        }
      } catch {
        return;
      }
    }
const markers: Array<{ path: string; mtimeMs: number }> = [];
    // Layout is stop-events/<hookHash>/<sessionHash>/<turn>.json — walk both
    // levels so abandoned sessions still count against the global bound.
    for (const namespace of readdirSync(root)) {
      if (namespace.startsWith(".")) continue;
      const hookDirectory = join(root, namespace);
      let sessionNames: string[];
      try {
        sessionNames = readdirSync(hookDirectory);
      } catch {
        continue;
      }
      for (const sessionName of sessionNames) {
        if (sessionName.startsWith(".")) continue;
        const sessionDirectory = join(hookDirectory, sessionName);
        let markerNames: string[];
        try {
          // A flat .json at the hook level is accepted for older layouts.
          if (sessionName.endsWith(".json")) {
            markers.push({
              path: sessionDirectory,
              mtimeMs: statSync(sessionDirectory).mtimeMs,
            });
            continue;
          }
          markerNames = readdirSync(sessionDirectory);
        } catch {
          continue;
        }
        for (const markerName of markerNames) {
          if (!markerName.endsWith(".json")) continue;
          const path = join(sessionDirectory, markerName);
          try {
            markers.push({ path, mtimeMs: statSync(path).mtimeMs });
          } catch {
            // concurrent removal
          }
        }
      }
    }
    markers.sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const marker of markers.slice(STOP_EVENT_GLOBAL_RETENTION)) {
      try {
        unlinkSync(marker.path);
      } catch {
        // best effort
      }
    }
  } catch {
    // Cleanup must never turn a successful atomic claim into a failed claim.
  } finally {
    if (lockFd !== undefined) {
      try {
        closeSync(lockFd);
      } catch {
        // ignore
      }
      try {
        unlinkSync(lock);
      } catch {
        // ignore
      }
    }
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

/** Whether this completed Stop has an armed learn pass that must run first. */
export function learnPassRequiredForStop(input: HookInput): boolean {
  if (
    shouldSkipLearnHooks() ||
    input.stopHookActive ||
    input.status !== "completed" ||
    !input.conversationId ||
    !input.sessionKey
  ) {
    return false;
  }
  const pass = loadLearnPass(learnPassPath(input.root, input.sessionKey));
  if (pass && pass.status === "satisfied") {
    return false;
  }
  if (pass?.status === "in_flight" || pass?.followup_injected_at) {
    const injectedAt = Date.parse(pass.followup_injected_at || "");
    if (
      Number.isFinite(injectedAt) &&
      Date.now() - injectedAt < LEARN_IN_FLIGHT_TTL_MS
    ) {
      return false;
    }
  }
  return hasUserTurn(input.conversationId, input.dialect);
}
/**
 * Claim one Stop event for a hook and harness turn.
 *
 * Cursor's generation_id and Codex's turn_id identify the assistant turn that
 * is ending. A Stop hook may be delivered more than once while that turn is
 * waiting on internal work; an atomic per-turn marker prevents duplicate
 * followups without suppressing a later turn (including an intentional goal
 * continuation). Harnesses without a turn id retain their existing behavior
 * and rely on stop_hook_active where available.
 */
export function claimStopEvent(hookName: string, input: HookInput): boolean {
  stopEventClaimFailure = false;
  if (!input.sessionKey || !input.turnId) return true;
  const markerKey = (value: string): string =>
    createHash("sha256").update(value, "utf8").digest("hex");
  const markerDirectory = stopEventMarkerPath(hookName, input);
  const marker = join(
    markerDirectory,
    `${markerKey(input.turnId)}.json`,
  );

  try {
    mkdirSync(dirname(marker), { recursive: true });
  } catch {
    stopEventClaimFailure = true;
    return false;
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let fd: number | undefined;
    let created = false;
    try {
      // wx is the important part: concurrent Stop processes cannot both claim
      // the same session/turn marker.
      fd = openSync(marker, "wx");
      created = true;
      writeFileSync(
        fd,
        JSON.stringify({
          dialect: input.dialect,
          session_key: input.sessionKey,
          turn_id: input.turnId,
          claimed_at: new Date().toISOString(),
        }) + "\n",
        "utf8",
      );
      cleanupStopEventMarkers(markerDirectory);
      cleanupGlobalStopEventMarkers();
      return true;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined;
      if (code === "EEXIST") {
        // A process can die after claiming but before durable followup
        // injection. Reclaim only an old marker; fresh markers remain deduped.
        try {
          if (
            attempt === 0 &&
            Date.now() - statSync(marker).mtimeMs > STOP_EVENT_CLAIM_TTL_MS
          ) {
            unlinkSync(marker);
            continue;
          }
        } catch {
          // An unavailable marker is fail-closed and must not silently allow
          // the turn to end without its required followup.
          stopEventClaimFailure = true;
        }
        return false;
      }
      // Fail closed: no marker filesystem error may authorize a followup.
      stopEventClaimFailure = true;
      if (created) {
        try {
          unlinkSync(marker);
        } catch {
          // Preserve the failed claim; stale-marker recovery handles crashes.
        }
      }
      return false;
    } finally {
      if (fd !== undefined) {
        try {
          closeSync(fd);
        } catch {
          // ignore close errors after the claim has been made
        }
      }
    }
  }
  return false;
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

/** Stop-hook followup: multi-line instruction that includes the exact mdscript-exec clause. */
export function formatLearnFollowup(
  learnMdscript: string,
  sessionKey?: string,
): string {
  return [
    "Stop-hook required action before ending this turn:",
    `Run exactly: /mdscript-exec ${learnMdscript}#reflect-and-learn`,
    ...(sessionKey ? [`Use learn state for session: ${sessionKey}`] : []),
    "Scan only direct user corrections from this turn. If none, stamp nothing-to-learn and stop.",
  ].join("\n");
}
