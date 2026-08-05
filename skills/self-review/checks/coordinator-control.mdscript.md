<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Coordinator Control

* read [Coordinator Control Policy](../references/coordinator-control-policy.md)
* if the artifact coordinates multiple lanes
  * inspect the durable lane ledger for thread id, goal MDScript when monitored or resumable, `/mdscript-exec` re-entry command, owner, parent agent, repository or system, issue/PR/MR, referenced tickets, agent identities, phase, event execution, event type, stop reason when stopping, next proof, blocker, next check, and reporting path
  * for each missing applicable ledger field
    * add a coordinator-control finding with consequence and evidence pointer
* inspect whether root and coordinating agent threads keep code implementation and code-review ownership in durable implementer lanes
* if a root or coordinating thread owns implementation or code review
  * add a coordinator-control finding with consequence and evidence pointer
* inspect whether every child orchestrator, implementer, reviewer, and goal-resumed agent lane reported back to its parent agent or parent reporting path before stopping
* if a child lane is terminal, paused, blocked, obsolete, interrupted, watcher-terminal, closed, deleted, or archived without a parent-visible stop report
  * add a coordinator-control finding with consequence and evidence pointer
* if a child orchestrator that owns coordination scope, lane ledgers, goal setup, or handoffs is a subagent rather than a durable Codex thread or file-task child lane
  * add a coordinator-control finding with consequence and evidence pointer
* if an epic, milestone, project, portfolio, program, parent tracker item, release train, or scope with subtickets was not delegated to a child orchestrator
  * add a coordinator-control finding with consequence and evidence pointer
* if a parent orchestrator directly manages leaf subtickets or leaf implementers inside a child-orchestrator scope
  * add a coordinator-control finding with consequence and evidence pointer
* if an orchestrator-created Codex thread title is not shaped as `<role>: [<issue>] <description>`
  * add a coordinator-control finding with consequence and evidence pointer
* if an orchestrator creates a child orchestrator as a subagent or records a child orchestrator only by subagent id
  * add a coordinator-control finding with consequence and evidence pointer
* [Check Goal And Prompt Surfaces](#check-goal-and-prompt-surfaces)

## Check Goal And Prompt Surfaces

* if an active project lane has no goal MDScript under `~/.agents/projects/{{project_name}}/goals/*.mdscript.md` and the lane is not terminal, explicitly paused, or handed off
  * add a coordinator-control finding with consequence and evidence pointer
* if a monitored or resumable coordinator lane lacks a goal MDScript re-entry
  * add a coordinator-control finding with consequence and evidence pointer
* if every resume rereads and renarrates skill context, event contracts, watcher rules, and ledger rules before acting on the changed state
  * add a coordinator-control finding with consequence and evidence pointer
* if an agent MDScript workflow prompt asks for input without writing an executable return script under `~/.agents/projects/{{project_name}}/returns`
  * add a coordinator-control finding with consequence and evidence pointer
* if a user-facing prompt does not end with the exact `mdscript-exec` resume command
  * add a coordinator-control finding with consequence and evidence pointer
* if a blocker, authority-boundary stop, or decision-ready question has no `{{return_script}}`, no `{{return_resume_command}}`, or a stop report whose `resume_command` cannot resume the saved caller heading
  * add a coordinator-control finding with consequence and evidence pointer
* if more than five active direct lanes exist under one coordinator without a split by repository, ticket group, system boundary, incident area, or release train into child orchestrators
  * add a coordinator-control finding with consequence and evidence pointer
* if the work followed compaction, resume, handoff, or interruption
  * inspect for live lane refresh before steering workers or reporting readiness
  * if live lane refresh is missing
    * add a coordinator-control finding with consequence and evidence pointer
* [Check Event Executions](#check-event-executions)

## Check Event Executions

* inspect whether cross-thread `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` events are reported as exact MDScript executions in `{{event_exec}}`
* if `DISPOSITION_READY` is reported as a bare label or treated as watcher context instead of executing `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
  * add a coordinator-control finding with consequence and evidence pointer
* if `TARGET_DRIFT` is reported as a bare label or does not execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
  * add a coordinator-control finding with consequence and evidence pointer
* if `HANDOFF_UNACKED` is reported as a bare label or remains silent after one watcher cycle instead of executing `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked`
  * add a coordinator-control finding with consequence and evidence pointer
* if `STALE_MR` is reported as a bare label or repeats old-head proof after target-consume instructions without executing `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr`
  * add a coordinator-control finding with consequence and evidence pointer
* if the coordinator cannot name every active lane's owner, parent agent, state, blocker, next proof, next check, and reporting path from durable state
  * set `{{grade}}` to `Not ready`
  * add a coordinator-control finding with consequence and evidence pointer
  * return to the caller
* return to the caller
