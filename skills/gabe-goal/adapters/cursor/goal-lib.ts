import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export interface GoalState {
  active: boolean;
  goal: string;
  conversation_id: string;
  started_at?: string;
  ended_at?: string;
  run_id?: string;
  /** tui = terminal captures; ui = visual images; default = logs sufficient */
  proof_kind?: ProofKind;
  /**
   * When required (default for tui/ui and runtime default goals), manifest must include
   * at least one live-tier artifact that exercises the primary user/runtime path.
   */
  live_proof?: "required" | "optional";
  /** End-to-end user/runtime path required when live proof is on. */
  primary_user_action?: string;
  /** Durable MDScript tracking file for this run (relative or absolute). */
  goal_mdscript?: string;
  /** Heading slug the stop hook / resume should enter next. */
  resume_heading?: string;
  /** Last stop-hook iteration written into the run MDScript. */
  iteration?: number;
}

export type ProofKind = "tui" | "ui" | "default";
export type ProofTier = "unit" | "integration" | "live";

export type GoalReviewerId = "a" | "b" | "c" | "rules" | "security" | "completeness";

export interface GoalPFinding {
  severity?: string;
  location?: string;
  summary?: string;
  contract?: string;
  remediation?: string;
  [key: string]: unknown;
}

export interface GoalSignoff {
  goal: string;
  conversation_id: string;
  signed_off: boolean;
  reviewer_id?: GoalReviewerId;
  verifier_summary?: string;
  signed_off_at?: string;
  evidence?: string[];
  commands_run?: string[];
  /** Documented attempts to prove the change broken or AGENTS.md-violating. */
  attack_attempts?: string[];
  /** All P0–P3 findings; must be empty for a valid signed-off review. */
  p_findings?: Array<string | GoalPFinding>;
  rules_reviewed?: string[];
  artifact_paths?: string[];
  objectives_checked?: string[];
  remaining_gaps?: string[];
}

export interface GoalArtifactEntry {
  path: string;
  kind: "log" | "screenshot" | "capture" | "image" | "recording" | "output" | "other";
  reproduce: string;
  proves: string;
  /** unit = isolated tests; integration = multi-component without full stack; live = real stack / user path */
  tier?: ProofTier;
}

export interface GoalArtifactsManifest {
  goal: string;
  conversation_id: string;
  /** The primary user-visible or runtime action this goal must prove (e.g. "send @mention message in TUI"). */
  primary_user_action?: string;
  artifacts: GoalArtifactEntry[];
  updated_at: string;
}

export interface GoalSessionMeta {
  conversation_id: string;
  session_dir: string;
  workspace_root: string;
  last_active_at: string;
}

export interface GoalSessionPaths {
  directory: string;
  runDirectory: string;
  runId: string | null;
  meta: string;
  activeRun: string;
  sessionLog: string;
  runsDirectory: string;
  goal: string;
  /** Executable MDScript run tracker — stop hook resumes here. */
  goalMdscript: string;
  reviewVerdict: string;
  reviewPacket: string;
  signoff: string;
  signoffReviewerA: string;
  signoffReviewerB: string;
  signoffReviewerC: string;
  signoffReviewerRules: string;
  signoffReviewerSecurity: string;
  signoffReviewerCompleteness: string;
  signoffReviewerRulesMdscript: string;
  signoffReviewerSecurityMdscript: string;
  signoffReviewerCompletenessMdscript: string;
  reviewVerdictMdscript: string;
  artifacts: string;
  artifactsManifest: string;
  progressLog: string;
  progress: string;
  legacy: boolean;
  flatLayout: boolean;
}

export interface ActiveRunPointer {
  run_id: string;
  conversation_id: string;
  started_at: string;
  /** Relative path to the authoritative run MDScript tracker. */
  goal_mdscript?: string;
  active?: boolean;
}

export interface GoalCompletionStatus {
  complete: boolean;
  reasons: string[];
}

/** Durable completion record produced by composing gabe-review. */
export interface GoalReviewVerdict {
  goal: string;
  conversation_id: string;
  run_id?: string;
  reviewer_skill?: string;
  proof_scope?: string;
  grade?: string;
  proof_decision?: string;
  blocking_severities?: string;
  blocking_findings?: Array<string | GoalPFinding>;
  residual_findings?: Array<string | GoalPFinding>;
  proof_supplied?: string[];
  proof_not_claimed?: string[];
  artifact_paths?: string[];
  commands_run?: string[];
  review_round?: number;
  reviewed_at?: string;
  triple_blind?: boolean;
  lanes?: string[];
  signoff_paths?: string[];
}

export const MIN_SUMMARY_LENGTH = 40;
/** Legacy pre-rename lanes. Kept for read fallback and cleanup only. */
export const SIGNOFF_REVIEWER_A_FILE = "signoff-reviewer-a.json";
export const SIGNOFF_REVIEWER_B_FILE = "signoff-reviewer-b.json";
export const SIGNOFF_REVIEWER_C_FILE = "signoff-reviewer-c.json";
/** Current lanes. Sign-offs and verdicts are re-enterable MDScript. */
export const SIGNOFF_RULES_MDSCRIPT = "signoff-reviewer-rules.mdscript.md";
export const SIGNOFF_SECURITY_MDSCRIPT = "signoff-reviewer-security.mdscript.md";
export const SIGNOFF_COMPLETENESS_MDSCRIPT = "signoff-reviewer-completeness.mdscript.md";
export const REVIEW_VERDICT_MDSCRIPT = "review-verdict.mdscript.md";
export const REVIEWER_MODEL_SLUG = "composer-2.5-fast";
export const ARTIFACTS_MANIFEST_FILE = "manifest.json";
export const ACTIVE_RUN_FILE = "active-run.json";
export const SESSION_LOG_FILE = "session-log.jsonl";
export const PROGRESS_LOG_FILE = "progress.jsonl";
export const GOAL_MDSCRIPT_FILE = "goal.mdscript.md";
/** Legacy read-only fallback; never written for new runs. */
export const REVIEW_VERDICT_FILE = "review-verdict.json";
export const REVIEW_PACKET_FILE = "review-packet.md";
export const RUNS_DIR_NAME = "runs";
export const DEFAULT_RESUME_HEADING = "pursue-goal";
export const MDSCRIPT_EXEC_HEADER =
  "<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->";
export const PROJECT_GOAL_LOG_PATH = ".cursor/goal/goal-log.jsonl";
export const LEGACY_GOAL_PATH = ".cursor/goal.json";
export const LEGACY_SIGNOFF_PATH = ".cursor/goal-signoff.json";
export const LEGACY_PROGRESS_PATH = ".cursor/goal-progress.md";
export const SESSIONS_DIR = ".cursor/goal/sessions";

/** @deprecated Use SESSIONS_DIR. Kept for active sessions started under grind. */
export const LEGACY_GRIND_SESSIONS_DIR = ".cursor/grind/sessions";
/** @deprecated Kept for active sessions started under grind. */
export const LEGACY_GRIND_PATH = ".cursor/grind.json";
/** @deprecated Kept for active sessions started under grind. */
export const LEGACY_GRIND_SIGNOFF_PATH = ".cursor/grind-signoff.json";
/** @deprecated Kept for active sessions started under grind. */
export const LEGACY_GRIND_PROGRESS_PATH = ".cursor/grind-progress.md";

export function safeSessionId(conversationId: string): string {
  const sanitized = conversationId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return sanitized.slice(0, 128) || "unknown";
}

export function sessionDirectory(root: string, conversationId: string): string {
  return join(root, SESSIONS_DIR, safeSessionId(conversationId));
}

