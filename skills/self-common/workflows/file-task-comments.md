<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve File Task Root

* if `{{source_repo_root}}` is empty
  * set `{{source_repo_root}}` to the current working repository root when one exists
* if `{{source_repo_root}}` is set
  * resolve `{{source_repo_root}}` to an absolute canonical path
* set `{{agents_root}}` to `$AGENTS_HOME` when configured, otherwise `~/.agents`
* resolve `{{agents_root}}` to an absolute path
* set `{{repo_root}}` to `{{agents_root}}` for installed skill and workflow entry points
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
* treat `{{source_repo_root}}` only as the affected implementation or evidence surface
* create missing task, comment, goal, plan, instruction, return, artifact, and ledger parent directories under `{{file_task_root}}`
  * if directory creation fails, stop and report the exact path and error
* do not write agent control-plane tasks, comments, plans, goals, instructions, artifacts, or lane ledgers into `{{source_repo_root}}`

## Ensure File Task

* run [Resolve File Task Root](#resolve-file-task-root)
* read [file-task contract](../references/file-task-contract.md)
* read [file-task template](../templates/file-task.mdscript.md)
* set `{{task_file}}` to `{{task_dir}}/{{task_id}}.mdscript.md`
* if `scripts/self_task.py` exists
  * run `python3 scripts/self_task.py task` for this lane
  * if the command fails
    * write `{{task_file}}` directly from the template and contract
    * [Verify File Task](#verify-file-task)
* if `scripts/self_task.py` does not exist
  * write `{{task_file}}` from the template and contract
  * [Verify File Task](#verify-file-task)
* [Verify File Task](#verify-file-task)

## Verify File Task

* verify `{{task_file}}` has the MDScript execution header after YAML front matter
  * if missing, [Repair File Task](#repair-file-task)
* verify every required front-matter field from the contract is present
  * if any field is missing, [Repair File Task](#repair-file-task)
* verify exact body headings `## Objective`, `## Contract`, `## Current State`, `## Evidence`, `## Open Questions`, and `## Next Action` exist
  * if any heading is missing, [Repair File Task](#repair-file-task)
* verify `## Next Action` has one discrete action and an exact `/mdscript-exec` continuation or an explicit stop
  * if invalid, [Repair File Task](#repair-file-task)
* return to the caller

## Repair File Task

* rewrite missing front-matter fields and body headings in `{{task_file}}` from the contract and template
* [Verify File Task](#verify-file-task)
* if verification still fails after one repair, stop and report the exact missing fields or headings

## Add File Comment

* run [Resolve File Task Root](#resolve-file-task-root)
* read [file-comment contract](../references/file-comment-contract.md)
* read [file-comment template](../templates/file-comment.mdscript.md)
* set `{{comment_task_dir}}` to `{{comment_dir}}/{{task_id}}`
* create `{{comment_task_dir}}` when missing
  * if creation fails, stop and report the exact path and error
* set `{{comment_file}}` to `{{comment_task_dir}}/<timestamp>-<role>-<short-slug>.mdscript.md` using UTC `YYYYMMDDTHHMMSSZ`
* write `{{comment_file}}` from the template and contract
  * if the write fails, stop and report the exact path and error
* [Verify File Comment](#verify-file-comment)

## Verify File Comment

* verify `{{comment_file}}` has the MDScript execution header after YAML front matter
  * if missing, [Repair File Comment](#repair-file-comment)
* verify every required front-matter field from the contract is present
  * if any field is missing, [Repair File Comment](#repair-file-comment)
* verify exact body headings `## Summary`, `## Evidence`, `## Questions`, `## Next`, and `## Stop Report` exist
  * if any heading is missing, [Repair File Comment](#repair-file-comment)
* verify `## Next` has one discrete action and an exact continuation or stop
  * if invalid, [Repair File Comment](#repair-file-comment)
* do not edit or delete prior comments to change history
* return to the caller

## Repair File Comment

* rewrite missing front-matter fields and body headings in `{{comment_file}}` from the contract and template
* [Verify File Comment](#verify-file-comment)
* if verification still fails after one repair, stop and report the exact missing fields or headings

## Ensure File Plan

* run [Resolve File Task Root](#resolve-file-task-root)
* set `{{plan_file}}` to `{{plan_dir}}/{{plan_id}}.mdscript.md`
* write or update `{{plan_file}}` as executable MDScript with the execution header
  * if the write fails, stop and report the exact path and error
* write stable `##` states for context, ordered actions, verification, failure recovery, and completion
* keep each plan bullet to one discrete tool-executable action
* link every branch, retry, recovery, and handoff to an explicit MDScript state
* include the exact `/mdscript-exec {{plan_file}}#<next-state>` command wherever the plan pauses, delegates, or resumes
* do not maintain a prose-only duplicate plan when the MDScript plan exists
* return to the caller

## Ensure File Instruction

* run [Resolve File Task Root](#resolve-file-task-root)
* if the instruction already belongs in an MDScript `SKILL.md` or workflow file
  * return to the caller
* set `{{instruction_file}}` to `{{instruction_dir}}/{{instruction_id}}.mdscript.md`
* write or update `{{instruction_file}}` as executable MDScript with the execution header
  * if the write fails, stop and report the exact path and error
* write stable `##` states for applying, verifying, recovering from, and reporting the instruction
* keep each instruction bullet to one discrete tool-executable action
* link every condition, failure, retry, recovery, and authority prompt to an explicit MDScript state or return script
* include the exact `/mdscript-exec {{instruction_file}}#<entry-state>` command in every handoff that depends on the instruction
* do not create prose-only durable instruction files for agent-shaped work
* return to the caller

## Read File Task Packet

* run [Resolve File Task Root](#resolve-file-task-root)
* execute or read the named MDScript state in the current task file
* read all unresolved comment MDScripts for that task
* read the parent task MDScript when one exists
* read the active plan or instruction MDScripts for the lane
* read the lane ledger entries for the lane
* for an initial or final cumulative review, start from the current branch diff against the merge target plus the task file, relevant comments, and neutral supporting code or artifacts
* for a repair review, start from the rolling diff between the last completed review tree and the current tree plus the task file, unresolved requirements, and neutral supporting code or artifacts
* do not use old comments, generated summaries, or previous reviewer conclusions as the initial frame for a fresh blind review unless the assignment is explicitly reconciliation
* return to the caller

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
