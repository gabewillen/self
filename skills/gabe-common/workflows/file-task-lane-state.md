<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Sync File Task Proof State

* before requesting review or claiming `Proven for {{claim_scope}}`, update every affected root, child-orchestrator, and implementer task body so `Current State`, `Evidence`, and `Next Action` match the current source, proof result, goal state, and unresolved comments

* include current proof command results, target-drift handling, proof not claimed, and remaining next owner in the task bodies or a parent-visible file comment before reviewers start

* before root-level review, require each affected child-orchestrator lane to have a parent-visible child rollup stop comment under that child task id

* before reviewer comments can count as the current round, require a current parent-visible `review_round=start` comment or equivalent explicit review-round start comment written after the latest repair, stale-review rejection, or failed reviewer grade

* each child rollup stop comment must include `role: orchestrator`, `parent_visible: true`, the scoped `proof_decision`, `stop_reason=done` or the exact terminal stop reason, `next_owner` set to the parent task or root, `proof_not_claimed=...`, `blocker=...`, and `cleanup_status=...`

* for source-health child rollups and final root stops, `proof_not_claimed` must explicitly include `merge-readiness`, `live-proof`, `issue-close-readiness`, `release-readiness`, `deployment-readiness`, and `publication` unless that broader proof scope was explicitly granted and proven

* after a child rollup stop comment exists, update the child-orchestrator task status and body to match the rollup; do not leave `Current State` or `Next Action` saying that an implementer is still active, awaited, or unreviewed after the child has reported `Proven`

* update related goal MDScript status when the lane moves from active to reviewing, proven, blocked, paused, obsolete, or done

* after a child rollup is terminal, update that child goal MDScript status to the matching terminal state or record why it remains active with a next owner and stop condition

* append a lane-ledger entry for each child rollup with the rollup `comment_file`, scoped `proof_decision`, `next_owner`, blocker, and cleanup state

* run `scripts/gabe_task.py validate` when available after syncing task and goal records

* treat stale durable task or goal records as a pre-review repair item, not as something reviewers should discover in round 1

## Classify File Workstream Fanout

* when a project control-plane task names three or more independently testable workstreams, modules, repositories, surfaces, owners, event streams, or proof paths, treat the task as coordination work before treating it as implementation work

* when comments show target drift, stale proof, or reviewer disagreement across workstreams, keep the root or parent task at the orchestration boundary until child lanes exist

* create one child-orchestrator file task per named workstream before creating a direct root implementer task

* each child-orchestrator task should own its own implementer task, proof comments, reviewer comments, stop reports, and lane-ledger entries

* in single-process fallback, create all required child-orchestrator task files and parent handoff comments first, then execute the child lanes one at a time through role-switch comments

* create or refresh one `~/.agents/projects/{{project_name}}/goals/<goal-id>.mdscript.md` file for each root-orchestrator and child-orchestrator file task before creating implementer task files for those child lanes

* do not collapse multiple named workstreams into one implementer merely because they live in one repository, one test suite, or one source-health claim

## Use Single Process Fallback

* when durable Codex thread tooling or subagent tooling is unavailable in a project control-plane workflow, keep the role boundary in files instead of blocking

* before crossing a role boundary in the same process, add a file comment that names the source role, target role, target task id, granted permissions, forbidden actions, proof path, and stop-report requirement

* after the role-switch comment exists, continue at the target role's MDScript entry point and write comments under the target task using the target role

* use this fallback only for project control-plane workflows rooted under `~/.agents/projects/{{project_name}}/` or environments where the user explicitly asks for file-based tasks/comments

* do not use the fallback to bypass external authority, public tracker identity, merge, release, deployment, or live-proof gates

* do not stop after creating child or implementer task files when the next action is local, bounded, and authorized; execute the next role immediately and preserve the boundary through file comments

## Maintain File Lane Ledger

* append one JSON object per lane-state change to `~/.agents/projects/{{project_name}}/lane-ledger.jsonl`

* include `time`, `lane_id`, `task_id`, `parent_task_id`, `owner_role`, `phase`, `status`, `event_type`, `event_exec`, `claim_scope`, `proof_decision`, `next_action`, `next_owner`, `blocker`, and `comment_file`

* after compaction, resume, interruption, or handoff, rebuild current state from task, comment, plan, instruction, and goal MDScripts plus the lane ledger before steering work

* if a lane lacks owner, parent, status, proof path, next action, reporting path, or parent-visible stop report, treat the file task record as incomplete before claiming readiness

## Report Stop To File Comments

* every root orchestrator final decision, child orchestrator, implementer, reviewer, and goal-resumed lane must add a parent-visible file comment before stopping for any reason

* put stop-report fields only under the exact `## Stop Report` heading; fields such as `stop_reason=...`, `next_owner=...`, `proof_not_claimed=...`, `cleanup_status=...`, or `resume_command=...` in summaries, evidence, or prose do not count and should be treated as malformed

* accepted stop reasons are `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, `watcher-terminal`, and `review-complete`

* include the exact next owner, next action, blocker if any, and any MDScript continuation jump

* if the stop report asks Gabe, the user, a repository owner, or another authority surface for input, include `return_script=...`, `resume_command=...`, and the pending decision field under `## Stop Report`

* when the scoped root claim is terminal and no granted source-health action remains, write the root task's final comment before any chat final response; include exact stop-report fields `stop_reason=done`, `next_owner=none`, `proof_decision=...`, `proof_supplied=...`, `proof_not_claimed=...`, `remaining_authority_boundary=...`, `cleanup_status=...`, and `blocker=...`

* include `cleanup_status` for created terminal or superseded chat threads in final, review-cleanup, child-lane cleanup, and supersession comments

* in the final decision comment, explicitly name or resolve handled unexpected inputs, stale review notes, target-drift comments, reviewer-disagreement comments, and other parent-visible comments that changed the proof path

* if a role cannot write its comment, record the failed write attempt in the lane ledger and report the blocker through the nearest available parent path

## Mirror External Tracker

* when a GitLab issue, MR, GitHub PR, or other external tracker also exists, keep the MDScript tasks and comments under `~/.agents/projects/{{project_name}}/` as the project control-plane source of truth

* mirror reviewer grades, questions, answers, fix responses, evidence links, and resolutions to the external tracker only when authority and identity requirements are satisfied

* do not count an external tracker note as a substitute for the project control-plane comment MDScript required by this workflow
