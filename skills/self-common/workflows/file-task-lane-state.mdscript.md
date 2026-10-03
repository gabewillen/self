<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Sync File Task Proof State

* before you ask for review or claim `Proven for {{claim_scope}}`, list each affected root, child-orchestrator, and implementer task
* in the body of each affected task, change `Current State` to agree with the current source and proof result
  * also make `Current State` agree with the goal state and the open comments
* in the body of each affected task, change `Evidence` to show the current results of the proof commands
  * also show the response to target drift, the proof not claimed, and the remaining next owner
* in the body of each affected task, change `Next Action` to agree with the current action of the next owner
  * if a child reported `Proven` and a task body still shows an implementer as active, awaited, or not reviewed, [Repair Stale Task Body](#repair-stale-task-body)
* if the proof results do not fit inside the task body, write a parent-visible file comment
* before the root-level review, examine each affected child-orchestrator lane for a child rollup stop comment
  * make sure that the comment is parent-visible and is under the task id of that child
  * if a child rollup is missing, stop and report the missing child task id
* read [stop-report fields](../references/stop-report-fields.md)
* examine each child rollup stop comment against the child-rollup contract in that reference
  * if a rollup is not correct, [Repair Stale Task Body](#repair-stale-task-body)
* before reviewer comments count as the current round, examine for a current parent-visible `review_round=start` comment
  * make sure that this comment came after the latest repair, stale-review rejection, or failed reviewer grade
  * if the start comment is missing, stop and report that `review_round=start` must come first
* if the lane moves from active to reviewing, proven, blocked, paused, obsolete, or done
  * change the status of the related goal MDScript
* after a child rollup is terminal, change the status of that child goal MDScript to the matching terminal state
  * if the child goal must stay active, record the next owner and the stop condition in the goal
* for each child rollup, append a lane-ledger entry with the rollup `comment_file` and the scoped `proof_decision`
  * also record the `next_owner`, the blocker, and the cleanup state in that entry
* after you sync the task and goal records, if `scripts/self_task.py validate` is available, run it
  * if the validation fails, [Repair Stale Task Body](#repair-stale-task-body)
* treat stale durable task or goal records as a repair item before the review
* return to the caller

## Repair Stale Task Body

* in each stale task body, rewrite `Current State`, `Evidence`, and `Next Action`
  * make them agree with the current rollup, the goal status, and the open comments
* if the phase of the lane already moved, rewrite the matching goal status
* append a lane-ledger entry that names the repaired task ids and the mismatch that you found
* [Sync File Task Proof State](#sync-file-task-proof-state)
* if the same mismatch remains after one repair, stop and report the exact stale task ids and fields

## Classify File Workstream Fanout

* count the items that you can test independently and that the control-plane task of the project names
  * count workstreams, modules, repositories, surfaces, owners, event streams, and proof paths
* if the count is three or more
  * treat the task as coordination work before implementation work
* if comments show target drift, stale proof, or reviewer disagreement across workstreams
  * keep the root or parent task at the orchestration boundary until child lanes exist
* before you create a direct root implementer task, create one child-orchestrator file task for each named workstream
* give each child-orchestrator task its own implementer task, proof comments, reviewer comments, stop reports, and lane-ledger entries
* in single-process fallback, first create all the necessary child-orchestrator task files and parent handoff comments
* in single-process fallback, after those files exist, execute the child lanes one at a time through role-switch comments
* create or refresh one goal MDScript under `{{goal_dir}}` for each root-orchestrator and child-orchestrator file task
  * do this before you create implementer task files for those child lanes
  * if a necessary goal file is missing, stop and report the missing goal id
* do not put many named workstreams into one implementer only because they share a repository
  * also do not do this only because they share a test suite or a source-health claim
* return to the caller

## Use Single Process Fallback

* if durable Codex thread tools or subagent tools are available
  * return to the caller and use the usual thread creation
* keep the role boundary in files, and do not block
* before you cross a role boundary in the same process, add a file comment
  * in that comment, name the source role, the target role, the target task id, and the granted permissions
  * in that comment, name the forbidden actions, the proof path, and the stop-report rule
  * if the write of the role-switch comment fails, stop and report the exact path and error
* after the role-switch comment exists, continue at the target role's MDScript entry point
* write later comments under the target task with the target role
* use this fallback only for control-plane workflows of the project under `~/.agents/projects/{{project_name}}/`
  * also use this fallback if the user explicitly asks for file-based tasks/comments
* do not use the fallback to go around the gates for external authority or public tracker identity
* do not use the fallback to go around the gates for merge, release, deployment, or live proof
* if the next action is local, bounded, and authorized
  * execute the next role immediately
  * do not stop after you create child or implementer task files
* return to the caller

## Maintain File Lane Ledger

* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* read [lane-ledger fields](../references/lane-ledger-fields.md)
* for each change of lane state, append one JSON object to `{{ledger_file}}` with the necessary file-lane keys
  * if the append fails, stop and report the exact path and error
* after a compaction, resume, interruption, or handoff, rebuild the current state before you steer work
  * use the task, comment, plan, instruction, and goal MDScripts and the lane ledger
* if a lane does not have an owner, a parent, a status, a proof path, or a next action
  * treat the file task record as incomplete
  * stop before you claim readiness and report the missing fields
* if a lane does not have a report path or a parent-visible stop report
  * treat the file task record as incomplete
  * stop before you claim readiness and report the missing fields
* return to the caller

## Report Stop To File Comments

* read [stop-report fields](../references/stop-report-fields.md)
* before a lane stops for any reason, set `{{stop_reason}}` to an accepted stop reason
  * do this for a root orchestrator final decision, a child orchestrator, an implementer, a reviewer, or a goal-resumed lane
* run [Add File Comment](file-task-comments.mdscript.md#add-file-comment) with a parent-visible comment
* write stop-report fields only under the exact `## Stop Report` heading
  * if you wrote a stop field outside `## Stop Report`, [Repair Stop Report](#repair-stop-report)
* include the exact next owner and the next action
* if a blocker exists, include it
* if an MDScript continuation jump exists, include it
* if the stop report asks an authority surface for input
  * include `return_script=...`, `resume_command=...`, and the pending decision field under `## Stop Report`
* if the scoped root claim is terminal and no granted source-health action remains
  * write the final comment of the root task before a final response in the chat
* in final, review-cleanup, child-lane cleanup, and supersession comments, include `cleanup_status`
  * write it for each created chat thread that is terminal or superseded
* in the final decision comment, name or resolve each handled input that changed the proof path
  * include the unexpected inputs, the stale review notes, the target-drift comments, and the reviewer-disagreement comments
* if a role cannot write its comment
  * record the failed write in the lane ledger
  * report the blocker through the nearest available parent path
  * stop
* return to the caller

## Repair Stop Report

* rewrite the stop comment so every stop field lives only under `## Stop Report`
* remove stop fields from summary, evidence, or other prose sections
* [Report Stop To File Comments](#report-stop-to-file-comments)
* if the stop report is still malformed after one repair, stop and report the exact malformed fields

## Mirror External Tracker

* if a GitLab issue, MR, GitHub PR, or other external tracker also exists
  * keep the MDScript tasks and comments under `{{file_task_root}}` as the control-plane source of truth of the project
* if the authority and identity rules are satisfied
  * mirror the reviewer grades, questions, answers, fix responses, evidence links, and resolutions to the external tracker
* if the authority or the identity is missing, stop and report the exact missing permission or alias
* do not count an external tracker note as a replacement for the control-plane comment MDScript that this workflow makes necessary
* return to the caller
