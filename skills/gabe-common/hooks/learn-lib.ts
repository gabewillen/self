/**
 * Minimal stop-hook helpers for /gabe-learn (MDScript only — not a skill).
 * Keep this small; do not import gabe-goal's large goal-lib.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { execFileSync } from "node:child_process";
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

function mainRepoRoot(root: string): string {
  for (const argv of [
    ["-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"],
    ["-C", root, "rev-parse", "--git-common-dir"],
  ] as string[][]) {
    try {
      const out = execFileSync("git", argv, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (out) return dirname(resolvePath(root, out));
    } catch {
      // not a git repo
    }
  }
  return resolvePath(root);
}

function projectSlug(root: string): string {
  const base = mainRepoRoot(root).split(/[/\\]/).filter(Boolean).pop() || "workspace";
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "workspace"
  );
}

export function agentProjectHome(root: string): string {
  if (process.env.GABE_AGENTS_LOCAL === "1") {
    return join(root, ".agents");
  }
  const home = process.env.AGENTS_HOME
    ? resolvePath(process.env.AGENTS_HOME)
    : join(homedir(), ".agents");
  return join(home, "projects", projectSlug(root));
}

export function learnPassPath(root: string, conversationId: string): string {
  const id = (conversationId || "unknown").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return join(agentProjectHome(root), "learn", `${id}.json`);
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
}

/** Resolve the installed gabe-learn MDScript (not a skill). */
export function resolveLearnMdscriptPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // hooks/ -> gabe-common/ -> workflows/gabe-learn.mdscript.md
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

export function formatLearnFollowup(learnMdscript: string): string {
  return `/mdscript-exec ${learnMdscript}#reflect-and-learn`;
}
