# Coordinator control policy

Hold these rules while checking multi-lane coordination.

## Lane ledger fields (multi-lane)

A durable lane ledger must carry, when applicable:

- thread id
- goal MDScript when monitored or resumable
- `/mdscript-exec` re-entry command
- owner, parent agent
- repository or system
- issue/PR/MR, referenced tickets
- agent identities
- phase, event execution, event type
- stop reason when stopping
- next proof, blocker, next check, reporting path

## Ownership separation

**Require**

- root and coordinating Gabe threads keep code implementation and code-review ownership in durable implementer lanes
- every child orchestrator, implementer, reviewer, and goal-resumed Gabe lane reports back to its parent agent or parent reporting path before stopping for any reason
- child orchestrators are durable Codex threads or file-task child lanes, not subagents, when they own coordination scope, lane ledgers, goal setup, or handoffs
- epics, milestones, projects, portfolios, programs, parent tracker items, release trains, and any scope with subtickets are delegated to a child orchestrator
- orchestrator-created Codex threads use canonical titles shaped as `<role>: [<issue>] <description>`
- active orchestrator-owned management and watcher state is captured in `~/.agents/projects/{{project_name}}/goals/*.mdscript.md`
- monitored or resumable coordinator lanes carry a goal MDScript re-entry (resume must not reread and renarrate Gabe context, event contracts, watcher rules, and ledger rules before acting)

## Parent-visible stop reports

**Add a coordinator-control finding** if a child lane is terminal, paused, blocked, obsolete, interrupted, watcher-terminal, closed, deleted, or archived without a parent-visible stop report.

## Scope and subagent misuse

**Add a coordinator-control finding** if:

- a parent orchestrator directly manages leaf subtickets or leaf implementers inside a child-orchestrator scope instead of orchestrating the child orchestrator
- an orchestrator creates a child orchestrator as a subagent or records a child orchestrator only by subagent id
- an active project lane has no goal MDScript unless the lane is terminal, explicitly paused, or handed off

## Prompt return scripts

**Require** any Gabe MDScript workflow prompt to write an executable return script under `~/.agents/projects/{{project_name}}/returns` before asking for input, and to end the user-facing prompt with the exact `mdscript-exec` resume command.

**Add a coordinator-control finding** when a blocker, authority-boundary stop, or decision-ready question has no `{{return_script}}`, no `{{return_resume_command}}`, or a stop report whose `resume_command` cannot resume the saved caller heading.

## Span of control

Flag more than five active direct lanes under one coordinator unless work is split by repository, ticket group, system boundary, incident area, or release train into child orchestrators.

## After compaction, resume, handoff, or interruption

**Require** live lane refresh before steering workers or reporting readiness.

## Cross-thread events

Cross-thread `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` events must be reported as exact MDScript executions in `{{event_exec}}` and trigger the required owner response rather than becoming passive status.

| Event | Required execution | Finding when violated |
| --- | --- | --- |
| `DISPOSITION_READY` | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready` (start disposition or receive explicit root denial) | reported as bare label or treated as watcher context only |
| `TARGET_DRIFT` | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift` (interrupt old-target proof; force current-target refresh or exact blocker within one watcher cycle) | reported as bare label or missing that execution |
| `HANDOFF_UNACKED` | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked` and escalate to parent/root | reported as bare label or silent after one watcher cycle |
| `STALE_MR` | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr` (head movement or exact blocker path) | reported as bare label or repeats old-head proof after target-consume without that execution |

## Coordinator naming bar

If the coordinator cannot name every active lane's owner, parent agent, state, blocker, next proof, next check, and reporting path from durable state:

- set `{{grade}}` to `Not ready`
- add a coordinator-control finding
