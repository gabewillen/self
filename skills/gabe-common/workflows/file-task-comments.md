<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Resolve File Task Root

* if `{{source_repo_root}}` is empty
  * set `{{source_repo_root}}` to the current working repository root when one exists

* if `{{source_repo_root}}` is set
  * resolve `{{source_repo_root}}` to an absolute canonical path

* set `{{agents_root}}` to `$AGENTS_HOME` when configured, otherwise `~/.agents`

* resolve `{{agents_root}}` to an absolute path

* set `{{repo_root}}` to `{{agents_root}}` for installed Gabe skill and workflow entry points

* infer `{{project_name}}` from the explicit project name, configured project identity, or source repository basename, in that order

* normalize `{{project_name}}` to a stable lowercase path-safe slug

* set `{{file_task_root}}` to `{{agents_root}}/projects/{{project_name}}`

* set `{{task_dir}}` to `{{file_task_root}}/tasks`

* set `{{comment_dir}}` to `{{file_task_root}}/comments`

* set `{{goal_dir}}` to `{{file_task_root}}/goals`

* set `{{plan_dir}}` to `{{file_task_root}}/plans`

* set `{{instruction_dir}}` to `{{file_task_root}}/instructions`

* set `{{return_dir}}` to `{{file_task_root}}/returns`

* set `{{artifact_dir}}` to `{{file_task_root}}/artifacts`

* set `{{ledger_file}}` to `{{file_task_root}}/lane-ledger.jsonl`

* do not write Gabe control-plane tasks, comments, plans, goals, instructions, artifacts, or lane ledgers into `{{source_repo_root}}`

* treat `{{source_repo_root}}` only as the affected implementation or evidence surface

* create missing task, comment, goal, plan, instruction, return, artifact, and ledger parent directories before writing reports

* prefer `scripts/gabe_task.py` when it exists; otherwise create the same files directly with the fields below

## Ensure File Task

* create or update one executable MDScript task file per durable lane under `~/.agents/projects/{{project_name}}/tasks`

* name task files as `<task_id>.mdscript.md`, where `{{task_id}}` is stable, lowercase, and safe for file paths

* include the MDScript execution header immediately after YAML front matter

* include YAML front matter with:
  * `id`
  * `title`
  * `type`: `root-orchestrator`, `child-orchestrator`, `implementer`, `reviewer`, `goal`, or `decision`
  * `status`: `planned`, `active`, `blocked`, `reviewing`, `proven`, `done`, `paused`, `obsolete`, or `superseded`
  * `parent`
  * `owner_role`
  * `lane_id`
  * `claim_scope`
  * `proof_path`
  * `source_of_truth`
  * `created_at`
  * `updated_at`

* keep the task body structured as executable MDScript with exact state headings `## Objective`, `## Contract`, `## Current State`, `## Evidence`, `## Open Questions`, and `## Next Action`; inline labels or prose mentions do not satisfy the file-task contract

* under `## Next Action`, include one discrete executable action and an exact `/mdscript-exec <task-file>#<state>` continuation or an explicit stop

* write every failure, retry, recovery, and authority branch as an explicit MDScript state link or explicit stop

* for child orchestrator scopes, write a task file for the child orchestrator itself and let that child task own its subtasks

* for implementer scopes, write a task file that names the exact DBC claim, preconditions, postconditions, invariants, proof path, local resource path, proof supplied, proof not claimed, and review gate

* never treat chat history as the task source of truth when a file task exists

## Add File Comment

* add append-only executable MDScript comments under `~/.agents/projects/{{project_name}}/comments/<task_id>/`

* name comment files as `<timestamp>-<role>-<short-slug>.mdscript.md`, using UTC `YYYYMMDDTHHMMSSZ`

* include the MDScript execution header immediately after YAML front matter

* include YAML front matter with:
  * `task_id`
  * `role`
  * `author`
  * `status`
  * `event_type`
  * `event_exec`
  * `claim_scope`
  * `proof_decision`
  * `parent_visible`
  * `resolves`
  * `supersedes`
  * `created_at`

