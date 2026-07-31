/**
 * Cursor/macOS helpers for self-watch wake paths.
 * Pending-tick scan is used by Stop hooks so a dead listener can still resume
 * — but only in the conversation that armed the watch (owner_conversation_id).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import { homedir } from "node:os";

export interface PendingWatch {
  watchMdscript: string;
  prNumber: string;
  resumeCommand: string;
  newestSeq: number;
  lastProcessedSeq: number;
  tickSpool: string;
  /** Chat/session that armed this watch (empty = unscoped legacy). */
  ownerConversationId: string;
  ownerDialect: string;
}

function agentsHome(): string {
  if (process.env.AGENTS_HOME) return resolvePath(process.env.AGENTS_HOME);
  return join(homedir(), ".agents");
}

function parseFrontMatter(text: string): Record<string, string> {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---")) return {};
  const end = normalized.indexOf("\n---", 3);
  if (end < 0) return {};
  const block = normalized.slice(4, end);
  const out: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line.trimEnd());
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function newestTickSeq(spool: string): number {
  if (!existsSync(spool)) return 0;
  let newest = 0;
  try {
    const body = readFileSync(spool, "utf8");
    for (const line of body.split("\n")) {
      if (!line.includes('"event":"tick"') && !line.includes('"event": "tick"')) {
        continue;
      }
      const jsonStart = line.indexOf("{");
      if (jsonStart < 0) continue;
      try {
        const rec = JSON.parse(line.slice(jsonStart)) as { seq?: number };
        if (typeof rec.seq === "number" && rec.seq > newest) newest = rec.seq;
      } catch {
        // ignore bad lines
      }
    }
  } catch {
    return 0;
  }
  return newest;
}

/** List active self-watch MDScripts that have unprocessed ticks. */
export function listPendingWatches(): PendingWatch[] {
  const projectsRoot = join(agentsHome(), "projects");
  if (!existsSync(projectsRoot)) return [];

  const pending: PendingWatch[] = [];
  let projects: string[] = [];
  try {
    projects = readdirSync(projectsRoot);
  } catch {
    return [];
  }

  for (const project of projects) {
    const goalsDir = join(projectsRoot, project, "goals");
    if (!existsSync(goalsDir)) continue;
    let files: string[] = [];
    try {
      files = readdirSync(goalsDir).filter((f) =>
        /^self-watch-.*\.mdscript\.md$/.test(f),
      );
    } catch {
      continue;
    }
    for (const file of files) {
      const path = join(goalsDir, file);
      let text = "";
      try {
        text = readFileSync(path, "utf8");
      } catch {
        continue;
      }
      const fm = parseFrontMatter(text);
      if (fm.watch_active !== "true" && fm.watch_active !== "True") continue;
      const spool = fm.tick_spool || "";
      if (!spool || !existsSync(spool)) continue;
      const lastProcessed = Number(fm.last_processed_seq || "0") || 0;
      const newest = newestTickSeq(spool);
      if (newest <= lastProcessed) continue;
      pending.push({
        watchMdscript: path,
        prNumber: fm.pr_number || file.replace(/^self-watch-|\.mdscript\.md$/g, ""),
        resumeCommand: `/mdscript-exec ${path}#resume-watch`,
        newestSeq: newest,
        lastProcessedSeq: lastProcessed,
        tickSpool: spool,
        ownerConversationId: firstNonEmpty(
          fm.owner_conversation_id,
          fm.conversation_id,
          fm.session_id,
        ),
        ownerDialect: firstNonEmpty(fm.owner_dialect, fm.dialect),
      });
    }
  }
  return pending;
}

function firstNonEmpty(...values: string[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * Pending watches that may inject a Stop followup into *this* session.
 *
 * Rules:
 * - Watch with owner_conversation_id matching this conversation → yes
 * - Watch with no owner (legacy) → never auto-inject (avoids wrong-chat resume);
 *   sessionStart still surfaces them as additional context
 */
export function listPendingWatchesForSession(
  conversationId: string,
  dialect?: string,
): PendingWatch[] {
  const id = (conversationId || "").trim();
  if (!id || id === "unknown") return [];
  return listPendingWatches().filter((w) => {
    if (!w.ownerConversationId) return false;
    if (w.ownerConversationId !== id) return false;
    if (
      dialect &&
      w.ownerDialect &&
      w.ownerDialect !== dialect &&
      w.ownerDialect !== "any"
    ) {
      return false;
    }
    return true;
  });
}

export function formatPendingWatchFollowup(watches: PendingWatch[]): string {
  return watches[0]?.resumeCommand || "";
}

export function formatActiveWatchSessionContext(): string {
  const projectsRoot = join(agentsHome(), "projects");
  if (!existsSync(projectsRoot)) return "";
  const active: string[] = [];
  const pending = listPendingWatches();
  try {
    for (const project of readdirSync(projectsRoot)) {
      const goalsDir = join(projectsRoot, project, "goals");
      if (!existsSync(goalsDir)) continue;
      for (const file of readdirSync(goalsDir)) {
        if (!/^self-watch-.*\.mdscript\.md$/.test(file)) continue;
        const path = join(goalsDir, file);
        const fm = parseFrontMatter(readFileSync(path, "utf8"));
        if (fm.watch_active !== "true") continue;
        active.push(
          `- PR ${fm.pr_number || "?"} ${fm.pr_url || ""} → mdscript-exec ${path}#resume-watch`,
        );
      }
    }
  } catch {
    return "";
  }
  if (!active.length && !pending.length) return "";
  const parts = [
    "Active self-watch loops (Cursor): the detached ticker may still be writing ticks while the chat listener is dead.",
    "On any turn that can work, re-attach `tail -n0 -F <tick_spool>` with notify_on_output on the sentinel, or run resume-watch.",
  ];
  if (active.length) {
    parts.push("Active watches:");
    parts.push(...active);
  }
  if (pending.length) {
    parts.push("Pending unprocessed ticks:");
    for (const w of pending) {
      parts.push(
        `- PR ${w.prNumber}: seq ${w.newestSeq} (last processed ${w.lastProcessedSeq}) → ${w.resumeCommand}`,
      );
    }
  }
  return parts.join("\n");
}

