<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Goal MDScript

* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* set `{{goal_id}}` to a stable slug from `{{file_task_id}}` and the purpose, for example `<task-id>-goal`
* set `{{goal_mdscript}}` to `{{goal_dir}}/{{goal_id}}.mdscript.md`

## Write Goal MDScript

* run [Resolve Goal MDScript](#resolve-goal-mdscript)
* the goal MDScript is the running log of its lane
  * change `## Done So Far` and `## Next Steps` at each round that changes what is true
* write one goal for each active lane that an orchestrator owns, before child lanes, handoffs, or monitor loops
  * if a fanout creates child orchestrators, write their goals in the same pass
* write it from the [goal template](../templates/goal.mdscript.md)
* make sure that it has the execution header, the template front matter, executable bullets, and `## Goal Contract`, `## Resume Goal`, `## Hot Path`, and `## Stop`
* make sure that `/mdscript-exec {{goal_mdscript}}#resume-goal` resolves
* if a check fails, repair it one time, then stop and report the missing parts
* run [Add File Comment](file-task-comments.mdscript.md#add-file-comment) as a parent-visible comment
  * name the goal file, the owner role, the resume command, and the stop condition
* for a long or multi-workstream lane, add a parent-visible `context-limit` checkpoint before the next long phase
* if the host has a goal API, copy the objective into it after the file exists
* return to the caller

## Resume Goal

* run `/mdscript-exec {{goal_mdscript}}#resume-goal` first
* if the recorded `model`, `reasoning`, or `model_selection_basis` is missing, stop and report it
* if a return script started this resume, apply its answer to the pending decision
* get the live repo, tracker, PR, CI, review, and proof state again
* do not read the full skill stack again when the goal holds the contract
* if a new user correction or a scope change makes the goal wrong
  * run [Write Goal MDScript](#write-goal-mdscript)
  * stop and report the change before you act
* after a rebuild from file state, add a parent-visible `compaction-resume` comment with `resumed=true`
* return to the caller

## Goal Stop Boundary

* when the stop condition occurs, run [Add File Comment](file-task-comments.mdscript.md#add-file-comment) as a parent-visible comment with the [stop-report fields](../references/stop-report-fields.md)
* set the goal status to `done`, `blocked`, `paused`, or `obsolete`
* for a terminal root claim, write the final root comment before the final chat reply
* name how you handled each input that changed the proof path
* name the cleanup status of each thread that you created
* if a granted action remains, write it in the goal, and keep the goal active
* otherwise do not leave the goal active
* return to the caller
