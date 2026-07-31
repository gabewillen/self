# gabe-goal contracts

Portable reference for the MDScript `gabe-goal` skill.

`<project_home>` is `~/.agents/projects/<project>` (or `$AGENTS_HOME`), resolved by
[Resolve Agent Home](../../gabe-common/workflows/agent-home.md#resolve-agent-home).
Run state stays out of the working repository unless the pack was installed with
`--local` or `GABE_AGENTS_LOCAL=1`, in which case it lives under `<repo>/.agents`.
A pre-cutover `.cursor/goal/` tree is read as legacy and never written for new runs.

## Paths

| Path | Rule |
|------|------|
| `<project_home>/goal/goal-log.jsonl` | Project-wide append-only events |
| `<project_home>/goal/sessions/<conversation_id>/` | One chat session |
| `session-log.jsonl` | Session append-only log |
| `runs/<run_id>/goal.mdscript.md` front matter | Current run — newest with `active: true` |
| `runs/<run_id>/` | Immutable run directory |
| `runs/<run_id>/goal.mdscript.md` | Sole run state (YAML front matter) + executable tracker + stop-hook resume target |
| `runs/<run_id>/goal.json` | Legacy only — read fallback; not written for new runs |
| `runs/<run_id>/progress.jsonl` | Append-only iteration log |
| `runs/<run_id>/artifacts/**` | New timestamped files only |
| `runs/<run_id>/artifacts/manifest.json` | Reproduce map |
| `runs/<run_id>/review-packet.md` | Neutral packet for gabe-review |
| `runs/<run_id>/review-verdict.mdscript.md` | Durable gabe-review verdict (front matter) + `Resume From Verdict` dispatch |
| `runs/<run_id>/review-verdict.json` | Legacy only — read fallback; not written for new runs |
| `runs/<run_id>/signoff-reviewer-rules.mdscript.md` | Blind rules lane (AGENTS/CLAUDE/GEMINI): front matter + `Resume From Signoff` |
| `runs/<run_id>/signoff-reviewer-security.mdscript.md` | Blind security/penetration lane: front matter + `Resume From Signoff` |
| `runs/<run_id>/signoff-reviewer-completeness.mdscript.md` | Blind completeness lane: front matter + `Resume From Signoff` |
| `runs/<run_id>/signoff-reviewer-hsm.mdscript.md` | Blind HSM lane (`gabe-hsm-review`), only when a state machine is in scope: front matter + `Resume From Signoff` |

## goal.mdscript.md front matter (authoritative run state)

```yaml
active: true
status: active
goal: |
  <one-sentence goal>
conversation_id: <chat id>
run_id: <runs/<run_id> name>
proof_kind: tui|ui|default
live_proof: required|optional
primary_user_action: <end-to-end path when live proof required>
goal_mdscript: runs/<run_id>/goal.mdscript.md
resume_heading: pursue-goal
iteration: 0
started_at: <ISO-8601>
completion_gate: []
```

Legacy `goal.json` is read-only fallback for pre-cutover runs. New runs never write it.

Executable MDScript body is owned by the run. Stop hooks rewrite completion_gate / iteration and follow up with:

```text
mdscript-exec <run_dir>/goal.mdscript.md#pursue-goal
```

Required headings: `Goal Contract`, `Resume Goal`, `Pursue Goal` (or current `resume_heading`), `Complete Goal`, `Manual Stop`, `Stop Hook Resume Command`.

## proof_kind

| Kind | Required proof |
|------|----------------|
| `tui` | Capture + live proof when required |
| `ui` | Image + live proof when required |
| `default` | Log; live proof when runtime/user path changes |

## manifest entry

```json
{
  "path": "artifacts/live/20260526T220000Z-action.txt",
  "kind": "log",
  "tier": "live",
  "reproduce": "<exact command>",
  "proves": "<what this proves about primary_user_action or goal>"
}
```

## review-verdict.mdscript.md (gabe-review composition)

```json
{
  "goal": "<exact goal>",
  "conversation_id": "<exact id>",
  "run_id": "<run id>",
  "reviewer_skill": "gabe-review",
  "triple_blind": true,
  "lanes": ["rules", "security", "completeness"],
  "signoff_paths": [
    "signoff-reviewer-rules.mdscript.md",
    "signoff-reviewer-security.mdscript.md",
    "signoff-reviewer-completeness.mdscript.md"
  ],
  "hsm_lane_verdict": "pass|fail|n/a — present only when the hsm lane ran; that lane is also added to lanes and signoff_paths",
  "proof_scope": "goal-completion|live-proof|…",
  "grade": "Proven for <proof_scope>",
  "proof_decision": "Proven for <proof_scope> at <threshold>",
  "blocking_severities": "all findings|P1|…",
  "blocking_findings": [],
  "residual_findings": [],
  "proof_supplied": ["artifacts/…"],
  "proof_not_claimed": [],
  "artifact_paths": ["artifacts/…"],
  "commands_run": ["…"],
  "review_round": 1,
  "reviewed_at": "<ISO-8601>"
}
```

Completion requires grade/proof_decision starting with `Proven for` and empty `blocking_findings`.
The stop hook enforces this: a run left inactive with `status: completed` but no valid
verdict is re-opened at `pursue-goal` with a `completion_rejected` progress entry.
Use `status: stopped` or `blocked` for a deliberate stop, which the hook leaves alone. `Not ready for …` re-enters pursue/fix. `Blocked for …` stops only when the missing precondition cannot be stood up locally.

gabe-goal does not implement a parallel reviewer protocol — it execs `gabe-review` and persists that decision.

## Models

| Role | Model |
|------|-------|
| Orchestrator / workers | chat `orchestrator_model` |
| Completion review | compose `gabe-review` (model and effort selected per gabe-review) |

## Cursor hooks (adapter)

`adapters/cursor/` ships the TypeScript hooks (`goal-lib.ts`, `goal-session-start.ts`, `goal-session-touch.ts`, `goal-stop.ts`) plus `hooks.json`. Package install merges them into `~/.cursor/hooks.json` and points commands at `~/.cursor/skills/gabe-goal/adapters/cursor/…`. MDScript execution does not require the hooks, but stop-hook resume semantics in `SKILL.md#stop-hook-resume` match their behavior.