function extendRunPaths(
  sessionDirectoryPath: string,
  runDirectoryPath: string,
  runId: string | null,
  goalFile: string,
  legacy: boolean,
  flatLayout: boolean,
): GoalSessionPaths {
  const artifactsDirectory = join(runDirectoryPath, "artifacts");
  return {
    directory: sessionDirectoryPath,
    runDirectory: runDirectoryPath,
    runId,
    meta: join(sessionDirectoryPath, "session.json"),
    activeRun: join(sessionDirectoryPath, ACTIVE_RUN_FILE),
    sessionLog: join(sessionDirectoryPath, SESSION_LOG_FILE),
    runsDirectory: join(sessionDirectoryPath, RUNS_DIR_NAME),
    goal: goalFile,
    goalMdscript: join(runDirectoryPath, GOAL_MDSCRIPT_FILE),
    reviewVerdict: join(runDirectoryPath, REVIEW_VERDICT_FILE),
    reviewPacket: join(runDirectoryPath, REVIEW_PACKET_FILE),
    signoff: join(runDirectoryPath, "signoff.json"),
    signoffReviewerA: join(runDirectoryPath, SIGNOFF_REVIEWER_A_FILE),
    signoffReviewerB: join(runDirectoryPath, SIGNOFF_REVIEWER_B_FILE),
    signoffReviewerC: join(runDirectoryPath, SIGNOFF_REVIEWER_C_FILE),
    signoffReviewerRules: join(runDirectoryPath, "signoff-reviewer-rules.json"),
    signoffReviewerSecurity: join(runDirectoryPath, "signoff-reviewer-security.json"),
    signoffReviewerCompleteness: join(runDirectoryPath, "signoff-reviewer-completeness.json"),
    signoffReviewerRulesMdscript: join(runDirectoryPath, SIGNOFF_RULES_MDSCRIPT),
    signoffReviewerSecurityMdscript: join(runDirectoryPath, SIGNOFF_SECURITY_MDSCRIPT),
    signoffReviewerCompletenessMdscript: join(runDirectoryPath, SIGNOFF_COMPLETENESS_MDSCRIPT),
    reviewVerdictMdscript: join(runDirectoryPath, REVIEW_VERDICT_MDSCRIPT),
    artifacts: artifactsDirectory,
    artifactsManifest: join(artifactsDirectory, ARTIFACTS_MANIFEST_FILE),
    progressLog: join(runDirectoryPath, PROGRESS_LOG_FILE),
    progress: join(runDirectoryPath, "progress.md"),
    legacy,
    flatLayout,
  };
}

function extendSessionPaths(directory: string, goalFile: string, legacy: boolean): GoalSessionPaths {
  return extendRunPaths(directory, directory, null, goalFile, legacy, true);
}

export function newRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function appendJsonLine(path: string, entry: Record<string, unknown>): void {
  mkdirSync(join(path, ".."), { recursive: true });
  appendFileSync(path, `${JSON.stringify(entry)}\n`, "utf-8");
}

export function recordGoalEvent(
  root: string,
  conversationId: string,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  const recordedAt = new Date().toISOString();
  const entry = {
    event,
    conversation_id: conversationId,
    recorded_at: recordedAt,
    ...payload,
  };

  const sessionRoot = sessionDirectory(root, conversationId);
  mkdirSync(sessionRoot, { recursive: true });
  appendJsonLine(join(sessionRoot, SESSION_LOG_FILE), entry);

  const projectLogDirectory = join(root, ".cursor", "goal");
  mkdirSync(projectLogDirectory, { recursive: true });
  appendJsonLine(join(root, PROJECT_GOAL_LOG_PATH), entry);
}

export function appendProgressLog(
  paths: GoalSessionPaths,
  entry: Record<string, unknown>,
): void {
  appendJsonLine(paths.progressLog, {
    recorded_at: new Date().toISOString(),
    run_id: paths.runId,
    ...entry,
  });
}

function buildRunPaths(
  sessionRoot: string,
  runId: string,
  legacy: boolean,
): GoalSessionPaths {
  const runDirectory = join(sessionRoot, RUNS_DIR_NAME, runId);
  return extendRunPaths(
    sessionRoot,
    runDirectory,
    runId,
    join(runDirectory, "goal.json"),
    legacy,
    false,
  );
}

function ensureRunArtifactDirectories(paths: GoalSessionPaths): void {
  mkdirSync(join(paths.artifacts, "logs"), { recursive: true });
  mkdirSync(join(paths.artifacts, "screenshots"), { recursive: true });
  mkdirSync(join(paths.artifacts, "captures"), { recursive: true });
  mkdirSync(join(paths.artifacts, "images"), { recursive: true });
  mkdirSync(join(paths.artifacts, "live"), { recursive: true });
}

export function sessionPaths(root: string, conversationId: string): GoalSessionPaths {
  return extendSessionPaths(
    sessionDirectory(root, conversationId),
    join(sessionDirectory(root, conversationId), "goal.json"),
    false,
  );
}

function legacyGrindSessionPaths(
  root: string,
  conversationId: string,
): GoalSessionPaths {
  const directory = join(root, LEGACY_GRIND_SESSIONS_DIR, safeSessionId(conversationId));
  return extendSessionPaths(directory, join(directory, "grind.json"), true);
}

function legacyRootPaths(root: string, kind: "goal" | "grind"): GoalSessionPaths {
  const isGrind = kind === "grind";
  const directory = join(root, ".cursor");
  return extendSessionPaths(
    directory,
    join(root, isGrind ? LEGACY_GRIND_PATH : LEGACY_GOAL_PATH),
    true,
  );
}

export function usesStrictGoalCompletion(paths: GoalSessionPaths): boolean {
  // New runs use goal.mdscript.md. Legacy goal.json runs stay strict.
  // Grind single-verifier sessions use grind.json / legacy=true and stay non-strict.
  if (existsSync(paths.goalMdscript)) {
    return true;
  }
  return paths.goal.endsWith("goal.json");
}

/**
 * Read a record that is authored as re-enterable MDScript: YAML front matter is
 * the state, the body carries the states an agent resumes from. Falls back to
 * the pre-cutover JSON file so old runs keep evaluating.
 */
export function loadMdscriptRecord<T>(
  mdscriptPath: string,
  legacyJsonPath: string,
): T | null {
  if (existsSync(mdscriptPath)) {
    try {
      const fm = parseMdscriptFrontMatter(readFileSync(mdscriptPath, "utf-8"));
      if (fm) {
        return fm as T;
      }
    } catch {
      // Fall through to legacy JSON.
    }
  }
  return loadJson<T>(legacyJsonPath);
}

export function loadJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

function parseYamlScalar(raw: string): string | number | boolean | null {
  const value = raw.trim();
  if (value === "" || value === "null" || value === "~") {
    return null;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      return JSON.parse(value.replace(/^'/, '"').replace(/'$/, '"')) as string;
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Minimal front-matter reader for the scalars/lists emitted by writeGoalMdscript. */
export function parseMdscriptFrontMatter(
  text: string,
): Record<string, unknown> | null {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---")) {
    return null;
  }
  const end = normalized.indexOf("\n---", 3);
  if (end < 0) {
    return null;
  }
  const block = normalized.slice(4, end).replace(/^\n/, "");
  const result: Record<string, unknown> = {};
  const lines = block.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) {
      i += 1;
      continue;
    }
    const match = /^(?: {0,2})([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!match) {
      i += 1;
      continue;
    }
    const key = match[1];
    const rest = match[2];
    if (rest === "|" || rest === ">" || rest === "|-") {
      const collected: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        if (next === "" || next.startsWith("  ") || next.startsWith("\t")) {
          collected.push(next.replace(/^  /, ""));
          i += 1;
          continue;
        }
        break;
      }
      result[key] = collected.join("\n").replace(/\n$/, "");
      continue;
    }
    if (rest === "" || rest === "[]") {
      // Either empty scalar, empty list marker, or a following list/block.
      if (rest === "[]") {
        result[key] = [];
        i += 1;
        continue;
      }
      const listItems: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        const item = /^ {2}-\s+(.*)$/.exec(next);
        if (!item) {
          break;
        }
        listItems.push(String(parseYamlScalar(item[1]) ?? ""));
        j += 1;
      }
      if (listItems.length > 0) {
        result[key] = listItems;
        i = j;
        continue;
      }
      result[key] = "";
      i += 1;
      continue;
    }
    result[key] = parseYamlScalar(rest);
    i += 1;
  }
  return result;
}

