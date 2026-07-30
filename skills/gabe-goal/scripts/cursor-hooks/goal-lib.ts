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
}

export type ProofKind = "tui" | "ui" | "default";
export type ProofTier = "unit" | "integration" | "live";

export type GoalReviewerId = "a" | "b" | "c";

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
  signoff: string;
  signoffReviewerA: string;
  signoffReviewerB: string;
  signoffReviewerC: string;
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
}

export interface GoalCompletionStatus {
  complete: boolean;
  reasons: string[];
}

export const MIN_SUMMARY_LENGTH = 40;
export const SIGNOFF_REVIEWER_A_FILE = "signoff-reviewer-a.json";
export const SIGNOFF_REVIEWER_B_FILE = "signoff-reviewer-b.json";
export const SIGNOFF_REVIEWER_C_FILE = "signoff-reviewer-c.json";
export const REVIEWER_MODEL_SLUG = "composer-2.5-fast";
export const ARTIFACTS_MANIFEST_FILE = "manifest.json";
export const ACTIVE_RUN_FILE = "active-run.json";
export const SESSION_LOG_FILE = "session-log.jsonl";
export const PROGRESS_LOG_FILE = "progress.jsonl";
export const RUNS_DIR_NAME = "runs";
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
    signoff: join(runDirectoryPath, "signoff.json"),
    signoffReviewerA: join(runDirectoryPath, SIGNOFF_REVIEWER_A_FILE),
    signoffReviewerB: join(runDirectoryPath, SIGNOFF_REVIEWER_B_FILE),
    signoffReviewerC: join(runDirectoryPath, SIGNOFF_REVIEWER_C_FILE),
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
  return paths.goal.endsWith("goal.json");
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
  if (priorPaths && existsSync(priorPaths.goal)) {
    const priorState = loadJson<GoalState>(priorPaths.goal);
    // Supersede only a still-active run. Completed runs are left as-is — the next goal is unrelated.
    if (priorState?.active) {
      deactivateGoal(priorPaths.goal, priorState);
      recordGoalEvent(root, conversationId, "goal_superseded", {
        run_id: priorPaths.runId,
        goal: priorState.goal,
        reason: "replaced_by_new_goal",
      });
    }
  }

  const runId = newRunId();
  const paths = buildRunPaths(sessionRoot, runId, false);
  mkdirSync(paths.runDirectory, { recursive: true });
  ensureRunArtifactDirectories(paths);

  const runState: GoalState = {
    ...state,
    conversation_id: conversationId,
    run_id: runId,
    started_at: state.started_at ?? new Date().toISOString(),
    active: true,
  };
  writeJson(paths.goal, runState);
  writeJson(paths.activeRun, {
    run_id: runId,
    conversation_id: conversationId,
    started_at: runState.started_at,
  } satisfies ActiveRunPointer);

  recordGoalEvent(root, conversationId, "goal_started", {
    run_id: runId,
    goal: runState.goal,
    proof_kind: resolveProofKind(runState),
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
    if (existsSync(paths.goal)) {
      return paths;
    }
  }

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
  const state = loadJson<GoalState>(paths.goal);
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
    const state = loadJson<GoalState>(paths.goal);
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
    if (root && existsSync(join(root, "AGENTS.md")) && !citesAgentsMd(rulesReviewed)) {
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

export function formatGoalFollowupMessage(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
  iteration: number,
  reasons: string[],
): string {
  const goal = state.goal.trim() || "(unspecified goal)";
  const runRelative = relativePath(root, paths.runDirectory);

  return [
    `[Goal iteration ${iteration}] Goal not signed off yet — **continue working now**. This is a stop-hook resume, not a completion report.`,
    ``,
    `**Goal:** ${goal}`,
    `**Run:** \`${runRelative}\``,
    paths.runId ? `**Run ID:** \`${paths.runId}\`` : "",
    ``,
    `**Completion gate:**`,
    ...reasons.map((reason) => `- ${reason}`),
    ``,
    `**Required this iteration (do not stop until done or blocked):**`,
    `1. Do real work — artifacts, tests, fixes — not a summary-only turn.`,
    `2. Append \`progress.jsonl\`; add new timestamped artifact files under this run.`,
    `3. When proof is ready, write review-packet.md and spawn reviewers A, B, and C in parallel (readonly, model="${REVIEWER_MODEL_SLUG}") to write sign-off files under the run directory.`,
    `4. Resolve every P0–P3 finding before re-review — p_findings must be empty on all three sign-offs.`,
    `5. Wait for all background subagents to finish before attempting to stop (stop-hook followups can fail while background tasks are pending).`,
    `6. Do not ask the user to re-prompt — the stop hook loops until all three reviewers pass or you set \`active: false\` with a real blocker.`,
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

  const state = loadJson<GoalState>(paths.goal);
  if (!state?.active) {
    return null;
  }

  const completion = evaluateGoalCompletion(root, paths, conversationId);
  if (completion.complete) {
    return null;
  }

  const nextIteration = nextGoalIteration(0, paths);
  const runRelative = relativePath(root, paths.runDirectory);

  return [
    "Active goal session (incomplete — stop hook will block early exit):",
    `- goal: ${state.goal.trim() || "(unspecified)"}`,
    `- run: ${runRelative}`,
    paths.runId ? `- run_id: ${paths.runId}` : "",
    `- blocked_iterations: ${countBlockedIterations(paths)}`,
    `- next_iteration_if_stopped: ${nextIteration}`,
    orchestratorModel?.trim()
      ? `- orchestrator_model: ${orchestratorModel.trim()} — pass model="${orchestratorModel.trim()}" on worker Task subagents (implementation, proof, explore, shell, CI).`
      : "",
    `- reviewer_model: ${REVIEWER_MODEL_SLUG} — spawn exactly three adversarial blind reviewers with model="${REVIEWER_MODEL_SLUG}" (or equivalent if unavailable).`,
    `- completion_gate:`,
    ...completion.reasons.map((reason) => `  - ${reason}`),
    "",
    "While active: produce artifacts, spawn three composer-2.5 adversarial blind reviewers before stopping, append progress.jsonl only.",
    "All P0–P3 findings must be resolved (p_findings: []) before sign-off counts.",
    "Worker Task subagents use the orchestrator model; reviewers use composer-2.5-fast (or equivalent).",
    "If the user message is [Goal iteration N], treat it as mandatory continue — not done.",
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
    return `No sign-off at \`${signoffPath}\`. Spawn three adversarial blind readonly ${REVIEWER_MODEL_SLUG} reviewer subagents for this conversation.`;
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
    if (
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

export function evaluateGoalCompletion(
  root: string,
  paths: GoalSessionPaths,
  conversationId: string,
): GoalCompletionStatus {
  const state = loadJson<GoalState>(paths.goal);
  if (!state) {
    return { complete: false, reasons: ["Missing goal.json for the active run."] };
  }

  const goal = state.goal.trim() || "(unspecified goal)";

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

  const signoffA = loadJson<GoalSignoff>(paths.signoffReviewerA);
  const signoffB = loadJson<GoalSignoff>(paths.signoffReviewerB);
  const signoffC = loadJson<GoalSignoff>(paths.signoffReviewerC);

  if (
    signoffA &&
    signoffB &&
    signoffC &&
    hasSplitReviewerVerdict(signoffA, signoffB, signoffC)
  ) {
    reasons.push(...splitVerdictReasons(signoffA, signoffB, signoffC));
    invalidateReviewerSignoffs(paths);
  } else {
    if (!signoffA || !isValidSignoff(signoffA, goal, conversationId, "a", root)) {
      reasons.push(
        signoffRejectionReason(
          signoffA,
          goal,
          conversationId,
          relativePath(root, paths.signoffReviewerA),
          "a",
          root,
        ),
      );
    }
    if (!signoffB || !isValidSignoff(signoffB, goal, conversationId, "b", root)) {
      reasons.push(
        signoffRejectionReason(
          signoffB,
          goal,
          conversationId,
          relativePath(root, paths.signoffReviewerB),
          "b",
          root,
        ),
      );
    }
    if (!signoffC || !isValidSignoff(signoffC, goal, conversationId, "c", root)) {
      reasons.push(
        signoffRejectionReason(
          signoffC,
          goal,
          conversationId,
          relativePath(root, paths.signoffReviewerC),
          "c",
          root,
        ),
      );
    }

    if (signoffA?.signed_off && signoffB?.signed_off && signoffC?.signed_off) {
      const summaryA = signoffA.verifier_summary?.trim() ?? "";
      const summaryB = signoffB.verifier_summary?.trim() ?? "";
      const summaryC = signoffC.verifier_summary?.trim() ?? "";
      const identicalPair =
        (summaryA.length > 0 && summaryA === summaryB) ||
        (summaryA.length > 0 && summaryA === summaryC) ||
        (summaryB.length > 0 && summaryB === summaryC);
      if (identicalPair) {
        reasons.push(
          "Two or more reviewer sign-off summaries are identical — reviewers must scrutinize independently. Clear all three sign-offs and re-review with composer-2.5-fast.",
        );
        invalidateReviewerSignoffs(paths);
      }
    }
  }

  return { complete: reasons.length === 0, reasons };
}

export function deactivateGoal(goalPath: string, state: GoalState): void {
  writeJson(goalPath, { ...state, active: false, ended_at: new Date().toISOString() });
}

export function completeGoalRun(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
): void {
  deactivateGoal(paths.goal, state);
  recordGoalEvent(root, state.conversation_id, "goal_completed", {
    run_id: paths.runId,
    goal: state.goal,
  });
}

export function abortGoalRun(
  root: string,
  paths: GoalSessionPaths,
  state: GoalState,
  reason: "aborted" | "error" | "stopped",
): void {
  deactivateGoal(paths.goal, state);
  recordGoalEvent(root, state.conversation_id, `goal_${reason}`, {
    run_id: paths.runId,
    goal: state.goal,
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
