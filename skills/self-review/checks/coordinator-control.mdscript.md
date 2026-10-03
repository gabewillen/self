<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Coordinator Control

* read [Coordinator Control Policy](../references/coordinator-control-policy.md)
* if the artifact coordinates more than one lane
  * examine the durable lane ledger for the thread id, owner, parent agent, and reporting path
  * examine the ledger for the goal MDScript when the lane is monitored or resumable
  * examine the ledger for the `/mdscript-exec` re-entry command
  * examine the ledger for the repository or system, the issue/PR/MR, the referenced tickets, and the agent identities
  * examine the ledger for the phase, event execution, event type, next proof, blocker, and next check
  * if the lane stopped
    * examine the ledger for the stop reason
  * for each applicable ledger field that is missing
    * add a coordinator-control finding with the consequence and an evidence pointer
* examine whether durable implementer lanes, not root or coordinating threads, own code implementation and code review
* if a root or coordinating thread owns implementation or code review
  * add a coordinator-control finding with the consequence and an evidence pointer
* examine each child orchestrator, implementer, reviewer, and goal-resumed agent lane
* examine whether each of these lanes reported to its parent agent or parent reporting path before it stopped
* if a child lane has no parent-visible stop report
  * if the lane is terminal, paused, blocked, obsolete, interrupted, watcher-terminal, closed, deleted, or archived
    * add a coordinator-control finding with the consequence and an evidence pointer
* if a child orchestrator owns coordination scope, lane ledgers, goal setup, or handoffs
  * if that child orchestrator is a subagent, not a durable Codex thread or file-task child lane
    * add a coordinator-control finding with the consequence and an evidence pointer
* if the orchestrator did not delegate an epic, milestone, project, portfolio, or program to a child orchestrator
  * add a coordinator-control finding with the consequence and an evidence pointer
* if the orchestrator did not delegate a parent tracker item, release train, or other subticket scope to a child orchestrator
  * add a coordinator-control finding with the consequence and an evidence pointer
* if a parent orchestrator directly manages leaf subtickets or leaf implementers inside a child-orchestrator scope
  * add a coordinator-control finding with the consequence and an evidence pointer
* if the title of an orchestrator-created Codex thread does not have the shape `<role>: [<issue>] <description>`
  * add a coordinator-control finding with the consequence and an evidence pointer
* if an orchestrator creates a child orchestrator as a subagent, or records it only by subagent id
  * add a coordinator-control finding with the consequence and an evidence pointer
* [Check Goal And Prompt Surfaces](#check-goal-and-prompt-surfaces)

## Check Goal And Prompt Surfaces

* if an active project lane has no goal MDScript under `~/.agents/projects/{{project_name}}/goals/*.mdscript.md`
  * if the lane is not terminal, explicitly paused, or handed off
    * add a coordinator-control finding with the consequence and an evidence pointer
* if a monitored or resumable coordinator lane has no goal MDScript re-entry
  * add a coordinator-control finding with the consequence and an evidence pointer
* if each resume reads and repeats the skill context, event contracts, watcher rules, and ledger rules
  * if the resume does this before it acts on the changed state
    * add a coordinator-control finding with the consequence and an evidence pointer
* if an agent MDScript workflow prompt asks for input and does not write an executable return script under `~/.agents/projects/{{project_name}}/returns`
  * add a coordinator-control finding with the consequence and an evidence pointer
* if a user-facing prompt does not end with the exact `mdscript-exec` resume command
  * add a coordinator-control finding with the consequence and an evidence pointer
* if a blocker, authority-boundary stop, or decision-ready question has no `{{return_script}}` or no `{{return_resume_command}}`
  * add a coordinator-control finding with the consequence and an evidence pointer
* if the `resume_command` of a stop report cannot resume the saved caller heading
  * add a coordinator-control finding with the consequence and an evidence pointer
* if more than five active direct lanes are under one coordinator
  * if the coordinator did not divide the lanes by repository, ticket group, system boundary, incident area, or release train
    * add a coordinator-control finding with the consequence and an evidence pointer
* if the work came after compaction, resume, handoff, or interruption
  * examine the work for a live lane refresh before it steered workers or reported readiness
  * if the live lane refresh is missing
    * add a coordinator-control finding with the consequence and an evidence pointer
* [Check Event Executions](#check-event-executions)

## Check Event Executions

* examine whether the cross-thread `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` events are exact MDScript executions in `{{event_exec}}`
* if `DISPOSITION_READY` is a bare label or watcher context and does not execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
  * add a coordinator-control finding with the consequence and an evidence pointer
* if `TARGET_DRIFT` is a bare label or does not execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
  * add a coordinator-control finding with the consequence and an evidence pointer
* if `HANDOFF_UNACKED` is a bare label or stays silent after one watcher cycle
  * if it does not execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked`
    * add a coordinator-control finding with the consequence and an evidence pointer
* if `STALE_MR` is a bare label or repeats old-head proof after target-consume instructions
  * if it does not execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr`
    * add a coordinator-control finding with the consequence and an evidence pointer
* if the coordinator cannot name the owner, parent agent, and state of each active lane from durable state
  * set `{{grade}}` to `Not ready`
  * add a coordinator-control finding with the consequence and an evidence pointer
  * return to the caller
* if the coordinator cannot name the blocker, next proof, next check, and reporting path of each active lane
  * set `{{grade}}` to `Not ready`
  * add a coordinator-control finding with the consequence and an evidence pointer
  * return to the caller
* return to the caller