export function goalStateFromFrontMatter(
  fm: Record<string, unknown>,
): GoalState | null {
  const goalRaw = fm.goal;
  const goal =
    typeof goalRaw === "string"
      ? goalRaw.trim()
      : goalRaw == null
        ? ""
        : String(goalRaw).trim();
  const conversationId =
    typeof fm.conversation_id === "string" ? fm.conversation_id.trim() : "";
  if (!goal && !conversationId) {
    return null;
  }

  const status = typeof fm.status === "string" ? fm.status : undefined;
  const activeExplicit = fm.active;
  const active =
    typeof activeExplicit === "boolean"
      ? activeExplicit
      : status
        ? status === "active"
        : true;

  const proofKind =
    fm.proof_kind === "tui" || fm.proof_kind === "ui" || fm.proof_kind === "default"
      ? fm.proof_kind
      : undefined;
  const liveProof =
    fm.live_proof === "required" || fm.live_proof === "optional"
      ? fm.live_proof
      : undefined;

  return {
    active,
    goal: goal || "(unspecified goal)",
    conversation_id: conversationId,
    run_id: typeof fm.run_id === "string" ? fm.run_id : undefined,
    started_at: typeof fm.started_at === "string" ? fm.started_at : undefined,
    ended_at: typeof fm.ended_at === "string" ? fm.ended_at : undefined,
    proof_kind: proofKind,
    live_proof: liveProof,
    primary_user_action:
      typeof fm.primary_user_action === "string" ? fm.primary_user_action : undefined,
    goal_mdscript:
      typeof fm.goal_mdscript === "string" ? fm.goal_mdscript : undefined,
    resume_heading:
      typeof fm.resume_heading === "string" ? fm.resume_heading : undefined,
    iteration:
      typeof fm.iteration === "number"
        ? fm.iteration
        : typeof fm.iteration === "string" && /^-?\d+$/.test(fm.iteration)
          ? Number(fm.iteration)
          : undefined,
  };
}

export function loadGoalState(paths: GoalSessionPaths): GoalState | null {
  if (existsSync(paths.goalMdscript)) {
    try {
      const text = readFileSync(paths.goalMdscript, "utf-8");
      const fm = parseMdscriptFrontMatter(text);
      if (fm) {
        const state = goalStateFromFrontMatter(fm);
        if (state) {
          if (!state.goal_mdscript) {
            state.goal_mdscript = paths.goalMdscript;
          }
          if (!state.run_id && paths.runId) {
            state.run_id = paths.runId;
          }
          return state;
        }
      }
    } catch {
      // Fall through to legacy JSON.
    }
  }

  // Legacy read-only fallback for pre-cutover runs / grind.
  return loadJson<GoalState>(paths.goal);
}

export function runStateExists(paths: GoalSessionPaths): boolean {
  return existsSync(paths.goalMdscript) || existsSync(paths.goal);
}

export function ensureSessionDirectory(
  root: string,
  conversationId: string,
): GoalSessionPaths {
  const sessionRoot = sessionDirectory(root, conversationId);
  mkdirSync(sessionRoot, { recursive: true });
  mkdirSync(join(sessionRoot, RUNS_DIR_NAME), { recursive: true });
  mkdirSync(join(root, ".cursor", "goal"), { recursive: true });

  if (!existsSync(join(sessionRoot, SESSION_LOG_FILE))) {
    writeFileSync(join(sessionRoot, SESSION_LOG_FILE), "", "utf-8");
  }
  if (!existsSync(join(root, PROJECT_GOAL_LOG_PATH))) {
    writeFileSync(join(root, PROJECT_GOAL_LOG_PATH), "", "utf-8");
  }

  const meta: GoalSessionMeta = {
    conversation_id: conversationId,
    session_dir: join(SESSIONS_DIR, safeSessionId(conversationId)),
    workspace_root: root,
    last_active_at: new Date().toISOString(),
  };
  writeJson(join(sessionRoot, "session.json"), meta);

  return extendSessionPaths(
    sessionRoot,
    join(sessionRoot, "goal.json"),
    false,
  );
}

export function startGoalRun(
  root: string,
  conversationId: string,
  state: GoalState,
): GoalSessionPaths {
  ensureSessionDirectory(root, conversationId);
  const sessionRoot = sessionDirectory(root, conversationId);

  const priorPaths = resolveActiveGoalPaths(root, conversationId);
  if (priorPaths && runStateExists(priorPaths)) {
    const priorState = loadGoalState(priorPaths);
    // Supersede only a still-active run. Completed runs are left as-is — the next goal is unrelated.
    if (priorState?.active) {
      deactivateGoal(root, priorPaths, priorState);
      recordGoalEvent(root, conversationId, "goal_superseded", {
        run_id: priorPaths.runId,
        goal: priorState.goal,
        reason: "replaced_by_new_goal",
        goal_mdscript: relativePath(root, priorPaths.goalMdscript),
      });
    }
  }

  const runId = newRunId();
  const paths = buildRunPaths(sessionRoot, runId, false);
  mkdirSync(paths.runDirectory, { recursive: true });
  ensureRunArtifactDirectories(paths);

  const startedAt = state.started_at ?? new Date().toISOString();
  const runState: GoalState = {
    ...state,
    conversation_id: conversationId,
    run_id: runId,
    started_at: startedAt,
    active: true,
    resume_heading: normalizeResumeHeading(
      state.resume_heading ?? DEFAULT_RESUME_HEADING,
    ),
    iteration: 0,
  };
  const goalMdscript = writeGoalMdscript(root, paths, runState, {
    iteration: 0,
    resumeHeading: runState.resume_heading,
    status: "active",
  });
  // Never write goal.json for new runs — MDScript front matter is authoritative.
  if (existsSync(paths.goal)) {
    unlinkSync(paths.goal);
  }
  writeJson(paths.activeRun, {
    run_id: runId,
    conversation_id: conversationId,
    started_at: startedAt,
    goal_mdscript: goalMdscript,
    active: true,
  } satisfies ActiveRunPointer);

  recordGoalEvent(root, conversationId, "goal_started", {
    run_id: runId,
    goal: runState.goal,
    proof_kind: resolveProofKind(runState),
    goal_mdscript: goalMdscript,
  });

  return paths;
}

function resolveRunPathsFromSession(
  root: string,
  conversationId: string,
  legacy: boolean,
): GoalSessionPaths | null {
  const sessionRoot = sessionDirectory(root, conversationId);
  if (!existsSync(sessionRoot)) {
    return null;
  }

  const activeRun = loadJson<ActiveRunPointer>(join(sessionRoot, ACTIVE_RUN_FILE));
  if (activeRun?.run_id) {
    const paths = buildRunPaths(sessionRoot, activeRun.run_id, legacy);
    if (runStateExists(paths)) {
      return paths;
    }
  }

  // Prefer MDScript tracker at session root if present.
  const flatMdscript = join(sessionRoot, GOAL_MDSCRIPT_FILE);
  if (existsSync(flatMdscript)) {
    return extendSessionPaths(sessionRoot, join(sessionRoot, "goal.json"), legacy);
  }

  // Legacy pre-cutover flat goal.json.
  const flatGoal = join(sessionRoot, "goal.json");
  if (existsSync(flatGoal)) {
    return extendSessionPaths(sessionRoot, flatGoal, legacy);
  }

  return null;
}

function activeSessionPaths(
  paths: GoalSessionPaths,
  conversationId: string,
): GoalSessionPaths | null {
  const state = loadGoalState(paths);
  if (!state?.active) {
    return null;
  }
  if (state.conversation_id && state.conversation_id !== conversationId) {
    return null;
  }
  return paths;
}

export function resolveActiveGoalPaths(
  root: string,
  conversationId?: string,
): GoalSessionPaths | null {
  if (conversationId) {
    const grindPaths = legacyGrindSessionPaths(root, conversationId);
    const activeGrind = activeSessionPaths(grindPaths, conversationId);
    if (activeGrind) {
      return activeGrind;
    }

    const goalPaths = resolveRunPathsFromSession(root, conversationId, false);
    if (goalPaths) {
      return activeSessionPaths(goalPaths, conversationId);
    }

    return null;
  }

  for (const paths of [
    legacyRootPaths(root, "goal"),
    legacyRootPaths(root, "grind"),
  ]) {
    const state = loadGoalState(paths);
    if (state?.active) {
      return paths;
    }
  }

  return null;
}

function citesAgentsMd(rulesReviewed: string[]): boolean {
  return rulesReviewed.some((item) => {
    const normalized = item.trim().replace(/\\/g, "/").toLowerCase();
    return (
      normalized === "agents.md" ||
      normalized.endsWith("/agents.md") ||
      normalized.includes("agents.md")
    );
  });
}

export function countPFindings(
  pFindings: Array<string | GoalPFinding> | undefined,
): number {
  if (!pFindings) {
    return -1;
  }
  return pFindings.filter((item) => {
    if (typeof item === "string") {
      return item.trim().length > 0;
    }
    if (!item || typeof item !== "object") {
      return false;
    }
    const summary =
      typeof item.summary === "string"
        ? item.summary
        : typeof item.severity === "string"
          ? item.severity
          : "";
    return summary.trim().length > 0 || Object.keys(item).length > 0;
  }).length;
}

