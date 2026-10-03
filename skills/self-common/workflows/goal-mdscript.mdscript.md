<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Goal MDScript

* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* set `{{goal_dir}}` to `{{file_task_root}}/goals`
* set `{{goal_id}}` to a stable slug from `{{file_task_id}}` and the orchestration purpose, for example `<task-id>-goal`
* set `{{goal_mdscript}}` to `{{goal_dir}}/{{goal_id}}.mdscript.md`
* before you write a goal, create `{{goal_dir}}`
  * if the create operation fails, stop and report the exact path and error

## Write Goal MDScript

* use this goal MDScript as the running log for its lane
  * this log satisfies the forward-progress boundary for `self-goal`, `self-watch`, `self-automate`, and each monitored orchestrator lane
* include `## Done So Far` as the append-only record of the completed rounds and their evidence
* include `## Next Steps` as the executable states that remain
* change the two sections at each round or heartbeat that changes what is true, not only at the end

* run [Resolve Goal MDScript](#resolve-goal-mdscript)
* read [goal contract](../references/goal-contract.md)
* read [goal template](../templates/goal.mdscript.md)
* before you create child lanes, handoffs, monitor loops, or resumed coordination, do the next step
* write one executable MDScript goal file for each active lane that an orchestrator owns
  * if the goal file exists, write it again with the current state
* if a parent fanout creates more than one child-orchestrator file task in one pass
  * create the child goal MDScript files in the same pass
  * do this before you execute child implementer work
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

* make sure that `{{goal_mdscript}}` has the exact MDScript execution header after the YAML front matter
  * if the header is not there, [Repair Goal MDScript](#repair-goal-mdscript)
* make sure that each necessary front-matter field from the contract is there
  * if a field is not there, [Repair Goal MDScript](#repair-goal-mdscript)
* make sure that the exact body headings `## Goal Contract`, `## Resume Goal`, `## Hot Path`, and `## Stop` exist
  * if a heading is not there, [Repair Goal MDScript](#repair-goal-mdscript)
* make sure that each state body uses executable bullets, not prose paragraphs
  * if a state has only prose, [Repair Goal MDScript](#repair-goal-mdscript)
* make sure that `/mdscript-exec {{goal_mdscript}}#resume-goal` resolves to a real `## Resume Goal` state
  * if it does not resolve, [Repair Goal MDScript](#repair-goal-mdscript)
* run [Add File Comment](file-task-comments.mdscript.md#add-file-comment) as a comment that the parent can see
  * name the goal file, the owner role, the next `/mdscript-exec {{goal_mdscript}}#resume-goal` command, and the stop condition
* for a long or multi-workstream lane, write a `context-limit` checkpoint that the parent can see
  * write it after the goal exists and before the next long phase or child fanout
* for a long or multi-workstream lane, after you rebuild from file state, write a separate `compaction-resume` marker with `resumed=true`
  * make sure that the parent can see the marker
* if a goal API exists for the current agent, copy the objective of the MDScript goal into that API
  * do this only after the project goal file exists
* return to the caller

## Repair Goal MDScript

* write the front-matter fields and necessary body states that are not there into `{{goal_mdscript}}`
  * use the contract and template as the source
* [Verify Goal MDScript](#verify-goal-mdscript)
* if the examination fails again after one repair, stop and report the exact fields or headings that are not there

## Resume Goal

* on resumed coordination, a child-lane heartbeat, a monitor turn, or a continuation after compaction
  * if the goal file exists and names the current lane, execute `/mdscript-exec {{goal_mdscript}}#resume-goal` first
* compare the recorded `model`, `reasoning`, and `model_selection_basis` of the goal with [Select Configured Model And Reasoning](model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning)
* if the recorded role configuration is not there or not valid
  * stop and report the exact model-contract blocker
* if the resumed goal started from a return script
  * before you get the live state again, apply the returned answer to the saved pending decision
* get the current repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state again
  * do this only after you read the goal
* if the goal MDScript already holds the active contract, do not read or state the full context again
  * this context includes the skill pack, automation, watcher, and ledger context
* if a new human correction, scope change, project change, or source-of-truth conflict makes the goal not valid
  * run [Write Goal MDScript](#write-goal-mdscript)
  * before you act, stop and report that you wrote the goal again
* return to the caller

## Goal Stop Boundary

* if the stop condition of the goal occurs, run [Add File Comment](file-task-comments.mdscript.md#add-file-comment) as a file comment that the parent can see
* change the goal status to `done`, `blocked`, `paused`, `obsolete`, or the nearest exact terminal state
* if a root orchestrator gets a terminal scoped claim
  * before a final chat response, write the final comment of the root task that the parent can see
* read [stop-report fields](../references/stop-report-fields.md)
* put the terminal-root stop fields from that reference in the final comment
* name or resolve each unexpected input that the parent can see and that affected the proof path
  * this input includes a stale review, a target drift, or a reviewer disagreement that you handled
* include the cleanup status for created terminal or superseded chat threads
  * if cleanup is not complete, include an exact cleanup blocker and the next owner
* if a different granted action remains
  * before you leave the goal active, write that action into the goal
* after the scoped claim is terminal, do not leave a goal active
  * this rule does not apply if a different granted action remains and is in the goal
* do not use an automation, a reminder, or a watcher that repeats in place of the project control-plane goal MDScript
* return to the caller
