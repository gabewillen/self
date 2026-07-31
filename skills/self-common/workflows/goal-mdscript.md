<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Goal MDScript

* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)
* set `{{goal_dir}}` to `{{file_task_root}}/goals`
* set `{{goal_id}}` to a stable slug from `{{file_task_id}}` plus the orchestration purpose, such as `<task-id>-goal`
* set `{{goal_mdscript}}` to `{{goal_dir}}/{{goal_id}}.mdscript.md`
* create `{{goal_dir}}` before writing a goal
  * if creation fails, stop and report the exact path and error

## Write Goal MDScript

* run [Resolve Goal MDScript](#resolve-goal-mdscript)
* read [goal contract](../references/goal-contract.md)
* read [goal template](../templates/goal.mdscript.md)
* before creating child lanes, handoffs, monitor loops, or resumed coordination, write or refresh one executable MDScript goal file for every orchestrator-owned active lane
* when a parent fanout creates multiple child-orchestrator file tasks in one pass, create the child goal MDScript files in the same pass before executing any child implementer work
* if `scripts/self_task.py` exists
  * run `python3 scripts/self_task.py goal`
  * if the command fails
    * write `{{goal_mdscript}}` directly from the template and contract
    * [Verify Goal MDScript](#verify-goal-mdscript)
* if `scripts/self_task.py` does not exist
  * write `{{goal_mdscript}}` from the template and contract
  * [Verify Goal MDScript](#verify-goal-mdscript)
* [Verify Goal MDScript](#verify-goal-mdscript)

## Verify Goal MDScript

* verify `{{goal_mdscript}}` has the exact MDScript execution header after YAML front matter
  * if missing, [Repair Goal MDScript](#repair-goal-mdscript)
* verify every required front-matter field from the contract is present
  * if any field is missing, [Repair Goal MDScript](#repair-goal-mdscript)
* verify exact body headings `## Goal Contract`, `## Resume Goal`, `## Hot Path`, and `## Stop` exist
  * if any heading is missing, [Repair Goal MDScript](#repair-goal-mdscript)
* verify each state body uses executable bullets rather than prose paragraphs
  * if a state is prose-only, [Repair Goal MDScript](#repair-goal-mdscript)
* verify `/mdscript-exec {{goal_mdscript}}#resume-goal` resolves to a real `## Resume Goal` state
  * if it does not resolve, [Repair Goal MDScript](#repair-goal-mdscript)
* run [Add File Comment](file-task-comments.md#add-file-comment) as a parent-visible comment naming the goal file, owner role, next `/mdscript-exec {{goal_mdscript}}#resume-goal` command, and stop condition
* for long-running or multi-workstream lanes, write a parent-visible `context-limit` checkpoint after the goal exists and before the next long phase or child fanout
* for long-running or multi-workstream lanes, after rebuilding from file state, write a separate parent-visible `compaction-resume` marker with `resumed=true`
* if a goal API exists for the current agent, mirror the MDScript goal objective into that API only after the project goal file exists
* return to the caller

## Repair Goal MDScript

* rewrite missing front-matter fields and required body states in `{{goal_mdscript}}` from the contract and template
* [Verify Goal MDScript](#verify-goal-mdscript)
* if verification still fails after one repair, stop and report the exact missing fields or headings

## Resume Goal

* on resumed coordination, child-lane heartbeat, monitor turn, or post-compaction continuation, execute `/mdscript-exec {{goal_mdscript}}#resume-goal` first when the goal file exists and still names the current lane
* validate the goal's recorded `model`, `reasoning`, and `model_selection_basis` against [Select Configured Model And Reasoning](model-reasoning-contract.md#select-configured-model-and-reasoning)
* if the recorded role configuration is missing or invalid
  * stop and report the exact model-contract blocker
* if a resumed goal was entered through a return script
  * apply the returned answer to the saved pending decision before refreshing live state
* refresh current repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state only after reading the goal
* do not reread or narrate full skill-pack, automation, watcher, and ledger context when the goal MDScript already captures the active contract
* if a new human correction, scope change, project change, or source-of-truth conflict invalidates the goal
  * run [Write Goal MDScript](#write-goal-mdscript)
  * stop and report that the goal was refreshed before acting
* return to the caller

## Goal Stop Boundary

* when the goal's stop condition is reached, run [Add File Comment](file-task-comments.md#add-file-comment) as a parent-visible file comment
* update the goal status to `done`, `blocked`, `paused`, `obsolete`, or the closest exact terminal state
* when a root orchestrator reaches a terminal scoped claim, write the root task's final parent-visible comment before any final chat response
* read [stop-report fields](../references/stop-report-fields.md)
* include the terminal-root stop fields from that reference in the final comment
* name or resolve any handled stale review, target drift, reviewer disagreement, or other unexpected parent-visible input that affected the proof path
* include cleanup status for created terminal or superseded chat threads, or an exact cleanup blocker and next owner
* if another granted action remains
  * write that action into the goal before leaving it active
* do not leave an active goal after the scoped claim is terminal unless another granted action remains and is written into the goal
* do not use an automation, reminder, or recurring watcher as a substitute for the project control-plane goal MDScript
* return to the caller
