<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Classify Work

* infer `{{objective}}`, `{{affected_system}}`, `{{tracker}}`, `{{repository}}`, `{{scope_shape}}`, `{{subtickets}}`, `{{done_state}}`, `{{claim_scope}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{missing_precondition}}`, `{{authority_needed}}`, `{{proof_needed}}`, `{{file_task_id}}`, `{{file_comment_path}}`, and `{{reporting_path}}`

* refresh the current source of truth before delegating or deciding

* when `~/.agents/projects/{{project_name}}/tasks` exists
  * treat task, comment, plan, goal, and instruction MDScripts plus `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` as the first source of truth for lane state
  * mirror to external trackers only after the file comment has been written
  * run [Classify File Workstream Fanout](../../gabe-common/workflows/file-task-comments.md#classify-file-workstream-fanout) before choosing a direct implementer lane
  * run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript) before child-lane fanout or monitor ownership
  * add or refresh the parent-visible context checkpoint and resume comments before long child-lane fanout when resumed coordination may be needed

* if work is tied to Shipyard
  * use the ticket key prefix for worker title and branch names
  * do not invent a ticket key

* if this is a project control-plane workflow and the task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * create child-orchestrator file tasks for those workstreams before any direct root implementer
  * create or refresh one MDScript goal under `~/.agents/projects/{{project_name}}/goals` for the root orchestrator and each child orchestrator before any child implementer starts
  * each child orchestrator may create one bounded implementer task for its own scope
  * after the child task files and parent handoff comments exist, continue locally with single-process fallback when durable worker thread tooling is unavailable

* if the work is an epic, milestone, project, portfolio, program, parent tracker item, release train, or any scope with subtickets, child issues, child MRs, or independently owned objectives
  * [Create Child Orchestrator](../SKILL.md#create-child-orchestrator)

* if the work is narrow non-code coordination, writing, triage, instruction, publication, or decision work that can be completed safely in the root
  * [Execute Coordinator Work](../SKILL.md#execute-coordinator-work)

* if the work is one bounded execution lane with one primary repository, ticket, MR/PR, implementation objective, or verification boundary
  * [Create Implementer Lane](../SKILL.md#create-implementer-lane)

* if the work spans multiple repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives that need their own lane ledger
  * [Create Child Orchestrator](../SKILL.md#create-child-orchestrator)

* if another direct lane would put this orchestrator above five active direct lanes
  * [Create Child Orchestrator](../SKILL.md#create-child-orchestrator)

* in a project control-plane workflow, once required child orchestrator and implementer task files exist, execute locally authorized implementer work through [Use Single Process Fallback](../../gabe-common/workflows/file-task-comments.md#use-single-process-fallback) rather than waiting for unavailable workers
