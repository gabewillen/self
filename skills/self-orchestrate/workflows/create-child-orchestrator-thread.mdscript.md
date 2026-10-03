<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Child Orchestrator Thread

* create a child orchestrator only for delegated coordination work, not for a single bounded implementation lane
* if the work is a single bounded implementation lane
  * stop and return to [Create Implementer Lane](create-implementer-lane.mdscript.md#create-implementer-lane)
* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* [Decide Child Orchestrator Need](#decide-child-orchestrator-need)

## Decide Child Orchestrator Need

* if the scope is an epic, milestone, project, portfolio, program, parent tracker item, or release train
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if the scope has subtickets, child issues, child MRs, or independently owned objectives
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if the work spans many repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives
  * if these parts need their own lane ledger
    * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if one more direct lane would put this orchestrator above five active direct lanes
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* if this is a project control-plane workflow and the parent task names many independent workstreams
  * before a leaf implementer starts, plan one child-orchestrator file task for each workstream
  * [Search Existing Child Orchestrator](#search-existing-child-orchestrator)
* report that this scope does not need a child orchestrator
* stop

## Search Existing Child Orchestrator

* search `~/.agents/projects/{{project_name}}/tasks` for a live child-orchestrator task that already exists for the same boundary
  * include `{{affected_system}}`, repository groups, ticket groups, release trains, incident areas, and system boundaries as boundaries
* if thread tools are available
  * search for a live orchestrator Codex thread that already exists for the same boundary
* if an existing child owns that coordination boundary and can keep its lane ledger clean
  * use that child orchestrator again
  * [Select Child Model And Reasoning](#select-child-model-and-reasoning)
* [Select Child Model And Reasoning](#select-child-model-and-reasoning)

## Select Child Model And Reasoning

* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `orchestrator`
* if you cannot examine or resume an existing child with `{{required_model}}` and `{{required_reasoning}}`
  * set `{{blocker}}` to the model or reasoning mismatch
  * [Stop On Child Blocker](#stop-on-child-blocker)
* [Create Child File Task](#create-child-file-task)

## Create Child File Task

* set `{{role_thread_title}}` to `<role>: [<issue>] <description>`
  * use `orchestrator` for role
  * use the tracker key, ticket group, MR/PR id, incident id, or `portfolio` for issue
  * use a short human description for description
* name each child task id as `<parent>-<workstream>-orchestrator`
* set the `parent` of each child task to the parent task id
* run [Ensure File Task](../../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task) for the child orchestrator with `type: child-orchestrator`
* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript) for the child orchestrator
* set `{{goal_mdscript}}` to the child goal path that you wrote
* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) on the parent task with the child handoff contract
* [Create Or Resume Child Thread](#create-or-resume-child-thread)

## Create Or Resume Child Thread

* before you create a child thread, list or search the existing threads on the available thread-management surface
* create each child orchestrator as a durable file task first
* if the surface supports threads, also create the child orchestrator as a durable Codex thread
* do not use subagents as child orchestrators
* if no thread creation tools are available
  * continue with the child-orchestrator file task as the durable lane
  * record `thread_tooling: unavailable` in the file comment and the lane ledger
  * if the child lane can execute locally in the current run
    * run [Use Single Process Fallback](../../self-common/workflows/file-task-comments.mdscript.md#use-single-process-fallback)
  * [Write Child Handoff Contract](#write-child-handoff-contract)
* create or resume the child orchestrator with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`
* record the cleanup ownership for the created child thread in `~/.agents/projects/{{project_name}}/lane-ledger.jsonl`
* [Write Child Handoff Contract](#write-child-handoff-contract)

## Write Child Handoff Contract

* tell the child coordinator to use `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#load-operating-context`
* give the child these items:
  * the systems or repositories, the tracker scope, the parent issue, the file task id, and the file comment path
  * the subticket inventory, the authority boundaries, the lane cap, and the necessary ledger fields
  * the proof expectations, the implementer-owned review expectations, the watcher expectations, and the report cadence
  * the parent agent, the parent reporting path, the escalation path, and the no-default-branch-merge limits
* include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}` in the handoff
* tell the child to report back to this parent before it stops for any reason
* tell the child to create or maintain `{{goal_mdscript}}` after its first context read, for `/mdscript-exec {{goal_mdscript}}#resume-goal` resumes
* while an owned lane is active, blocked, waiting, or has an open handoff
  * tell the child to keep the orchestrator-owned management and watcher state in the goal MDScript
* tell the child to report active lanes, blocked lanes, ready decisions, goal state, next proof, and the exact authority needed
* tell the child to clean up each terminal or superseded worker, reviewer, or child chat thread that it creates
* tell the child to report the cleanup status before it stops
* tell the child to execute and report the `{{event_exec}}` that matches `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
  * use [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts) for these events
* tell the child to own subticket-to-implementer delegation, subticket lane ledgers, and subticket goal setup in its scope
* [Verify Child Handoff Contract](#verify-child-handoff-contract)

## Verify Child Handoff Contract

* make sure that the child file task exists with `type: child-orchestrator` and the correct parent id
* make sure that `{{goal_mdscript}}` exists and names a resume heading
* make sure that the parent file comment records the child handoff contract
* make sure that the handoff names the parent agent, parent reporting path, model, reasoning, and cleanup ownership
* if a necessary handoff field is missing
  * set `{{blocker}}` to the missing child handoff field
  * [Repair Child Handoff Contract](#repair-child-handoff-contract)
* if the child does not escalate a decision, permission, or proof boundary
  * keep this parent ledger entry and the file comments at the child-orchestrator level
* if a project control-plane child can immediately create its implementer task or execute a bounded local handoff
  * write the child role-switch comment
  * continue into the child handoff
  * do not stop
* [Finalize Child Create](#finalize-child-create)

## Repair Child Handoff Contract

* write the missing handoff fields again into the child task, goal, and parent file comment
* set `{{goal_mdscript}}` again to the child goal path
* [Verify Child Handoff Contract](#verify-child-handoff-contract)

## Finalize Child Create

* change the ledger with [Maintain Lane Ledger](../../self-common/workflows/lane-ledger.mdscript.md#maintain-lane-ledger)
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Stop On Child Blocker

* if the caller asks the user, a repository owner, or an authority surface for a model, runner, or handoff decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the stop-boundary state of the caller
* report `Blocked for {{claim_scope}}: {{blocker}}`
* stop