export function isValidSignoff(
  signoff: GoalSignoff,
  goal: string,
  conversationId: string,
  expectedReviewerId?: GoalReviewerId,
  root?: string,
): boolean {
  if (!signoff.signed_off) {
    return false;
  }
  if (signoff.goal.trim() !== goal.trim()) {
    return false;
  }
  if (signoff.conversation_id.trim() !== conversationId.trim()) {
    return false;
  }
  if (expectedReviewerId && signoff.reviewer_id !== expectedReviewerId) {
    return false;
  }

  const summary = signoff.verifier_summary?.trim() ?? "";
  if (summary.length < MIN_SUMMARY_LENGTH) {
    return false;
  }

  const evidence = signoff.evidence?.filter((item) => item.trim().length > 0) ?? [];
  if (evidence.length < 2) {
    return false;
  }

  const commandsRun =
    signoff.commands_run?.filter((item) => item.trim().length > 0) ?? [];
  if (commandsRun.length < 1) {
    return false;
  }

  const remainingGaps =
    signoff.remaining_gaps?.filter((item) => item.trim().length > 0) ?? [];
  if (remainingGaps.length > 0) {
    return false;
  }

  if (expectedReviewerId) {
    const attackAttempts =
      signoff.attack_attempts?.filter((item) => item.trim().length > 0) ?? [];
    if (attackAttempts.length < 2) {
      return false;
    }

    // Present + empty required for signed-off adversarial reviews.
    if (countPFindings(signoff.p_findings) !== 0) {
      return false;
    }

    const rulesReviewed =
      signoff.rules_reviewed?.filter((item) => item.trim().length > 0) ?? [];
    if (rulesReviewed.length < 1) {
      return false;
    }
    const requiresAgentsCitation =
      !expectedReviewerId ||
      expectedReviewerId === "rules" ||
      expectedReviewerId === "a" ||
      expectedReviewerId === "b" ||
      expectedReviewerId === "c";
    if (
      requiresAgentsCitation &&
      root &&
      existsSync(join(root, "AGENTS.md")) &&
      !citesAgentsMd(rulesReviewed)
    ) {
      return false;
    }

    const artifactPaths =
      signoff.artifact_paths?.filter((item) => item.trim().length > 0) ?? [];
    if (artifactPaths.length < 1) {
      return false;
    }

    const objectivesChecked =
      signoff.objectives_checked?.filter((item) => item.trim().length > 0) ?? [];
    if (objectivesChecked.length < 1) {
      return false;
    }
  }

  return true;
}

