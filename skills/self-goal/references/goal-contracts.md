# self-goal contracts

Portable reference for the MDScript `self-goal` skill.

`<project_home>` is `~/.agents/projects/<project>` (or `$AGENTS_HOME`), resolved by
[Resolve Agent Home](../../self-common/workflows/agent-home.md#resolve-agent-home).
Run state stays out of the working repository unless the pack was installed with
`--local` or `SELF_LOCAL=1`, in which case it lives under `<repo>/.agents`.

## Paths

| Path | Rule |
|------|------|
| `<project_home>/goal/goal-log.jsonl` | Project-wide append-only events |
| `<project_home>/goal/sessions/<conversation_id>/` | One chat session |
| `session-log.jsonl` | Session append-only log |
| `runs/<run_id>/goal.mdscript.md` front matter | Current run — newest with `active: true` |
| `runs/<run_id>/` | Immutable run directory |
| `runs/<run_id>/goal.mdscript.md` | Sole run state (YAML front matter) + executable tracker + resume target |
| `runs/<run_id>/progress.jsonl` | Append-only iteration log |
| `runs/<run_id>/artifacts/**` | New timestamped files only |
| `runs/<run_id>/artifacts/manifest.json` | Reproduce map |
| `runs/<run_id>/review-packet.md` | Neutral packet for self-review |
| `runs/<run_id>/review-verdict.mdscript.md` | Durable self-review verdict (front matter) + `Resume From Verdict` dispatch |
| `runs/<run_id>/signoff-reviewer-rules.mdscript.md` | Blind rules lane |
| `runs/<run_id>/signoff-reviewer-security.mdscript.md` | Blind security lane |
| `runs/<run_id>/signoff-reviewer-completeness.mdscript.md` | Blind completeness lane |
| `runs/<run_id>/signoff-reviewer-hsm.mdscript.md` | Blind HSM lane when selected |
| `runs/<run_id>/signoff-reviewer-eng-*.mdscript.md` | Selected engineering-rules lanes |

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
skip_hooks: false
loop_driver: self-hooks   # or harness-goal
started_at: <ISO-8601>
completion_gate: []
```

Executable MDScript body is owned by the run. When `loop_driver` is `self-hooks`, stop hooks rewrite completion_gate / iteration and follow up with:

```text
mdscript-exec <run_dir>/goal.mdscript.md#pursue-goal
```

When `loop_driver` is `harness-goal`, the harness `/goal` ability continues rounds and self-goal hooks no-op.

Required headings: `Goal Contract`, `Resume Goal`, `Pursue Goal` (or current `resume_heading`), `Complete Goal`, `Manual Stop`, and `Stop Hook Resume Command`.

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

## review-verdict.mdscript.md (self-review composition)

Completion requires grade/proof_decision starting with `Proven for` and empty `blocking_findings`. Sign-offs and verdicts are MDScript only.

When `loop_driver` is `self-hooks`, a run left inactive with `status: completed` but no valid verdict is re-opened at `pursue-goal` with a `completion_rejected` progress entry. Use `status: stopped` or `blocked` for a deliberate stop. When `loop_driver` is `harness-goal`, the agent enforces the same gate without stop hooks.

## Models

| Role | Model |
|------|-------|
| Orchestrator / workers | chat `orchestrator_model` |
| Completion review | compose `self-review` (model and effort selected per self-review) |

## Harness `/goal` vs self-goal hooks

When the harness already owns multi-round goal continuation, **prefer that ability and skip self-goal hooks**.

| Harness | How `/goal` is owned | Detection | Loop driver |
|---------|----------------------|-----------|-------------|
| **Grok Build** | Host `/goal` (before Stop gate; not a Stop hook) | Grok runtime / host slash `/goal` | `harness-goal`, `skip_hooks: true` |
| **Cursor** | Skill `goal` at `~/.cursor/skills/goal` (or other skills roots) | `goal/SKILL.md` exists and is not `self-goal` | `harness-goal`, `skip_hooks: true` |
| **Claude / Codex / others** | Same skill-name probe | `goal/SKILL.md` under agent skills roots | `harness-goal` when skill present |

| `loop_driver` | Behavior |
|---------------|----------|
| `harness-goal` | Follow self-goal MDScript workflow for work/proof/self-review; **do not** use self-goal SessionStart / UserPromptSubmit / Stop hooks to re-prompt. Harness `/goal` (or self-reentry) continues rounds. |
| `self-hooks` | Full self-goal stop/session hook loop. |

Env overrides:

| Env | Effect |
|-----|--------|
| `SELF_GOAL_SKIP_HOOKS=1` | Force `skip_hooks` / harness-goal path |
| `SELF_GOAL_FORCE_HOOKS=1` | Force self-goal hooks even when harness `/goal` exists |

Hooks (`goal-stop.ts`, `goal-session-start.ts`, `goal-session-touch.ts`) call `shouldSkipGoalHooks()` and **exit immediately** when the harness owns `/goal` or the run sets `skip_hooks: true`.

## Adapters

`adapters/*/` ship the TypeScript hooks plus `hooks.json`. Package install merges them into the harness hook config. MDScript execution does not require the hooks. When a harness `/goal` ability is present, hooks no-op so they do not double-loop with the host.
