<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Classify Work

* infer `{{objective}}`, `{{affected_system}}`, `{{tracker}}`, `{{repository}}`, `{{scope_shape}}`, `{{subtickets}}`, `{{done_state}}`, `{{claim_scope}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{missing_precondition}}`, `{{authority_needed}}`, `{{proof_needed}}`, `{{file_task_id}}`, `{{file_comment_path}}`, and `{{reporting_path}}`
* refresh the current source of truth before delegating or deciding
* [Load Project File Sources](#load-project-file-sources)

## Load Project File Sources

* if `~/.agents/projects/{{project_name}}/tasks` exists
  * treat task, comment, plan, goal, and instruction MDScripts plus `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` as the first source of truth for lane state
  * mirror to external trackers only after the file comment has been written
  * run [Classify File Workstream Fanout](../../gabe-common/workflows/file-task-comments.md#classify-file-workstream-fanout) before choosing a direct implementer lane
  * run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript) before child-lane fanout or monitor ownership
  * resolve `{{goal_mdscript}}` from the written goal path when a goal was written
  * add or refresh the parent-visible context checkpoint and resume comments before long child-lane fanout when resumed coordination may be needed
* if work is tied to Shipyard
  * use the ticket key prefix for worker title and branch names
  * do not invent a ticket key
* [Route Work Shape](#route-work-shape)

## Route Work Shape

* if this is a project control-plane workflow and the task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * create child-orchestrator file tasks for those workstreams before any direct root implementer
  * create or refresh one MDScript goal under `~/.agents/projects/{{project_name}}/goals` for the root orchestrator and each child orchestrator before any child implementer starts
  * resolve `{{goal_mdscript}}` from the root goal path
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.md#create-child-orchestrator-thread)
* if the work is an epic, milestone, project, portfolio, program, parent tracker item, release train, or any scope with subtickets, child issues, child MRs, or independently owned objectives
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.md#create-child-orchestrator-thread)
* if the work is narrow non-code coordination, writing, triage, instruction, publication, or decision work that can be completed safely in the root
  * [Execute Coordinator Work](execute-coordinator-work.md#execute-coordinator-work)
* if the work is one bounded execution lane with one primary repository, ticket, MR/PR, implementation objective, or verification boundary
  * [Create Implementer Lane](create-implementer-lane.md#create-implementer-lane)
* if the work spans multiple repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives that need their own lane ledger
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.md#create-child-orchestrator-thread)
* if another direct lane would put this orchestrator above five active direct lanes
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.md#create-child-orchestrator-thread)
* if this is a project control-plane workflow and required child orchestrator and implementer task files already exist
  * run [Use Single Process Fallback](../../gabe-common/workflows/file-task-comments.md#use-single-process-fallback)
  * execute locally authorized implementer work rather than waiting for unavailable workers
  * stop after the local execution path starts
* stop and report that work shape could not be classified
