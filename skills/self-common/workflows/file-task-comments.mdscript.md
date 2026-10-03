<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve File Task Root

* if `{{source_repo_root}}` is empty
  * if a current work repository exists, set `{{source_repo_root}}` to its root
* if `{{source_repo_root}}` is set
  * resolve `{{source_repo_root}}` to an absolute canonical path
* set `{{agents_root}}` to `$AGENTS_HOME`, or to `~/.agents` if `$AGENTS_HOME` is not set
* resolve `{{agents_root}}` to an absolute path
* set `{{repo_root}}` to `{{agents_root}}` for installed skill and workflow entry points
* find `{{project_name}}` in this order: the explicit project name, the configured project identity, the basename of the source repository
* change `{{project_name}}` to a stable lowercase slug that is safe in a path
* set `{{file_task_root}}` to `{{agents_root}}/projects/{{project_name}}`
* set `{{task_dir}}` to `{{file_task_root}}/tasks`
* set `{{comment_dir}}` to `{{file_task_root}}/comments`
* set `{{goal_dir}}` to `{{file_task_root}}/goals`
* set `{{plan_dir}}` to `{{file_task_root}}/plans`
* set `{{instruction_dir}}` to `{{file_task_root}}/instructions`
* set `{{return_dir}}` to `{{file_task_root}}/returns`
* set `{{artifact_dir}}` to `{{file_task_root}}/artifacts`
* set `{{ledger_file}}` to `{{file_task_root}}/lane-ledger.jsonl`
* use `{{source_repo_root}}` only as the surface of the affected implementation or evidence
* under `{{file_task_root}}`, create each missing parent directory for tasks, comments, goals, and plans
* under `{{file_task_root}}`, create each missing parent directory for instructions, returns, artifacts, and the ledger
  * if the creation of a directory fails, stop and report the exact path and error
* do not write control-plane tasks, comments, plans, or goals of the agent into `{{source_repo_root}}`
* do not write control-plane instructions, artifacts, or lane ledgers of the agent into `{{source_repo_root}}`

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

