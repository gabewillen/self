<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Resolve Goal MDScript

* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)

* set `{{goal_dir}}` to `{{file_task_root}}/goals`

* set `{{goal_id}}` to a stable slug from `{{file_task_id}}` plus the orchestration purpose, such as `<task-id>-goal`

* set `{{goal_mdscript}}` to `{{goal_dir}}/{{goal_id}}.mdscript.md`

* create `{{goal_dir}}` before writing a goal

## Write Goal MDScript

* write or refresh one executable MDScript goal file for every orchestrator-owned active lane before creating child lanes, handoffs, monitor loops, or resumed coordination

* every `root-orchestrator` and `child-orchestrator` task must have a matching goal MDScript before that orchestrator creates implementer lanes or reports that the lane is resumable

* when a parent fanout creates multiple child-orchestrator file tasks in one pass, create the child goal MDScript files in the same pass before executing any child implementer work

* prefer `python3 scripts/gabe_task.py goal` when it exists; otherwise write the same `~/.agents/projects/{{project_name}}/goals/<goal-id>.mdscript.md` file directly

* the goal file must include YAML front matter with:
  * `id`
  * `task_id`
  * `owner_role`
  * `status`
  * `claim_scope`
  * `goal_type`
  * `source_of_truth`
  * `model`
  * `reasoning`
  * `model_selection_basis`
  * `created_at`
  * `updated_at`

* the goal body must start with the MDScript comment header and include these headings:
  * `Goal Contract`
  * `Resume Goal`
  * `Hot Path`
  * `Stop`

* put the objective, scoped done state, source of truth, parent reporting path, claim scope, contract preconditions, postconditions, invariants, proof path, local resource path, lane ledger keys, `model`, `reasoning`, `model_selection_basis`, exact role continuation jumps, exact event `event_exec` values, stop/report conditions, and authority boundaries in the goal

* when a goal may pause to ask Gabe, the user, a repository owner, or another authority surface for input, put the pending decision field, `{{return_script}}`, `{{return_resume_command}}`, and the caller heading that resumes after the answer into the goal

* put cleanup ownership for created chat threads, child threads, reviewer threads, worker threads, and subagents in the goal when the lane may create them

* use goals as the durable re-entry surface for orchestrator coordination; do not create or require orchestrator-owned automations for project control-plane lanes unless the user explicitly asks for an external automation

* if this environment exposes a goal API for the current agent, mirror the MDScript goal objective into that API only after the project goal file exists under `~/.agents/projects/{{project_name}}/goals`; the file remains the source of truth

* add a parent-visible file comment that names the goal file, owner role, next `/mdscript-exec {{goal_mdscript}}#resume-goal` command, and stop condition

* for long-running or multi-workstream lanes, write two parent-visible comments after the goal file exists and before the next long phase or child fanout: first a `context-limit` checkpoint with `stop_reason=context-limit`, then after rebuilding from file state a separate `compaction-resume` marker with `resumed=true`; include the goal file, task file, comments directory, lane ledger, next owner, and the exact resume command `/mdscript-exec {{goal_mdscript}}#resume-goal`

## Resume Goal

* on resumed coordination, child-lane heartbeat, monitor turn, or post-compaction continuation, execute `/mdscript-exec {{goal_mdscript}}#resume-goal` first when the goal file exists and still names the current lane

* validate the goal's recorded `model`, `reasoning`, and `model_selection_basis` against [Select Configured Model And Reasoning](model-reasoning-contract.md#select-configured-model-and-reasoning) before resuming the role

* if the recorded role configuration is missing or invalid, stop and report the exact model-contract blocker

* refresh current repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state only after reading the goal

* do not reread or narrate full Gabe, automation, watcher, and ledger context when the goal MDScript already captures the active contract

* if a new human correction, scope change, project change, or source-of-truth conflict invalidates the goal, update the goal MDScript before acting

* if a resumed goal was entered through a return script, apply the returned answer to the saved pending decision before refreshing live state or re-running the caller workflow

## Goal Stop Boundary

* when the goal's stop condition is reached, write a parent-visible file comment and update the goal status to `done`, `blocked`, `paused`, `obsolete`, or the closest exact terminal state

* when a root orchestrator reaches a terminal scoped claim, write the root task's final parent-visible comment before any final chat response; include exact stop-report fields `stop_reason=done`, `next_owner=none`, `proof_supplied=...`, `proof_not_claimed=...`, `remaining_authority_boundary=...`, `cleanup_status=...`, and `blocker=...`

* the terminal goal comment must explicitly name or resolve any handled stale review, target drift, reviewer disagreement, or other unexpected parent-visible input that affected the proof path

* the terminal goal comment must include cleanup status for created terminal or superseded chat threads, or an exact cleanup blocker and next owner

* do not leave an active goal after the scoped claim is terminal unless another granted action remains and is written into the goal

* do not use an automation, reminder, or recurring watcher as a substitute for the project control-plane goal MDScript
