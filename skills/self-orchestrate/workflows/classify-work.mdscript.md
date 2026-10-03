<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Classify Work

* find these values in the input and the current state:
  * `{{objective}}`, `{{affected_system}}`, `{{tracker}}`, `{{repository}}`, `{{scope_shape}}`, `{{subtickets}}`, and `{{done_state}}`
  * `{{claim_scope}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, and `{{proof_path}}`
  * `{{local_resource_path}}`, `{{missing_precondition}}`, `{{authority_needed}}`, and `{{proof_needed}}`
  * `{{file_task_id}}`, `{{file_comment_path}}`, and `{{reporting_path}}`
* before you delegate or decide, refresh the current source of truth
* [Load Project File Sources](#load-project-file-sources)

## Load Project File Sources

* if `~/.agents/projects/{{project_name}}/tasks` exists
  * use the task, comment, plan, goal, and instruction MDScripts as the first source of truth for lane state
  * use `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` as part of that first source of truth
  * mirror to external trackers only after you write the file comment
  * before you select a direct implementer lane, run [Classify File Workstream Fanout](../../self-common/workflows/file-task-comments.mdscript.md#classify-file-workstream-fanout)
  * before child-lane fanout or monitor ownership, run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
  * if you wrote a goal
    * set `{{goal_mdscript}}` to the written goal path
  * if resumed coordination can be necessary
    * before long child-lane fanout, add or refresh the parent-visible context checkpoint and resume comments
* if the work is tied to Shipyard
  * use the ticket key prefix for worker titles and branch names
  * do not invent a ticket key
* [Route Work Shape](#route-work-shape)

## Route Work Shape

* if a project control-plane task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * before a direct root implementer starts, create child-orchestrator file tasks for those workstreams
  * before a child implementer starts, create or refresh one MDScript goal under `~/.agents/projects/{{project_name}}/goals` for each orchestrator
  * include the root orchestrator and each child orchestrator
  * set `{{goal_mdscript}}` to the root goal path
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if the work is an epic, milestone, project, portfolio, program, parent tracker item, or release train
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if the work has subtickets, child issues, child MRs, or independently owned objectives
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if the work is narrow non-code work for coordination, text, triage, instructions, publication, or a decision
  * if the root can safely complete the work
    * [Execute Coordinator Work](execute-coordinator-work.mdscript.md#execute-coordinator-work)
* if the work is one bounded execution lane with one primary repository, ticket, MR/PR, implementation objective, or proof boundary
  * [Create Implementer Lane](create-implementer-lane.mdscript.md#create-implementer-lane)
* if the work spans many repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives
  * if these parts need their own lane ledger
    * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if one more direct lane would put this orchestrator above five active direct lanes
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if this is a project control-plane workflow and the necessary child orchestrator and implementer task files already exist
  * run [Use Single Process Fallback](../../self-common/workflows/file-task-comments.mdscript.md#use-single-process-fallback)
  * execute the locally authorized implementer work
  * do not wait for workers that are not available
  * after the local execution path starts, stop
* report that the work shape is not classified
* stop