* examine `{{task_file}}` for the MDScript execution header after the YAML front matter
  * if the header is missing, [Repair File Task](#repair-file-task)
* examine `{{task_file}}` for each front-matter field that the contract makes necessary
  * if a field is missing, [Repair File Task](#repair-file-task)
* examine `{{task_file}}` for the exact body headings `## Objective`, `## Contract`, `## Current State`, and `## Evidence`
  * if a heading is missing, [Repair File Task](#repair-file-task)
* examine `{{task_file}}` for the exact body headings `## Open Questions` and `## Next Action`
  * if a heading is missing, [Repair File Task](#repair-file-task)
* examine `## Next Action` for one single action and an exact `/mdscript-exec` continuation or an explicit stop
  * if the section is not valid, [Repair File Task](#repair-file-task)
* return to the caller

## Repair File Task

* rewrite missing front-matter fields and body headings in `{{task_file}}` from the contract and template
* [Verify File Task](#verify-file-task)
* if the examination fails again after one repair, stop and report the exact missing fields or headings

## Add File Comment

* run [Resolve File Task Root](#resolve-file-task-root)
* read [file-comment contract](../references/file-comment-contract.md)
* read [file-comment template](../templates/file-comment.mdscript.md)
* set `{{comment_task_dir}}` to `{{comment_dir}}/{{task_id}}`
* if `{{comment_task_dir}}` is missing, create it
  * if the creation fails, stop and report the exact path and error
* set `{{comment_file}}` to `{{comment_task_dir}}/<timestamp>-<role>-<short-slug>.mdscript.md`
  * write `<timestamp>` in UTC as `YYYYMMDDTHHMMSSZ`
* write `{{comment_file}}` from the template and contract
  * if the write fails, stop and report the exact path and error
* [Verify File Comment](#verify-file-comment)

## Verify File Comment

* examine `{{comment_file}}` for the MDScript execution header after the YAML front matter
  * if the header is missing, [Repair File Comment](#repair-file-comment)
* examine `{{comment_file}}` for each front-matter field that the contract makes necessary
  * if a field is missing, [Repair File Comment](#repair-file-comment)
* examine `{{comment_file}}` for the exact body headings `## Summary`, `## Evidence`, `## Questions`, `## Next`, and `## Stop Report`
  * if a heading is missing, [Repair File Comment](#repair-file-comment)
* examine `## Next` for one single action and an exact continuation or stop
  * if the section is not valid, [Repair File Comment](#repair-file-comment)
* do not edit or delete earlier comments to change the history
* return to the caller

## Repair File Comment

* rewrite missing front-matter fields and body headings in `{{comment_file}}` from the contract and template
* [Verify File Comment](#verify-file-comment)
* if the examination fails again after one repair, stop and report the exact missing fields or headings

## Ensure File Plan

* run [Resolve File Task Root](#resolve-file-task-root)
* set `{{plan_file}}` to `{{plan_dir}}/{{plan_id}}.mdscript.md`
* write or change `{{plan_file}}` as executable MDScript with the execution header
  * if the write fails, stop and report the exact path and error
* write stable `##` states for the context, the ordered actions, the examination, the recovery from failure, and the end
* write one single action in each plan bullet, and make sure that a tool can execute it
* link each branch, retry, recovery, and handoff to an explicit MDScript state
* at each point where the plan pauses, delegates, or resumes, include the exact `/mdscript-exec {{plan_file}}#<next-state>` command
* if the MDScript plan exists, do not keep a duplicate plan in prose only
* return to the caller

## Ensure File Instruction

* run [Resolve File Task Root](#resolve-file-task-root)
* if the instruction already belongs in an MDScript `SKILL.md` or workflow file
  * return to the caller
* set `{{instruction_file}}` to `{{instruction_dir}}/{{instruction_id}}.mdscript.md`
* write or change `{{instruction_file}}` as executable MDScript with the execution header
  * if the write fails, stop and report the exact path and error
* write stable `##` states to apply, examine, recover, and report the instruction
* write one single action in each instruction bullet, and make sure that a tool can execute it
* link each condition, failure, retry, recovery, and authority prompt to an explicit MDScript state or return script
* in each handoff that depends on the instruction, include the exact `/mdscript-exec {{instruction_file}}#<entry-state>` command
* for work in the shape of an agent task, do not create durable instruction files in prose only
* return to the caller

## Read File Task Packet

* run [Resolve File Task Root](#resolve-file-task-root)
* execute or read the named MDScript state in the current task file
* read all open comment MDScripts for that task
* if a parent task MDScript exists, read it
* read the active plan or instruction MDScripts for the lane
* read the lane ledger entries for the lane
* if the review is a first review or a final cumulative review
  * start from the diff of the current branch against the merge target
  * add the task file, the related comments, and the neutral support code or artifacts
* if the review is a repair review
  * start from the diff between the tree of the last completed review and the current tree
  * add the task file, the open requirements, and the neutral support code or artifacts
* if the assignment is not explicitly a reconciliation
  * do not use old comments, generated summaries, or earlier reviewer conclusions as the first frame for a new blind review
* return to the caller

## Sync File Task Proof State

* run [Sync File Task Proof State](file-task-lane-state.mdscript.md#sync-file-task-proof-state)

## Classify File Workstream Fanout

* run [Classify File Workstream Fanout](file-task-lane-state.mdscript.md#classify-file-workstream-fanout)

## Use Single Process Fallback

* run [Use Single Process Fallback](file-task-lane-state.mdscript.md#use-single-process-fallback)

## Maintain File Lane Ledger

* run [Maintain File Lane Ledger](file-task-lane-state.mdscript.md#maintain-file-lane-ledger)

## Report Stop To File Comments

* run [Report Stop To File Comments](file-task-lane-state.mdscript.md#report-stop-to-file-comments)

## Mirror External Tracker

* run [Mirror External Tracker](file-task-lane-state.mdscript.md#mirror-external-tracker)
