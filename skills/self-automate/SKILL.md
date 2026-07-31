---
name: self-automate
description: "ALWAYS use this skill before calling automation_update or creating, updating, reviewing, or handing off monitors, reminders, PR/MR watchers, blocker watchers, lane wakeups, or thread follow-ups: design MDScript-driven automations with an exact mdscript-exec re-entry, role boundary, cadence, owner, stop condition, evidence/reporting contract, and file-task source of truth."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Automation Context

* read this skill before creating, updating, or reviewing an automation for agent-shaped work

* use this skill before any `automation_update` call or any available automation creation or update tool for agent-shaped work

* if this skill is not present in the active skill list
  * load it by absolute path from `{{repo_root}}/skills/self-automate/SKILL.md`

* infer `{{automation_goal}}`, `{{owner_role}}`, `{{lane_id}}`, `{{thread_id}}`, `{{issue_or_mr}}`, `{{watched_target}}`, `{{cadence}}`, `{{stop_condition}}`, `{{task_mdscript}}`, `{{mdscript_reentry}}`, and `{{reporting_path}}`

* run [Resolve File Task Root](../self-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Read File Task Packet](../self-common/workflows/file-task-comments.md#read-file-task-packet) when the automation belongs to a file task

* if the automation belongs to a role lane
  * read the relevant role skill: `{{repo_root}}/skills/self-orchestrate/SKILL.md`, `{{repo_root}}/skills/self-implement/SKILL.md`, or `{{repo_root}}/skills/self-review/SKILL.md`

* if the automation is for a GitLab issue, MR, PR, comment watcher, blocker watcher, or lane-management wakeup
  * require a stable MDScript heading entry point before creating it

* [Design Automation Contract](#design-automation-contract)

## Design Automation Contract

* state the automation's objective, owner, authority, target, cadence, stop condition, source of truth, file task id, file comment destination, evidence to gather, action allowed, action forbidden, reporting path, and next MDScript entry point

* do not create prose-only automations

* do not create automations whose only durable instruction is "check this and report back"

* if the automation should continue work
  * choose the exact MDScript file and heading that owns the continuation

* if no suitable MDScript heading exists
  * create or request a small workflow heading before creating the automation

* if the explicitly requested automation belongs to orchestrator or implementer MR/PR monitoring
  * set `{{cadence}}` to ten minutes
  * keep the project goal MDScript as the durable source of truth
  * record the next goal resume/check state in the automation contract

* if the automation is only waiting on CI/check state
  * treat CI/check state as monitored state and repair input
  * mark it as a blocker only for default-branch merge decisions or an explicitly narrower repository/user proof gate

* [Select MDScript Reentry](#select-mdscript-reentry)

## Select MDScript Reentry

* set `{{mdscript_reentry}}` to an exact command shaped like `/mdscript-exec <absolute-mdscript-path>#stable-heading`
* verify the target file exists and that `#stable-heading` resolves to a real `##` state before recording the re-entry

* when `{{task_mdscript}}` exists for a watched or resumable lane, prefer `/mdscript-exec {{task_mdscript}}#hot-path-monitor` over generic role or workflow entries

* prefer workflow-file entry points over broad role `SKILL.md` entry points when the workflow file owns the continuation

* common orchestrator re-entry points include:
  * `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/mr-comment-watcher.md#create-mr-comment-watcher`
  * `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/monitor-implementer-lane.md#monitor-implementer-lane`
  * `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision`

* common implementer re-entry points include:
  * `/mdscript-exec {{repo_root}}/skills/self-implement/workflows/mr-monitor.md#create-mr-monitor-goal`
  * `/mdscript-exec {{repo_root}}/skills/self-implement/workflows/blocker-watcher.md#create-blocker-watcher`
  * `/mdscript-exec {{repo_root}}/skills/self-implement/workflows/report-to-orchestrator.md#report-to-orchestrator`

* if another agent must continue at a specific point after the automation fires
  * include that exact `/mdscript-exec` jump in the automation report body

* [Write Automation Body](#write-automation-body)

## Write Automation Body

* write the automation instructions as an MDScript continuation contract with:
  * `{{mdscript_reentry}}`
  * owner role and lane id
  * watched target and source of truth
  * cadence and stop condition
  * allowed actions and forbidden actions
  * evidence fields to record
  * report destination and exact next jump

* include enough state for the automation to resume after thread compaction without relying on chat memory

* for watcher automations, include the task-local context snapshot and instruct the wakeup to refresh live state, compare it to the previous ledger state, execute only the changed hot-path action, and avoid rereading or restating full skill context unless the task script is missing or stale

* require each wakeup to add a file comment only when state changed, a blocker appeared, a deadline passed, unexpected input arrived, or the automation is stopping

* if the automation resumes a `self-orchestrate`, `self-implement`, or `self-review` role flow
  * include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
  * do not claim the automation is correctly configured when the recorded selection does not satisfy the role contract

* include the role-specific GitLab sudo alias requirement when the automation may write GitLab notes, reviews, comments, thread resolutions, close notes, or milestone-progress comments

* require public notes to be sanitized

* require the automation to stop, archive, or ask for authority when the stop condition is reached, the lane is terminal, the target is merged or closed, or the remaining action exceeds authority

* [Confirm Explicit Automation Authority](#confirm-explicit-automation-authority)

## Confirm Explicit Automation Authority

* infer `{{explicit_automation_request}}` only from the current user message

* do not treat an earlier request, durable authority record, goal, handoff, automation record, or agent instruction as a fresh explicit user request

* run [Resolve Goal MDScript](../self-common/workflows/goal-mdscript.md#resolve-goal-mdscript)

* if `{{explicit_automation_request}}` is absent, continue at [Stop Without Automation](#stop-without-automation)

* if `{{goal_mdscript}}` does not exist, continue at [Stop Without Automation](#stop-without-automation)

* record the explicit request evidence and `{{goal_mdscript}}` in the project comment MDScript

* [Create Or Update Automation](#create-or-update-automation)

## Create Or Update Automation

* verify `{{explicit_automation_request}}` and `{{goal_mdscript}}` again before calling an automation tool

* use the available automation tool to create or update the automation from the MDScript body

* if the available automation tool is named `automation_update`
  * call it only after [Write Automation Body](#write-automation-body) has produced the complete MDScript continuation contract

* do not hand-write raw automation directives when the automation tool is available

* do not create, update, replace, or claim an automation active if the automation body lacks the exact `{{mdscript_reentry}}`

* store the automation id, cadence, owner role, lane id, watched target, stop condition, file task id, file comment path, `{{goal_mdscript}}`, and `{{mdscript_reentry}}` in the lane ledger or handoff

* if automation tooling is unavailable
  * set `{{blocker}}` to the exact missing automation capability
  * report the manual next check needed for the current turn

* [Validate Automation Record](#validate-automation-record)

## Validate Automation Record

* verify the saved automation contains the exact `{{mdscript_reentry}}`

* verify `{{mdscript_reentry}}` re-enters `{{goal_mdscript}}`

* verify the automation mirrors the project goal MDScript and does not replace it as the durable source of truth

* verify the saved record includes the explicit user-request evidence

* verify the cadence matches the owner role and active-lane rule

* verify the automation names its file task source of truth, comment destination, stop condition, action limits, reporting path, and next jump

* verify the lane ledger or handoff includes the automation id and re-entry command

* if any required field is missing
  * update the automation before reporting it as active

* [Report Automation](#report-automation)

## Stop Without Automation

* record the missing explicit request or missing project goal MDScript in a project comment MDScript

* do not call an automation tool

* stop

## Report Automation

* report automation id, owner role, lane id, target, cadence, stop condition, source of truth, and exact `{{mdscript_reentry}}`

* add a file comment with the automation contract, validation result, and next check state

* include whether the automation is active, paused, blocked, or terminal

* if `{{blocker}}` is set
  * report `Blocked: {{blocker}}`
  * before asking the user, a repository owner, or another authority surface for input, run [Prepare Prompt Return Script](../self-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `report-automation`
  * ask the smallest decision-ready question needed to proceed
