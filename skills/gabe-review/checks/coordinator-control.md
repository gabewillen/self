<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Check Coordinator Control

* if the artifact coordinates multiple lanes
  * require a durable lane ledger with thread id when available, goal MDScript when monitored or resumable, `/mdscript-exec` re-entry command, owner, parent agent, repository or system, issue/PR/MR, referenced tickets, agent identities, phase, event execution, event type, stop reason when stopping, next proof, blocker, next check, and reporting path

* require root and coordinating Gabe threads to keep code implementation and code-review ownership in durable implementer lanes

* require every child orchestrator, implementer, reviewer, and goal-resumed Gabe lane to report back to its parent agent or parent reporting path before stopping for any reason

* add a coordinator-control finding if a child lane is terminal, paused, blocked, obsolete, interrupted, watcher-terminal, closed, deleted, or archived without a parent-visible stop report

* require child orchestrators to be durable Codex threads or file-task child lanes, not subagents, when they own coordination scope, lane ledgers, goal setup, or handoffs

* require epics, milestones, projects, portfolios, programs, parent tracker items, release trains, and any scope with subtickets to be delegated to a child orchestrator

* add a coordinator-control finding if a parent orchestrator directly manages leaf subtickets or leaf implementers inside a child-orchestrator scope instead of orchestrating the child orchestrator

* require orchestrator-created Codex threads to use canonical titles shaped as `<role>: [<issue>] <description>`

* add a coordinator-control finding if an orchestrator creates a child orchestrator as a subagent or records a child orchestrator only by subagent id

* require active orchestrator-owned management and watcher state to be captured in `~/.agents/projects/{{project_name}}/goals/*.mdscript.md`; add a coordinator-control finding when an active project lane has no goal MDScript unless the lane is terminal, explicitly paused, or handed off

* require monitored or resumable coordinator lanes to carry a goal MDScript re-entry; add a coordinator-control finding when every resume rereads and renarrates Gabe context, Agent Adventures context, event contracts, watcher rules, and ledger rules before acting on the changed state

* require any Gabe MDScript workflow prompt to write an executable return script under `~/.agents/projects/{{project_name}}/returns` before asking for input, and to end the user-facing prompt with the exact `mdscript-exec` resume command

* add a coordinator-control finding when a blocker, authority-boundary stop, or decision-ready question has no `{{return_script}}`, no `{{return_resume_command}}`, or a stop report whose `resume_command` cannot resume the saved caller heading

* flag more than five active direct lanes under one coordinator unless work is split by repository, ticket group, system boundary, incident area, or release train into child orchestrators

* after compaction, resume, handoff, or interruption
  * require live lane refresh before steering workers or reporting readiness

* require cross-thread `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` events to be reported as exact MDScript executions in `{{event_exec}}` and to trigger the required owner response rather than becoming passive status

* add a coordinator-control finding if `DISPOSITION_READY` is reported as a bare label or treated as watcher context instead of executing `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`, starting disposition, or receiving explicit root denial

* add a coordinator-control finding if `TARGET_DRIFT` is reported as a bare label or does not execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`, interrupt old-target proof, and force current-target refresh or an exact blocker within one watcher cycle

* add a coordinator-control finding if `HANDOFF_UNACKED` is reported as a bare label or remains silent after one watcher cycle instead of executing `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked` and escalating to the parent/root

* add a coordinator-control finding if `STALE_MR` is reported as a bare label or repeats old-head proof after target-consume instructions without executing `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`, head movement, or exact blocker path

* if coordinator cannot name every active lane's owner, parent agent, state, blocker, next proof, next check, and reporting path from durable state
  * set `{{grade}}` to `Not ready`
  * add a coordinator-control finding