* keep the comment body structured as executable MDScript with exact state headings `## Summary`, `## Evidence`, `## Questions`, `## Next`, and `## Stop Report`; inline labels or prose mentions do not satisfy the file-comment contract

* under `## Next`, include one discrete executable action and an exact `/mdscript-exec <comment-file>#<state>` or owning task/workflow continuation

* write every question, decision, failure, retry, recovery, and authority branch as an explicit MDScript state link, return-script command, or explicit stop

* write a comment for every delegation, handoff, reviewer grade, reviewer question, implementer answer, fix response, unexpected input, blocker, stop report, and final decision

* write a cleanup comment for every created chat thread, reviewer subagent, worker thread, or child orchestrator thread that is closed, archived, deleted, transferred, superseded, or blocked from cleanup

* do not edit or delete prior comments to change history; add a new comment with `supersedes` or `resolves`

* keep comments portable and sanitized: use repo-relative paths, stable task ids, command names, test names, and artifact ids instead of home-directory paths, private endpoints, credentials, or tokens

* for any long-running, multi-workstream, or goal-backed lane, add a parent-visible `context-limit` checkpoint comment after the goal file exists and before the next long phase or child fanout; this is a resumability checkpoint, so write it even when the context window has not hard-failed yet; the stop report should include `stop_reason=context-limit`, the current next owner, and `cleanup_status=...`

* after rebuilding state from the task file, comments directory, goal MDScript, and lane ledger, add a separate parent-visible `compaction-resume` comment; the stop report should include `resumed=true` and `resume_command=/mdscript-exec {{goal_mdscript}}#resume-goal`, and the body should name the task file, comments directory, goal MDScript, lane ledger, current next owner, and how to rebuild state from those files

* before starting a fresh blind review round, add a parent-visible non-reviewer comment whose stop report includes `review_round=start`, the exact reviewer authors or planned reviewer ids, the current proof command state, and any live subagent or thread ids that must later be cleaned up

## Ensure File Plan

* create or update each durable plan as executable MDScript under `~/.agents/projects/{{project_name}}/plans/<plan_id>.mdscript.md`

* include the MDScript execution header

* use stable state headings for context, ordered actions, verification, failure recovery, and completion

* keep each bullet to one discrete tool-executable action

* link every branch, retry, recovery, and handoff to an explicit MDScript state

* include the exact `/mdscript-exec <plan-file>#<next-state>` command wherever the plan pauses, delegates, or resumes

* do not maintain a prose-only duplicate plan when the MDScript plan exists

## Ensure File Instruction

* create or update each durable project instruction as executable MDScript under `~/.agents/projects/{{project_name}}/instructions/<instruction_id>.mdscript.md` unless the instruction already belongs in an MDScript `SKILL.md` or workflow file

* include the MDScript execution header

* use stable state headings for applying, verifying, recovering from, and reporting the instruction

* keep each bullet to one discrete tool-executable action

* link every condition, failure, retry, recovery, and authority prompt to an explicit MDScript state or return script

* include the exact `/mdscript-exec <instruction-file>#<entry-state>` command in every handoff that depends on the instruction

* do not create prose-only durable instruction files for Gabe-shaped work

## Read File Task Packet

* before acting, execute or read from the named MDScript state in the current task file, all unresolved comment MDScripts for that task, the parent task MDScript when one exists, the active plan or instruction MDScripts, and the lane ledger entries for the lane

* for an initial or final cumulative review, start from the current branch diff against the merge target plus the task file, relevant comments, and neutral supporting code or artifacts

* for a repair review, start from the rolling diff between the last completed review tree and the current tree plus the task file, unresolved requirements, and neutral supporting code or artifacts

* do not use old comments, generated summaries, or previous reviewer conclusions as the initial frame for a fresh blind review unless the assignment is explicitly reconciliation

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
