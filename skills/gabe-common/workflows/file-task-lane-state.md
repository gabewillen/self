<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Sync File Task Proof State

* before requesting review or claiming `Proven for {{claim_scope}}`, list every affected root, child-orchestrator, and implementer task
* update each affected task body's `Current State` from current source, proof result, goal state, and unresolved comments
* update each affected task body's `Evidence` with current proof command results, target-drift handling, proof not claimed, and remaining next owner
* update each affected task body's `Next Action` to match the current next owner action
  * if any task body still says an implementer is active, awaited, or unreviewed after a child has reported `Proven`, [Repair Stale Task Body](#repair-stale-task-body)
* write a parent-visible file comment when proof results do not fit inside the task body
* before root-level review, require each affected child-orchestrator lane to have a parent-visible child rollup stop comment under that child task id
  * if any child rollup is missing, stop and report the missing child task id
* read [stop-report fields](../references/stop-report-fields.md)
* verify each child rollup stop comment matches the child-rollup contract in that reference
  * if a rollup is malformed, [Repair Stale Task Body](#repair-stale-task-body)
* before reviewer comments can count as the current round, require a current parent-visible `review_round=start` comment written after the latest repair, stale-review rejection, or failed reviewer grade
  * if the start comment is missing, stop and report that `review_round=start` must be written first
* update related goal MDScript status when the lane moves from active to reviewing, proven, blocked, paused, obsolete, or done
* after a child rollup is terminal, update that child goal MDScript status to the matching terminal state
  * if the child goal must remain active, record the next owner and stop condition in the goal
* append a lane-ledger entry for each child rollup with the rollup `comment_file`, scoped `proof_decision`, `next_owner`, blocker, and cleanup state
* run `scripts/gabe_task.py validate` when available after syncing task and goal records
  * if validation fails, [Repair Stale Task Body](#repair-stale-task-body)
* treat stale durable task or goal records as a pre-review repair item
* return to the caller

## Repair Stale Task Body

* rewrite `Current State`, `Evidence`, and `Next Action` in every stale task body so they match the current rollup, goal status, and unresolved comments
* rewrite the matching goal status when the lane phase has already moved
* append a lane-ledger entry naming the repaired task ids and the mismatch found
* [Sync File Task Proof State](#sync-file-task-proof-state)
* if the same mismatch remains after one repair, stop and report the exact stale task ids and fields

## Classify File Workstream Fanout

* count independently testable workstreams, modules, repositories, surfaces, owners, event streams, or proof paths named by the project control-plane task
* if the count is three or more
  * treat the task as coordination work before implementation work
* if comments show target drift, stale proof, or reviewer disagreement across workstreams
  * keep the root or parent task at the orchestration boundary until child lanes exist
* create one child-orchestrator file task per named workstream before creating a direct root implementer task
* assign each child-orchestrator task its own implementer task, proof comments, reviewer comments, stop reports, and lane-ledger entries
* in single-process fallback, create all required child-orchestrator task files and parent handoff comments first
* in single-process fallback, execute the child lanes one at a time through role-switch comments after those files exist
* create or refresh one goal MDScript under `{{goal_dir}}` for each root-orchestrator and child-orchestrator file task before creating implementer task files for those child lanes
  * if a required goal file is missing, stop and report the missing goal id
* do not collapse multiple named workstreams into one implementer merely because they live in one repository, one test suite, or one source-health claim
* return to the caller

## Use Single Process Fallback

* if durable Codex thread tooling or subagent tooling is available
  * return to the caller and use normal thread creation
* keep the role boundary in files instead of blocking
* before crossing a role boundary in the same process, add a file comment that names the source role, target role, target task id, granted permissions, forbidden actions, proof path, and stop-report requirement
  * if the role-switch comment write fails, stop and report the exact path and error
* after the role-switch comment exists, continue at the target role's MDScript entry point
* write later comments under the target task using the target role
* use this fallback only for project control-plane workflows rooted under `~/.agents/projects/{{project_name}}/` or environments where the user explicitly asks for file-based tasks/comments
* do not use the fallback to bypass external authority, public tracker identity, merge, release, deployment, or live-proof gates
* if the next action is local, bounded, and authorized
  * execute the next role immediately
* do not stop after creating child or implementer task files when the next action is local, bounded, and authorized
* return to the caller

## Maintain File Lane Ledger

* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)
* read [lane-ledger fields](../references/lane-ledger-fields.md)
* append one JSON object per lane-state change to `{{ledger_file}}` with the required file-lane keys
  * if the append fails, stop and report the exact path and error
* after compaction, resume, interruption, or handoff, rebuild current state from task, comment, plan, instruction, and goal MDScripts plus the lane ledger before steering work
* if a lane lacks owner, parent, status, proof path, next action, reporting path, or parent-visible stop report
  * treat the file task record as incomplete
  * stop before claiming readiness and report the missing fields
* return to the caller

## Report Stop To File Comments

* read [stop-report fields](../references/stop-report-fields.md)
* before any root orchestrator final decision, child orchestrator, implementer, reviewer, or goal-resumed lane stops for any reason, set `{{stop_reason}}` to an accepted stop reason
* run [Add File Comment](file-task-comments.md#add-file-comment) with a parent-visible comment
* write stop-report fields only under the exact `## Stop Report` heading
  * if any stop field was written outside `## Stop Report`, [Repair Stop Report](#repair-stop-report)
* include the exact next owner, next action, blocker if any, and any MDScript continuation jump
* if the stop report asks an authority surface for input
  * include `return_script=...`, `resume_command=...`, and the pending decision field under `## Stop Report`
* when the scoped root claim is terminal and no granted source-health action remains, write the root task's final comment before any chat final response
* include `cleanup_status` for created terminal or superseded chat threads in final, review-cleanup, child-lane cleanup, and supersession comments
* in the final decision comment, name or resolve handled unexpected inputs, stale review notes, target-drift comments, and reviewer-disagreement comments that changed the proof path
* if a role cannot write its comment
  * record the failed write attempt in the lane ledger
  * report the blocker through the nearest available parent path
  * stop
* return to the caller

## Repair Stop Report

* rewrite the stop comment so every stop field lives only under `## Stop Report`
* remove stop fields from summary, evidence, or other prose sections
* [Report Stop To File Comments](#report-stop-to-file-comments)
* if the stop report is still malformed after one repair, stop and report the exact malformed fields

## Mirror External Tracker

* when a GitLab issue, MR, GitHub PR, or other external tracker also exists, keep MDScript tasks and comments under `{{file_task_root}}` as the project control-plane source of truth
* mirror reviewer grades, questions, answers, fix responses, evidence links, and resolutions to the external tracker only when authority and identity requirements are satisfied
  * if authority or identity is missing, stop and report the exact missing permission or alias
* do not count an external tracker note as a substitute for the project control-plane comment MDScript required by this workflow
* return to the caller
