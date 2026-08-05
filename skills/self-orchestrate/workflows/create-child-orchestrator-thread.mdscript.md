<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Child Orchestrator Thread

* create a child orchestrator only when the delegated work is coordination work rather than a single bounded implementation lane
* if the work is a single bounded implementation lane
  * stop and return to [Create Implementer Lane](create-implementer-lane.mdscript.md#create-implementer-lane)
* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* [Decide Child Orchestrator Need](#decide-child-orchestrator-need)

## Decide Child Orchestrator Need

* if the scope is an epic, milestone, project, portfolio, program, parent tracker item, release train, or has subtickets, child issues, child MRs, or independently owned objectives
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if the work spans multiple repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives that need their own lane ledger
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if another direct lane would put this orchestrator above five active direct lanes
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if this is a project control-plane workflow and the parent task names multiple independent workstreams
  * plan one child-orchestrator file task per workstream before any leaf implementer starts
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* stop and report that a child orchestrator is not required for this scope

## Search Existing Child Orchestrator

* search `~/.agents/projects/{{project_name}}/tasks` for an existing live child-orchestrator task for `{{affected_system}}`, repository group, ticket group, release train, incident area, or system boundary
* search for an existing live orchestrator Codex thread for the same boundary when thread tooling is available
* if an existing child owns that coordination boundary and can keep its lane ledger clean
  * reuse that child orchestrator
  * [Select Child Model And Reasoning](#select-child-model-and-reasoning)
* [Select Child Model And Reasoning](#select-child-model-and-reasoning)

## Select Child Model And Reasoning

* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `orchestrator`
* if an existing child cannot be verified or resumed with `{{required_model}}` and `{{required_reasoning}}`
  * set `{{blocker}}` to the model or reasoning mismatch
  * [Stop On Child Blocker](#stop-on-child-blocker)
* [Create Child File Task](#create-child-file-task)

## Create Child File Task

* set `{{role_thread_title}}` to `<role>: [<issue>] <description>` using `orchestrator` for role, the tracker key, ticket group, MR/PR id, incident id, or `portfolio` for issue, and a short human description
* name child task ids as `<parent>-<workstream>-orchestrator` and set each child task's `parent` to the parent task id
* run [Ensure File Task](../../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task) for the child orchestrator with `type: child-orchestrator`
* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript) for the child orchestrator
* resolve `{{goal_mdscript}}` from the child goal path written above
* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) on the parent task with the child handoff contract
* [Create Or Resume Child Thread](#create-or-resume-child-thread)

## Create Or Resume Child Thread

* before creating a child thread, list or search existing threads on the available thread-management surface
* create child orchestrators as durable file tasks first, and as durable Codex threads when the surface supports threads
* do not use subagents as child orchestrators
* if thread creation tooling is unavailable
  * continue with the child-orchestrator file task as the durable lane
  * record `thread_tooling: unavailable` in the file comment and lane ledger
  * run [Use Single Process Fallback](../../self-common/workflows/file-task-comments.mdscript.md#use-single-process-fallback) when the child lane can execute locally in the current run
  * [Write Child Handoff Contract](#write-child-handoff-contract)
* create or resume the child orchestrator with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`
* record cleanup ownership for the created child thread in `~/.agents/projects/{{project_name}}/lane-ledger.jsonl`
* [Write Child Handoff Contract](#write-child-handoff-contract)

## Write Child Handoff Contract

* instruct the child coordinator to use `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#load-operating-context`
* give the child systems or repositories, tracker scope, parent issue, file task id, file comment path, subticket inventory, authority boundaries, lane cap, required ledger fields, proof expectations, implementer-owned review expectations, watcher expectations, reporting cadence, parent agent, parent reporting path, escalation path, and no-default-branch-merge limits
* include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}` in the handoff
* require the child to report back to this parent before stopping for any reason
* require the child to create or maintain `{{goal_mdscript}}` after its first context read for `/mdscript-exec {{goal_mdscript}}#resume-goal` resumes
* require orchestrator-owned management and watcher state to live in the goal MDScript while any owned lane is active, blocked, waiting, or carrying an open handoff
* require the child to report active lanes, blocked lanes, ready decisions, goal state, next proof, and exact authority needed
* require the child to clean up worker, reviewer, or child chat threads it creates when terminal or superseded, and to report cleanup status before stopping
* require the child to execute and report matching `{{event_exec}}` for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR` via [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
* require the child to own subticket-to-implementer delegation, subticket lane ledgers, and subticket goal setup inside its scope
* [Verify Child Handoff Contract](#verify-child-handoff-contract)

## Verify Child Handoff Contract

* verify the child file task exists with `type: child-orchestrator` and correct parent id
* verify `{{goal_mdscript}}` exists and names a resume heading
* verify the parent file comment records the child handoff contract
* verify the handoff names parent agent, parent reporting path, model, reasoning, and cleanup ownership
* if any required handoff field is missing
  * set `{{blocker}}` to the missing child handoff field
  * [Repair Child Handoff Contract](#repair-child-handoff-contract)
* keep this parent ledger entry and file comments at the child-orchestrator level unless the child escalates a decision, permission, or proof boundary
* if this is a project control-plane workflow and the child can immediately create its implementer task or execute a bounded local handoff
  * write the child role-switch comment
  * continue into the child handoff without stopping
* [Finalize Child Create](#finalize-child-create)

## Repair Child Handoff Contract

* rewrite the missing handoff fields into the child task, goal, and parent file comment
* resolve `{{goal_mdscript}}` again from the child goal path
* [Verify Child Handoff Contract](#verify-child-handoff-contract)

## Finalize Child Create

* update the ledger with [Maintain Lane Ledger](../../self-common/workflows/lane-ledger.mdscript.md#maintain-lane-ledger)
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Stop On Child Blocker

* if the caller will ask the user, a repository owner, or another authority surface for a different model, runner, or handoff decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state
* stop and report `Blocked for {{claim_scope}}: {{blocker}}`
