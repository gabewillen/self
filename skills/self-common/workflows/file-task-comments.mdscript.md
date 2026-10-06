<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve File Task Root

* set `{{source_repo_root}}` to the absolute root of the current work repository, if one exists
* set `{{agents_root}}` to `$AGENTS_HOME`, or `~/.agents`
* set `{{repo_root}}` to `{{agents_root}}`
* set `{{project_name}}` to a path-safe lowercase slug of the explicit project name, the configured identity, or the repository basename
* set `{{file_task_root}}` to `{{agents_root}}/projects/{{project_name}}`
* set `{{task_dir}}`, `{{comment_dir}}`, `{{goal_dir}}`, `{{plan_dir}}`, `{{instruction_dir}}`, `{{return_dir}}`, and `{{artifact_dir}}` to `tasks`, `comments`, `goals`, `plans`, `instructions`, `returns`, and `artifacts` under it
* set `{{ledger_file}}` to `{{file_task_root}}/lane-ledger.jsonl`
* create the directories that are missing
  * if a create fails, stop and report the path and error
* do not write these control-plane records into `{{source_repo_root}}`

## Ensure File Task

* run [Resolve File Task Root](#resolve-file-task-root)
* set `{{task_file}}` to `{{task_dir}}/{{task_id}}.mdscript.md`
* write it from the [file-task template](../templates/file-task.mdscript.md)
* make sure that it has the execution header, the template front matter, and `## Objective`, `## Contract`, `## Current State`, `## Evidence`, `## Open Questions`, and `## Next Action`
* make sure that `## Next Action` has one action and an exact `/mdscript-exec` continuation or a stop
* if a check fails, repair it one time, then stop and report the missing parts

## Add File Comment

* run [Resolve File Task Root](#resolve-file-task-root)
* set `{{comment_file}}` to `{{comment_dir}}/{{task_id}}/<UTC YYYYMMDDTHHMMSSZ>-<role>-<slug>.mdscript.md`
* write it from the [file-comment template](../templates/file-comment.mdscript.md)
* write a comment for each delegation, handoff, grade, question, answer, fix, blocker, stop, decision, and thread cleanup
* make sure that it has the execution header, the template front matter, and `## Summary`, `## Evidence`, `## Questions`, `## Next`, and `## Stop Report`
* if a check fails, repair it one time, then stop and report the missing parts
* do not edit or delete earlier comments

## Ensure File Plan

* run [Resolve File Task Root](#resolve-file-task-root)
* set `{{plan_id}}` to a stable slug for the plan
* set `{{plan_file}}` to `{{plan_dir}}/{{plan_id}}.mdscript.md`
* write `{{plan_file}}` as executable MDScript, with one action for each bullet and each branch as a state link
* at each pause, delegation, or resume, write the exact `/mdscript-exec <plan>#<state>` command
* do not keep a second copy of the plan in prose

## Ensure File Instruction

* if the instruction belongs in a `SKILL.md` or workflow file, return to the caller
* run [Resolve File Task Root](#resolve-file-task-root)
* set `{{instruction_id}}` to a stable slug for the instruction
* set `{{instruction_file}}` to `{{instruction_dir}}/{{instruction_id}}.mdscript.md`
* write `{{instruction_file}}` as executable MDScript
* put its entry command in each handoff that depends on it

## Read File Task Packet

* run [Resolve File Task Root](#resolve-file-task-root)
* read the current task file, its open comments, and its parent task
* read its active plan and instruction files, and its lane-ledger entries
* for a first or final review, start from the branch diff against the merge target
* for a repair review, start from the diff since the last completed review
* unless the task is a reconciliation, do not frame a blind review with old comments or earlier verdicts

## Sync File Task Proof State

* before a review request or a `Proven for {{claim_scope}}` claim, change each affected task:
  * `Current State` and `Evidence` match the current source, proof results, and open comments
  * `Next Action` names the next owner's current action
* make sure that each child orchestrator has a parent-visible rollup stop comment that matches [stop-report fields](../references/stop-report-fields.md)
  * if one is missing, stop and report the child task id
* before reviewer comments count, make sure that a `review_round=start` comment comes after the latest repair or failed grade
* set each goal status to the lane phase, and append a lane-ledger entry for each child rollup
* if `scripts/self_task.py validate` exists, run it
* if a record is stale, repair it one time, then stop and report the stale task ids

## Classify File Workstream Fanout

* count the workstreams, modules, repositories, surfaces, owners, and proof paths that you can test apart
* if the count is three or more
  * create one child-orchestrator task and one goal MDScript for each before any implementer task
  * do not put them in one implementer only because they share a repository or test suite

## Use Single Process Fallback

* if thread or subagent tools exist, return to the caller
* before you switch roles in this process, add a file comment
  * name the source role, the target role, the target task, the grants, and the forbidden actions
  * name the proof path and the stop rule
* continue at the target role's entry point, and write later comments as that role
* do not use the fallback to go around a gate for authority, identity, merge, release, deployment, or live proof
* if the next action is local, bounded, and granted, do it now

## Maintain File Lane Ledger

* run [Resolve File Task Root](#resolve-file-task-root)
* for each lane state change, append one JSON object with the [lane-ledger fields](../references/lane-ledger-fields.md) to `{{ledger_file}}`
* after a compaction, resume, or handoff, rebuild state before you act
  * use the task, comment, plan, and goal files, and the ledger
* record a child orchestrator by its thread id and title, not a subagent id
* record the `/mdscript-exec <goal>#resume-goal` re-entry of each active, monitored lane
* if a lane has no owner, parent, status, proof path, next action, or stop report
  * stop before a readiness claim, and report the gap

## Report Stop To File Comments

* set `{{stop_reason}}` to a reason from [stop-report fields](../references/stop-report-fields.md)
* run [Add File Comment](#add-file-comment) as a parent-visible comment
* put every stop field only under `## Stop Report`: the next owner, the next action, the blocker, and the continuation jump
* if you ask for input, add `return_script=`, `resume_command=`, and the pending decision
* for each terminal or superseded thread that you created, add `cleanup_status`
* in a final decision, name how you handled each input that changed the proof path
* if you cannot write the comment
  * record the failure in the lane ledger
  * report the blocker to the nearest parent, and stop

## Mirror External Tracker

* keep the file tasks and comments as the source of truth
* if authority and identity allow it, mirror grades, questions, answers, fixes, evidence, and resolutions to the external tracker
* otherwise stop and report the missing permission or alias