function artifactExists(root: string, sessionDirectoryPath: string, relativePath: string): boolean {
  const normalized = relativePath.replace(/^\.?\//, "");
  const candidates = [
    join(root, sessionDirectoryPath, normalized),
    join(sessionDirectoryPath, normalized),
    join(root, normalized),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

export function relativePath(root: string, absolutePath: string): string {
  return absolutePath.startsWith(`${root}/`)
    ? absolutePath.replace(`${root}/`, "")
    : absolutePath;
}

export function countBlockedIterations(paths: GoalSessionPaths): number {
  if (!existsSync(paths.progressLog)) {
    return 0;
  }

  let count = 0;
  for (const line of readFileSync(paths.progressLog, "utf-8").split("\n")) {
    if (!line.trim()) {
      continue;
    }
    try {
      const entry = JSON.parse(line) as { event?: string };
      if (entry.event === "iteration_blocked") {
        count += 1;
      }
    } catch {
      // Ignore malformed progress lines.
    }
  }
  return count;
}

export function nextGoalIteration(
  loopCount: number,
  paths: GoalSessionPaths,
): number {
  return Math.max(loopCount + 1, countBlockedIterations(paths) + 1);
}

function yamlScalar(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "\"\"";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  const text = String(value);
  if (text === "") {
    return "\"\"";
  }
  if (/^[A-Za-z0-9_./:@+-]+$/.test(text) && !/^[-?]/.test(text)) {
    return text;
  }
  return JSON.stringify(text);
}

function yamlBlockScalar(value: string): string {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  return ["|", ...lines.map((line) => `  ${line}`)].join("\n");
}

function normalizeResumeHeading(heading?: string): string {
  const trimmed = heading?.trim() ?? "";
  if (!trimmed) {
    return DEFAULT_RESUME_HEADING;
  }
  return trimmed
    .replace(/^#+\s*/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || DEFAULT_RESUME_HEADING;
}

function resumeHeadingTitle(heading: string): string {
  return normalizeResumeHeading(heading)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mdscriptResumeCommand(
  root: string,
  paths: GoalSessionPaths,
  resumeHeading = DEFAULT_RESUME_HEADING,
): string {
  const scriptPath = relativePath(root, paths.goalMdscript);
  const heading = normalizeResumeHeading(resumeHeading);
  return `mdscript-exec ${scriptPath}#${heading}`;
}

export function writeGoalMdscript(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
  options: {
    iteration?: number;
    reasons?: string[];
    resumeHeading?: string;
    status?: "active" | "blocked" | "completed" | "stopped";
  } = {},
): string {
  const goal = state.goal.trim() || "(unspecified goal)";
  const runRelative = relativePath(root, paths.runDirectory);
  const sessionRelative = relativePath(root, paths.directory);
  const scriptRelative = relativePath(root, paths.goalMdscript);
  const resumeHeading = normalizeResumeHeading(
    options.resumeHeading ?? state.resume_heading ?? DEFAULT_RESUME_HEADING,
  );
  const resumeTitle = resumeHeadingTitle(resumeHeading);
  const iteration = options.iteration ?? state.iteration ?? 0;
  const status =
    options.status ??
    (state.active === false ? "stopped" : "active");
  const proofKind = resolveProofKind(state);
  const liveProof = isLiveProofRequired(state) ? "required" : "optional";
  const primaryAction = state.primary_user_action?.trim() ?? "";
  const reasons = options.reasons ?? [];
  const resumeCommand = mdscriptResumeCommand(root, paths, resumeHeading);
  const reasonsYaml =
    reasons.length > 0
      ? reasons.map((reason) => `  - ${yamlScalar(reason)}`).join("\n")
      : "  []";
  const reasonsBullets =
    reasons.length > 0
      ? reasons.map((reason) => `* completion gate: ${reason}`).join("\n")
      : "* completion gate: none recorded yet — evaluate artifacts and triple sign-off before stopping";

  const body = `---
id: ${yamlScalar(paths.runId ?? "legacy-run")}
conversation_id: ${yamlScalar(state.conversation_id)}
run_id: ${yamlScalar(paths.runId ?? "")}
session_dir: ${yamlScalar(sessionRelative)}
run_dir: ${yamlScalar(runRelative)}
goal_mdscript: ${yamlScalar(scriptRelative)}
status: ${yamlScalar(status)}
active: ${yamlScalar(Boolean(state.active))}
iteration: ${yamlScalar(iteration)}
resume_heading: ${yamlScalar(resumeHeading)}
proof_kind: ${yamlScalar(proofKind)}
live_proof: ${yamlScalar(state.live_proof ?? liveProof)}
primary_user_action: ${yamlScalar(primaryAction)}
reviewer_skill: gabe-review
goal: ${yamlBlockScalar(goal)}
completion_gate:
${reasonsYaml}
started_at: ${yamlScalar(state.started_at ?? new Date().toISOString())}
ended_at: ${yamlScalar(state.ended_at ?? "")}
updated_at: ${yamlScalar(new Date().toISOString())}
---

${MDSCRIPT_EXEC_HEADER}

## Goal Contract

* goal text is exactly:
  > ${goal.replace(/\n/g, " ")}
* conversation_id is \`${state.conversation_id}\`
* run_dir is \`${runRelative}\`
* goal_mdscript is \`${scriptRelative}\` — this file is the durable tracker and stop-hook resume target
* proof_kind is \`${proofKind}\`; live_proof is \`${state.live_proof ?? liveProof}\`
* primary_user_action is \`${primaryAction || "(unset)"}\`
* append-only surfaces: \`${runRelative}/progress.jsonl\`, session-log.jsonl, and .cursor/goal/goal-log.jsonl
* immutable run rule: never reuse or delete prior runs/<run_id>/ directories
* review rule: compose gabe-review for completion; orchestrator never self-authors a Proven verdict
* completion requires on-disk artifacts/manifest matching proof_kind/live_proof and a durable gabe-review verdict with empty blocking_findings

## Resume Goal

* treat this file as the active goal tracker — restore variables from front matter before acting
* set \`{{goal_text}}\` from front-matter \`goal\`
* set \`{{conversation_id}}\` from front-matter \`conversation_id\`
* set \`{{run_id}}\` from front-matter \`run_id\`
* set \`{{session_dir}}\` from front-matter \`session_dir\` (resolve under repo root)
* set \`{{run_dir}}\` from front-matter \`run_dir\`
* set \`{{goal_mdscript}}\` from front-matter \`goal_mdscript\`
* set \`{{proof_kind}}\` / \`{{live_proof}}\` / \`{{primary_user_action}}\` from front matter
* set \`{{orchestrator_model}}\` to this chat's model slug
* set \`{{iteration}}\` from front-matter \`iteration\`
* read this file's front matter as authoritative run state, latest \`progress.jsonl\` lines, artifacts/manifest.json, and any gabe-review findings / remaining blockers
* if front-matter \`active\` is false and status is completed/stopped, stop and report the terminal state — do not resume work
* otherwise continue at [Resume Heading](#${resumeHeading})

## ${resumeTitle}

* this is a stop-hook / tracker resume into heading \`${resumeHeading}\` — not a completion report
* do real work this turn: artifacts, tests, fixes, or reviews — never summary-only stop
${reasonsBullets}
* append one JSON line to \`{{run_dir}}/progress.jsonl\` with commands run, new artifact paths, and pass/fail evidence
* add new timestamped artifact files under \`{{run_dir}}/artifacts/\` when proof changes; never overwrite prior artifact files
* when proof is ready, write neutral \`{{run_dir}}/review-packet.md\` and compose gabe-review triple adversarial blind via mdscript-exec (rules + security + completeness lanes)
* persist gabe-review's decision to \`{{run_dir}}/review-verdict.json\` — only triple blind Proven-for (all three lane sign-offs + empty blocking_findings) completes the goal
* resolve every blocking finding before re-review
* wait for all background subagents / reviewer work to finish before attempting to stop
* do not ask the user to re-prompt — the stop hook loops by re-execing this MDScript until gabe-review proves the goal or you set active:false with a real blocker
* if still incomplete after this wave, keep front-matter active:true and leave this MDScript current
* if complete, jump to [Complete Goal](#complete-goal)
* if blocked by a missing external resource that cannot be stood up, jump to [Manual Stop](#manual-stop)

## Complete Goal

* verify \`{{run_dir}}/review-verdict.json\` exists from gabe-review with matching goal/conversation_id, grade starting with Proven for, empty blocking_findings, and proof_supplied referencing run artifacts
* set front-matter active:false / status:completed on this MDScript
* update \`{{session_dir}}/active-run.json\` to mark the run inactive when applicable
* append goal_completed / run_completed to the append-only logs
* stop and report the completed goal, \`{{run_dir}}\`, artifact summary, and that A/B/C signed off with empty p_findings

## Manual Stop

* set front-matter active:false and status stopped/blocked on this MDScript when the user stops the goal or an external blocker cannot be cleared
* append goal_stopped with the blocker summary to progress.jsonl and both append-only logs
* stop and report progress, \`{{run_dir}}\`, and the blocker

## Stop Hook Resume Command

* exact resume command for this tracker:
  \`${resumeCommand}\`
`;

  mkdirSync(paths.runDirectory, { recursive: true });
  writeFileSync(paths.goalMdscript, `${body.trimEnd()}\n`, "utf-8");
  // MDScript front matter is the sole run-state write path. Remove stale goal.json if present.
  if (existsSync(paths.goal) && paths.goal.endsWith("goal.json")) {
    unlinkSync(paths.goal);
  }
  return scriptRelative;
}

export function ensureGoalMdscript(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
  options: {
    iteration?: number;
    reasons?: string[];
    resumeHeading?: string;
    status?: "active" | "blocked" | "completed" | "stopped";
  } = {},
): string {
  if (!existsSync(paths.goalMdscript) || options.reasons || options.iteration !== undefined) {
    return writeGoalMdscript(root, paths, state, options);
  }
  return relativePath(root, paths.goalMdscript);
}

export function formatGoalFollowupMessage(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
  iteration: number,
  reasons: string[],
): string {
  const resumeHeading = normalizeResumeHeading(
    state.resume_heading ?? DEFAULT_RESUME_HEADING,
  );
  const scriptRelative = writeGoalMdscript(root, paths, state, {
    iteration,
    reasons,
    resumeHeading,
    status: "active",
  });
  const resumeCommand = mdscriptResumeCommand(root, paths, resumeHeading);
  const goal = state.goal.trim() || "(unspecified goal)";
  const runRelative = relativePath(root, paths.runDirectory);

  return [
    MDSCRIPT_EXEC_HEADER,
    "",
    "## Stop Hook Resume",
    "",
    `* hard continue — goal iteration ${iteration} is not signed off; this is a stop-hook resume, not a completion report`,
    `* goal text: ${goal}`,
    `* run_dir: \`${runRelative}\``,
    paths.runId ? `* run_id: \`${paths.runId}\`` : "",
    `* goal_mdscript: \`${scriptRelative}\``,
    `* resume_heading: \`${resumeHeading}\``,
    ...reasons.map((reason) => `* completion gate: ${reason}`),
    "* do real work this turn — never summary-only stop",
    `* restore variables from \`${scriptRelative}\` front matter, then execute the resume heading`,
    `* continue by executing [Resume Goal](${scriptRelative}#resume-goal) which jumps to [\`${resumeHeading}\`](${scriptRelative}#${resumeHeading})`,
    "",
    resumeCommand,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildActiveGoalContext(
  root: string,
  conversationId: string,
  orchestratorModel?: string,
): string | null {
  const paths = resolveActiveGoalPaths(root, conversationId);
  if (!paths) {
    return null;
  }

  const state = loadGoalState(paths);
  if (!state?.active) {
    return null;
  }

  const completion = evaluateGoalCompletion(root, paths, conversationId);
  if (completion.complete) {
    return null;
  }

  const nextIteration = nextGoalIteration(0, paths);
  const resumeHeading = normalizeResumeHeading(
    state.resume_heading ?? DEFAULT_RESUME_HEADING,
  );
  const scriptRelative = ensureGoalMdscript(root, paths, state, {
    reasons: completion.reasons,
    resumeHeading,
    status: "active",
  });
  const resumeCommand = mdscriptResumeCommand(root, paths, resumeHeading);
  const runRelative = relativePath(root, paths.runDirectory);

  return [
    MDSCRIPT_EXEC_HEADER,
    "",
    "## Active Goal Session",
    "",
    "* active goal session is incomplete — stop hook will block early exit",
    `* goal: ${state.goal.trim() || "(unspecified)"}`,
    `* run: ${runRelative}`,
    paths.runId ? `* run_id: ${paths.runId}` : "",
    `* goal_mdscript: ${scriptRelative}`,
    `* resume_heading: ${resumeHeading}`,
    `* blocked_iterations: ${countBlockedIterations(paths)}`,
    `* next_iteration_if_stopped: ${nextIteration}`,
    orchestratorModel?.trim()
      ? `* orchestrator_model: ${orchestratorModel.trim()} — pass model="${orchestratorModel.trim()}" on worker Task subagents (implementation, proof, explore, shell, CI)`
      : "",
    "* reviewer_skill: gabe-review — compose via mdscript-exec; persist review-verdict.json (do not invent parallel sign-off protocol)",
    ...completion.reasons.map((reason) => `* completion_gate: ${reason}`),
    "* while active: produce artifacts, compose gabe-review before stopping, append progress.jsonl only",
    "* only a gabe-review Proven-for verdict with empty blocking_findings completes the goal",
    "* worker Task subagents use the orchestrator model; completion review is gabe-review composition",
    "* treat any stop-hook MDScript message or incomplete active run as mandatory continue — not done",
    `* exact resume command: ${resumeCommand}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

export function inferProofKind(goal: string): ProofKind {
  const text = goal.toLowerCase();
  if (
    /\b(tui|textual|terminal ui|terminal app|chat tui|ncurses|curses|ink\.js)\b/.test(text) ||
    (/\bchat\b/.test(text) && /\b(textual|tui|terminal)\b/.test(text))
  ) {
    return "tui";
  }
  if (
    /\b(ui|ux|web ui|browser|figma|mockup|frontend|visual design|page layout|design match|component library|shadcn|tailwind ui)\b/.test(
      text,
    )
  ) {
    return "ui";
  }
  return "default";
}

export function resolveProofKind(state: GoalState): ProofKind {
  if (state.proof_kind === "tui" || state.proof_kind === "ui" || state.proof_kind === "default") {
    return state.proof_kind;
  }
  return inferProofKind(state.goal);
}

function isLogArtifact(entry: GoalArtifactEntry): boolean {
  return (
    entry.kind === "log" ||
    entry.kind === "output" ||
    entry.path.includes("/logs/")
  );
}

function isCaptureArtifact(entry: GoalArtifactEntry): boolean {
  return (
    entry.kind === "capture" ||
    entry.kind === "screenshot" ||
    entry.path.includes("/captures/") ||
    entry.path.includes("/screenshots/")
  );
}

function isImageArtifact(entry: GoalArtifactEntry): boolean {
  return (
    entry.kind === "image" ||
    entry.kind === "screenshot" ||
    entry.path.includes("/images/") ||
    entry.path.includes("/screenshots/") ||
    IMAGE_EXTENSIONS.test(entry.path)
  );
}

const LIVE_REPRODUCE_PATTERNS = [
  /tests\/live\//i,
  /@pytest\.mark\.live/i,
  /run-chat-textual-tests\.sh/i,
  /run-chat\.sh/i,
  /textual.*pilot/i,
  /playwright/i,
  /cypress/i,
  /nats.*4222/i,
];

const UNIT_REPRODUCE_PATTERNS = [
  /\buv run pytest tests\/(?!live\/)/i,
  /\bpytest tests\/(?!live\/)/i,
  /\bnpm test\b/i,
  /\bvitest\b/i,
  /\bjest\b/i,
];

export function inferArtifactTier(entry: GoalArtifactEntry): ProofTier {
  if (entry.tier === "unit" || entry.tier === "integration" || entry.tier === "live") {
    return entry.tier;
  }

  const haystack = `${entry.path} ${entry.reproduce} ${entry.proves}`;
  if (entry.path.includes("/live/") || /\/live\//i.test(haystack)) {
    return "live";
  }
  if (LIVE_REPRODUCE_PATTERNS.some((pattern) => pattern.test(haystack))) {
    return "live";
  }
  if (UNIT_REPRODUCE_PATTERNS.some((pattern) => pattern.test(entry.reproduce))) {
    return "unit";
  }
  return "integration";
}

export function impliesRuntimeBehavior(goal: string): boolean {
  const text = goal.toLowerCase();
  return /\b(notify|notification|message|send|reply|inference|typing|mention|nats|websocket|stream|publish|subscribe|live|e2e|integration|runtime|dispatch|deliver|chat|tui|ui|browser|click|submit|composer|modal|sidebar)\b/.test(
    text,
  );
}

export function isLiveProofRequired(state: GoalState): boolean {
  if (state.live_proof === "optional") {
    return false;
  }
  if (state.live_proof === "required") {
    return true;
  }

  const proofKind = resolveProofKind(state);
  if (proofKind === "tui" || proofKind === "ui") {
    return true;
  }
  return impliesRuntimeBehavior(state.goal);
}

function isLiveArtifact(entry: GoalArtifactEntry): boolean {
  return inferArtifactTier(entry) === "live";
}

function artifactProvesPrimaryAction(
  entry: GoalArtifactEntry,
  primaryAction: string,
): boolean {
  const proves = entry.proves.toLowerCase();
  const action = primaryAction.toLowerCase();
  const tokens = action.split(/\W+/).filter((token) => token.length >= 4);
  if (tokens.length === 0) {
    return proves.includes(action);
  }
  const matchedTokens = tokens.filter((token) => proves.includes(token));
  return matchedTokens.length >= Math.min(2, tokens.length);
}

export function validateArtifactsManifest(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
): GoalCompletionStatus {
  const goal = state.goal;
  const conversationId = state.conversation_id;
  const proofKind = resolveProofKind(state);
  const reasons: string[] = [];
  const manifest = loadJson<GoalArtifactsManifest>(paths.artifactsManifest);

  if (!manifest) {
    reasons.push(
      `Missing \`${relativePath(root, paths.artifactsManifest)}\`. Write reproducible proof artifacts and \`artifacts/manifest.json\` before reviewers sign off.`,
    );
    return { complete: false, reasons };
  }

  if (manifest.goal.trim() !== goal.trim()) {
    reasons.push("artifacts/manifest.json goal does not match goal.json.");
  }
  if (manifest.conversation_id.trim() !== conversationId.trim()) {
    reasons.push("artifacts/manifest.json conversation_id does not match this chat.");
  }

  const entries = manifest.artifacts?.filter((entry) => entry.path?.trim()) ?? [];
  if (entries.length < 1) {
    reasons.push("artifacts/manifest.json must list at least one proof artifact.");
  }

  for (const entry of entries) {
    if (!entry.reproduce?.trim()) {
      reasons.push(`Artifact ${entry.path}: missing reproduce command.`);
    }
    if (!entry.proves?.trim()) {
      reasons.push(`Artifact ${entry.path}: missing proves description.`);
    }
    if (!entry.kind?.trim()) {
      reasons.push(`Artifact ${entry.path}: missing kind (log, screenshot, etc.).`);
    }
    const runRelative = paths.runDirectory.replace(`${root}/`, "");
    if (!artifactExists(root, runRelative, entry.path)) {
      reasons.push(`Artifact file missing on disk: ${entry.path}`);
    }
  }

  const hasLog = entries.some(isLogArtifact);
  const hasCapture = entries.some(isCaptureArtifact);
  const hasImage = entries.some(isImageArtifact);

  if (proofKind === "tui" && !hasCapture) {
    reasons.push(
      "TUI goal (proof_kind: tui) requires at least one terminal capture — save under artifacts/captures/ or artifacts/screenshots/ with kind capture or screenshot.",
    );
  } else if (proofKind === "ui" && !hasImage) {
    reasons.push(
      "UI goal (proof_kind: ui) requires at least one image — save under artifacts/images/ or artifacts/screenshots/ with kind image or screenshot.",
    );
  } else if (proofKind === "default" && !hasLog) {
    reasons.push(
      "Non-visual goal (proof_kind: default) requires at least one log — save under artifacts/logs/ with kind log or output.",
    );
  }

  if (isLiveProofRequired(state)) {
    const liveArtifacts = entries.filter(isLiveArtifact);
    if (liveArtifacts.length < 1) {
      reasons.push(
        "Live proof required — add at least one artifact with tier: \"live\" (or reproduce via tests/live/, run-chat-textual-tests.sh, run-chat.sh, browser E2E). Unit tests and partial UI captures alone are not sufficient.",
      );
    }

    const primaryAction = manifest.primary_user_action?.trim() ?? "";
    if (!primaryAction) {
      reasons.push(
        "Live proof required — artifacts/manifest.json must set primary_user_action describing the exact user/runtime path proven (e.g. \"send @Elon message in dm-elon-musk without crash\").",
      );
    } else if (liveArtifacts.length > 0) {
      const liveProvesPrimary = liveArtifacts.some((entry) =>
        artifactProvesPrimaryAction(entry, primaryAction),
      );
      if (!liveProvesPrimary) {
        reasons.push(
          `Live proof required — at least one live-tier artifact must prove primary_user_action ("${primaryAction}"). Partial steps (e.g. autocomplete only) do not satisfy the goal.`,
        );
      }
    }

    const unitOnlyProof =
      entries.length > 0 && entries.every((entry) => inferArtifactTier(entry) === "unit");
    if (unitOnlyProof) {
      reasons.push(
        "Live proof required — all artifacts are unit-tier only. Run tests/live/ or an equivalent real-stack repro and add the output under artifacts/live/.",
      );
    }
  }

  return { complete: reasons.length === 0, reasons };
}

export function signoffRejectionReason(
  signoff: GoalSignoff | null,
  goal: string,
  conversationId: string,
  signoffPath: string,
  expectedReviewerId?: GoalReviewerId,
  root?: string,
): string {
  const label = expectedReviewerId
    ? `Reviewer ${expectedReviewerId.toUpperCase()}`
    : "Verifier";

  if (!signoff) {
    return `No sign-off at \`${signoffPath}\`. Compose gabe-review triple adversarial blind lanes (rules + security + completeness); each subagent mdscript-execs its own blind-reviewer MDScript.`;
  }
  if (!signoff.signed_off) {
    const pCount = countPFindings(signoff.p_findings);
    if (pCount > 0) {
      return `${label} rejected sign-off: ${pCount} P-level finding(s) remain — all P0–P3 must be resolved. ${signoff.verifier_summary?.trim() || ""}`.trim();
    }
    return `${label} rejected sign-off: ${signoff.verifier_summary?.trim() || "unspecified gaps."}`;
  }
  if (expectedReviewerId && signoff.reviewer_id !== expectedReviewerId) {
    return `${label} sign-off has wrong reviewer_id (expected "${expectedReviewerId}").`;
  }
  if (signoff.conversation_id.trim() !== conversationId.trim()) {
    return `${label} sign-off conversation_id does not match this chat.`;
  }
  if (signoff.goal.trim() !== goal.trim()) {
    return `${label} sign-off goal does not match this session's goal.json.`;
  }
  if ((signoff.verifier_summary?.trim().length ?? 0) < MIN_SUMMARY_LENGTH) {
    return `${label} sign-off rejected: verifier_summary too vague.`;
  }
  if ((signoff.evidence?.filter((item) => item.trim()).length ?? 0) < 2) {
    return `${label} sign-off rejected: need at least 2 specific evidence items.`;
  }
  if ((signoff.commands_run?.filter((item) => item.trim()).length ?? 0) < 1) {
    return `${label} sign-off rejected: no commands_run recorded.`;
  }
  if ((signoff.remaining_gaps?.filter((item) => item.trim()).length ?? 0) > 0) {
    return `${label} sign-off rejected: remaining_gaps not empty.`;
  }
  if (expectedReviewerId) {
    if ((signoff.attack_attempts?.filter((item) => item.trim()).length ?? 0) < 2) {
      return `${label} sign-off rejected: need at least 2 attack_attempts documenting attempts to falsify the change.`;
    }
    if (countPFindings(signoff.p_findings) !== 0) {
      return `${label} sign-off rejected: p_findings must be present and empty (all P0–P3 resolved).`;
    }
    if ((signoff.rules_reviewed?.filter((item) => item.trim()).length ?? 0) < 1) {
      return `${label} sign-off rejected: rules_reviewed must cite AGENTS.md (when present) and project rules checked.`;
    }
    const requiresAgentsCitation =
      !expectedReviewerId ||
      expectedReviewerId === "rules" ||
      expectedReviewerId === "a" ||
      expectedReviewerId === "b" ||
      expectedReviewerId === "c";
    if (
      requiresAgentsCitation &&
      root &&
      existsSync(join(root, "AGENTS.md")) &&
      !citesAgentsMd(signoff.rules_reviewed ?? [])
    ) {
      return `${label} sign-off rejected: rules_reviewed must cite AGENTS.md when that file exists.`;
    }
    if ((signoff.artifact_paths?.filter((item) => item.trim()).length ?? 0) < 1) {
      return `${label} sign-off rejected: artifact_paths must reference session artifacts verified.`;
    }
    if ((signoff.objectives_checked?.filter((item) => item.trim()).length ?? 0) < 1) {
      return `${label} sign-off rejected: objectives_checked must map to goal criteria.`;
    }
  }
  return `${label} sign-off rejected: invalid or incomplete response.`;
}

export function hasSplitReviewerVerdict(
  ...signoffs: Array<GoalSignoff | null>
): boolean {
  const present = signoffs.filter((signoff): signoff is GoalSignoff => Boolean(signoff));
  if (present.length < 2) {
    return false;
  }
  return present.some((signoff) => signoff.signed_off !== present[0].signed_off);
}

export function invalidateReviewerSignoffs(paths: GoalSessionPaths): void {
  for (const signoffPath of [
    paths.signoffReviewerA,
    paths.signoffReviewerB,
    paths.signoffReviewerC,
    paths.signoffReviewerRules,
    paths.signoffReviewerSecurity,
    paths.signoffReviewerCompleteness,
    paths.signoffReviewerRulesMdscript,
    paths.signoffReviewerSecurityMdscript,
    paths.signoffReviewerCompletenessMdscript,
    paths.reviewVerdict,
    paths.reviewVerdictMdscript,
  ]) {
    if (existsSync(signoffPath)) {
      unlinkSync(signoffPath);
    }
  }
}

export function splitVerdictReasons(
  ...signoffs: GoalSignoff[]
): string[] {
  const failing = signoffs.filter((signoff) => !signoff.signed_off);
  const passing = signoffs.filter((signoff) => signoff.signed_off);
  const reasons = [
    "Split verdict — full consensus required. At least one reviewer failed while another passed; all three sign-offs were cleared and all three reviewers must re-review.",
    `Passing reviewers (${passing.map((s) => s.reviewer_id?.toUpperCase() ?? "?").join(", ") || "none"}) do not count alone.`,
  ];

  for (const fail of failing) {
    const pCount = countPFindings(fail.p_findings);
    const gaps =
      fail.remaining_gaps?.filter((item) => item.trim().length > 0) ?? [];
    const id = fail.reviewer_id?.toUpperCase() ?? "?";
    if (pCount > 0) {
      reasons.push(`Reviewer ${id}: ${pCount} P-level finding(s) remain.`);
    }
    if (gaps.length > 0) {
      reasons.push(`Reviewer ${id} gaps: ${gaps.join("; ")}`);
    } else if (fail.verifier_summary?.trim()) {
      reasons.push(`Reviewer ${id}: ${fail.verifier_summary.trim()}`);
    }
  }

  reasons.push(
    `Fix every P-level finding and gap, refresh artifacts/manifest if proof changed, delete any stale sign-offs, then spawn reviewers A, B, and C again in parallel with model="${REVIEWER_MODEL_SLUG}".`,
  );
  return reasons;
}


export function isProvenGrade(grade: string | undefined): boolean {
  const text = grade?.trim() ?? "";
  return /^proven for\b/i.test(text);
}

export function countBlockingFindings(
  findings: Array<string | GoalPFinding> | undefined,
): number {
  if (!findings) {
    return -1;
  }
  return findings.filter((item) => {
    if (typeof item === "string") {
      return item.trim().length > 0;
    }
    if (!item || typeof item !== "object") {
      return false;
    }
    const summary =
      typeof item.summary === "string"
        ? item.summary
        : typeof item.severity === "string"
          ? item.severity
          : "";
    return summary.trim().length > 0 || Object.keys(item).length > 0;
  }).length;
}

export function isValidGabeReviewVerdict(
  verdict: GoalReviewVerdict,
  goal: string,
  conversationId: string,
): boolean {
  if (!isProvenGrade(verdict.grade) && !isProvenGrade(verdict.proof_decision)) {
    return false;
  }
  if (verdict.goal.trim() !== goal.trim()) {
    return false;
  }
  if (verdict.conversation_id.trim() !== conversationId.trim()) {
    return false;
  }
  if ((verdict.reviewer_skill?.trim() || "gabe-review") !== "gabe-review") {
    return false;
  }
  if (verdict.triple_blind !== true) {
    return false;
  }
  const lanes = verdict.lanes ?? [];
  const required = ["rules", "security", "completeness"];
  if (!required.every((lane) => lanes.includes(lane))) {
    return false;
  }
  if (countBlockingFindings(verdict.blocking_findings) !== 0) {
    return false;
  }
  const supplied =
    verdict.proof_supplied?.filter((item) => item.trim().length > 0) ??
    verdict.artifact_paths?.filter((item) => item.trim().length > 0) ??
    [];
  if (supplied.length < 1) {
    return false;
  }
  return true;
}

export function gabeReviewRejectionReason(
  verdict: GoalReviewVerdict | null,
  goal: string,
  conversationId: string,
  verdictPath: string,
): string {
  if (!verdict) {
    return `No gabe-review verdict at \`${verdictPath}\`. Compose gabe-review triple adversarial blind (rules + security + completeness) and persist review-verdict.json with triple_blind:true.`;
  }
  if (verdict.goal.trim() !== goal.trim()) {
    return "gabe-review verdict goal does not match this run's goal.";
  }
  if (verdict.conversation_id.trim() !== conversationId.trim()) {
    return "gabe-review verdict conversation_id does not match this chat.";
  }
  const grade = verdict.grade?.trim() || verdict.proof_decision?.trim() || "";
  if (/^blocked for\b/i.test(grade)) {
    return `gabe-review blocked completion: ${grade}`;
  }
  if (/^not ready for\b/i.test(grade)) {
    const count = countBlockingFindings(verdict.blocking_findings);
    return `gabe-review not ready: ${grade}${count > 0 ? ` (${count} blocking finding(s))` : ""}`;
  }
  if (!isProvenGrade(grade)) {
    return `gabe-review verdict is not Proven-for (grade=${grade || "missing"}).`;
  }
  if (countBlockingFindings(verdict.blocking_findings) !== 0) {
    return "gabe-review verdict still has blocking_findings — resolve and re-compose gabe-review.";
  }
  const supplied =
    verdict.proof_supplied?.filter((item) => item.trim().length > 0) ??
    verdict.artifact_paths?.filter((item) => item.trim().length > 0) ??
    [];
  if (supplied.length < 1) {
    return "gabe-review verdict missing proof_supplied/artifact_paths.";
  }
  return "gabe-review verdict rejected: invalid or incomplete response.";
}


export function validateTripleBlindSignoffs(
  root: string,
  paths: GoalSessionPaths,
  goal: string,
  conversationId: string,
): GoalCompletionStatus {
  const lanes: Array<{ id: GoalReviewerId; path: string }> = [
    {
      id: "rules",
      path: paths.signoffReviewerRulesMdscript,
      legacy: paths.signoffReviewerRules,
    },
    {
      id: "security",
      path: paths.signoffReviewerSecurityMdscript,
      legacy: paths.signoffReviewerSecurity,
    },
    {
      id: "completeness",
      path: paths.signoffReviewerCompletenessMdscript,
      legacy: paths.signoffReviewerCompleteness,
    },
  ];
  const reasons: string[] = [];
  const signoffs: GoalSignoff[] = [];

  for (const lane of lanes) {
    const signoff = loadMdscriptRecord<GoalSignoff>(lane.path, lane.legacy);
    if (!signoff || !isValidSignoff(signoff, goal, conversationId, lane.id, root)) {
      reasons.push(
        signoffRejectionReason(
          signoff,
          goal,
          conversationId,
          relativePath(root, existsSync(lane.legacy) ? lane.legacy : lane.path),
          lane.id,
          root,
        ),
      );
      continue;
    }
    signoffs.push(signoff);
  }

  if (reasons.length > 0) {
    return { complete: false, reasons };
  }

  if (signoffs.length === 3) {
    const summaries = signoffs.map((s) => s.verifier_summary?.trim() ?? "");
    const identicalPair =
      (summaries[0].length > 0 && summaries[0] === summaries[1]) ||
      (summaries[0].length > 0 && summaries[0] === summaries[2]) ||
      (summaries[1].length > 0 && summaries[1] === summaries[2]);
    if (identicalPair) {
      invalidateReviewerSignoffs(paths);
      return {
        complete: false,
        reasons: [
          "Two or more blind lane summaries are identical — rules/security/completeness reviewers must scrutinize independently. Cleared sign-offs; re-run triple adversarial blind gabe-review.",
        ],
      };
    }
  }

  return { complete: true, reasons: [] };
}

export function evaluateGoalCompletion(
  root: string,
  paths: GoalSessionPaths,
  conversationId: string,
): GoalCompletionStatus {
  const state = loadGoalState(paths);
  if (!state) {
    return {
      complete: false,
      reasons: [
        `Missing run tracker at \`${relativePath(root, paths.goalMdscript)}\` (legacy goal.json also absent).`,
      ],
    };
  }

  const goal = state.goal.trim() || "(unspecified goal)";

  // Legacy grind / single-verifier sessions.
  if (!usesStrictGoalCompletion(paths)) {
    const legacySignoff = loadJson<GoalSignoff>(paths.signoff);
    if (legacySignoff && isValidSignoff(legacySignoff, goal, conversationId)) {
      return { complete: true, reasons: [] };
    }
    return {
      complete: false,
      reasons: [
        signoffRejectionReason(
          legacySignoff,
          goal,
          conversationId,
          relativePath(root, paths.signoff),
        ),
      ],
    };
  }

  const reasons: string[] = [];

  const artifactsStatus = validateArtifactsManifest(root, paths, state);
  if (!artifactsStatus.complete) {
    reasons.push(...artifactsStatus.reasons);
  }

  const triple = validateTripleBlindSignoffs(root, paths, goal, conversationId);
  if (!triple.complete) {
    reasons.push(...triple.reasons);
  }

  const verdict = loadMdscriptRecord<GoalReviewVerdict>(
    paths.reviewVerdictMdscript,
    paths.reviewVerdict,
  );
  if (!verdict || !isValidGabeReviewVerdict(verdict, goal, conversationId)) {
    reasons.push(
      gabeReviewRejectionReason(
        verdict,
        goal,
        conversationId,
        relativePath(
          root,
          existsSync(paths.reviewVerdict)
            ? paths.reviewVerdict
            : paths.reviewVerdictMdscript,
        ),
      ),
    );
  }

  return { complete: reasons.length === 0, reasons };
}

export function deactivateGoal(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
): void {
  const deactivated: GoalState = {
    ...state,
    active: false,
    ended_at: new Date().toISOString(),
  };
  if (existsSync(paths.goalMdscript) || !paths.legacy) {
    writeGoalMdscript(root, paths, deactivated, {
      status: "stopped",
      resumeHeading: state.resume_heading ?? "manual-stop",
    });
  } else if (existsSync(paths.goal)) {
    // Pure legacy grind/root JSON sessions.
    writeJson(paths.goal, deactivated);
  }

  if (existsSync(paths.activeRun)) {
    const pointer = loadJson<ActiveRunPointer>(paths.activeRun);
    if (pointer) {
      writeJson(paths.activeRun, { ...pointer, active: false });
    }
  }
}

export function completeGoalRun(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
): void {
  const completed: GoalState = {
    ...state,
    active: false,
    ended_at: new Date().toISOString(),
  };
  writeGoalMdscript(root, paths, completed, {
    status: "completed",
    resumeHeading: "complete-goal",
    reasons: [],
  });
  if (existsSync(paths.activeRun)) {
    const pointer = loadJson<ActiveRunPointer>(paths.activeRun);
    if (pointer) {
      writeJson(paths.activeRun, {
        ...pointer,
        active: false,
        goal_mdscript: relativePath(root, paths.goalMdscript),
      });
    }
  }
  recordGoalEvent(root, state.conversation_id, "goal_completed", {
    run_id: paths.runId,
    goal: state.goal,
    goal_mdscript: relativePath(root, paths.goalMdscript),
  });
}

export function abortGoalRun(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
  reason: "aborted" | "error" | "stopped",
): void {
  const stopped: GoalState = {
    ...state,
    active: false,
    ended_at: new Date().toISOString(),
  };
  writeGoalMdscript(root, paths, stopped, {
    status: reason === "stopped" ? "stopped" : "blocked",
    resumeHeading: "manual-stop",
    reasons: [`goal_${reason}`],
  });
  if (existsSync(paths.activeRun)) {
    const pointer = loadJson<ActiveRunPointer>(paths.activeRun);
    if (pointer) {
      writeJson(paths.activeRun, {
        ...pointer,
        active: false,
        goal_mdscript: relativePath(root, paths.goalMdscript),
      });
    }
  }
  recordGoalEvent(root, state.conversation_id, `goal_${reason}`, {
    run_id: paths.runId,
    goal: state.goal,
    goal_mdscript: relativePath(root, paths.goalMdscript),
  });
}

export function workspaceRootFromInput(workspaceRoots?: string[]): string {
  const roots = workspaceRoots?.filter(Boolean) ?? [];
  return roots.length > 0 ? roots[0] : process.cwd();
}

export function readStdinJson<T>(): T {
  const text = readFileSync(0, "utf-8");
  if (!text.trim()) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export function respond(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(payload) + "\n");
}

/** Stop hooks must exit immediately after respond — do not leave Bun waiting on open stdin. */
export function finishHook(payload: Record<string, unknown> = {}): never {
  respond(payload);
  process.exit(0);
}

export function listSessionArtifactFiles(artifactsDirectory: string): string[] {
  if (!existsSync(artifactsDirectory)) {
    return [];
  }

  const files: string[] = [];
  const walk = (directory: string, prefix: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolute, relative);
      } else if (entry.name !== ARTIFACTS_MANIFEST_FILE) {
        files.push(`artifacts/${relative}`);
      }
    }
  };
  walk(artifactsDirectory, "");
  return files;
}
