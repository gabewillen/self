<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

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

* run [Sync File Task Proof State](file-task-lane-state.md#sync-file-task-proof-state)

## Classify File Workstream Fanout

* run [Classify File Workstream Fanout](file-task-lane-state.md#classify-file-workstream-fanout)

## Use Single Process Fallback

* run [Use Single Process Fallback](file-task-lane-state.md#use-single-process-fallback)

## Maintain File Lane Ledger

* run [Maintain File Lane Ledger](file-task-lane-state.md#maintain-file-lane-ledger)

## Report Stop To File Comments

* run [Report Stop To File Comments](file-task-lane-state.md#report-stop-to-file-comments)

## Mirror External Tracker

* run [Mirror External Tracker](file-task-lane-state.md#mirror-external-tracker)
