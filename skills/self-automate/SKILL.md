---
name: self-automate
description: "ALWAYS use this skill before you call automation_update. Also use it before you create, change, review, or hand off monitors, reminders, PR/MR watchers, blocker watchers, lane wakeups, or thread follow-ups. Do not create an automation for work that this process can do now (Ponytail). If the current harness has a built-in automation/loop, use it. Otherwise, design MDScript-driven automations with an exact mdscript-exec re-entry, role boundary, cadence, owner, and stop condition. Also give each one an evidence/reporting contract and a file-task source of truth. Never invent a custom ticker when the harness already gives loops or automations."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Automation Context

* before you create, change, or review an automation for agent-shaped work, read this skill
* if `{{skills_root}}` is empty and this skill has a parent skills directory
  * set `{{skills_root}}` to the parent skills directory of this skill
* before each `automation_update` call or other automation create or change tool for agent-shaped work, use this skill
* if this skill is not present in the active skill list
  * load it by absolute path from `{{skills_root}}/self-automate/SKILL.md`
* set `{{automation_goal}}`, `{{owner_role}}`, `{{lane_id}}`, `{{thread_id}}`, `{{issue_or_mr}}`, `{{watched_target}}`, `{{cadence}}`, `{{stop_condition}}`, `{{task_mdscript}}`, `{{mdscript_reentry}}`, and `{{reporting_path}}` from the current context
* run [Resolve File Task Root](../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* if the automation belongs to a file task
  * run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet)
* if the automation belongs to a role lane
  * read the relevant role skill: `{{skills_root}}/self-orchestrate/SKILL.md`, `{{skills_root}}/self-implement/SKILL.md`, or `{{skills_root}}/self-review/SKILL.md`
* if the automation is for a GitLab issue, MR, PR, comment watcher, blocker watcher, or lane-management wakeup
  * before you create it, make sure that a stable MDScript heading entry point exists
* [Prefer Harness Native Automation](#prefer-harness-native-automation)
* [Design Automation Contract](#design-automation-contract)

## Prefer Harness Native Automation

* if the work is a one-time action that this process can do now
  * do the action now
  * do not create an automation
  * return to the caller
* before you create a custom ticker, detached interval process, or external cron
  * find if the current harness already has automations, scheduled tasks, reminders, native watchers, or equivalent loops
* if that built-in mechanism can own the cadence and invoke the exact `{{mdscript_reentry}}`
  * set `{{harness_native_automation_available}}` to `true`
* otherwise set `{{harness_native_automation_available}}` to `false`
* if `{{harness_native_automation_available}}` is `true`
  * set `{{automation_driver}}` to `harness-native`
  * implement the automation through the harness-native API or control surface only
  * do **not** start `self-watch-ticker.sh`, a hand-rolled sleep loop, or another custom ticker
* if `{{harness_native_automation_available}}` is `false`
  * set `{{automation_driver}}` to `external-or-tool`
  * only then use `automation_update` or another explicit non-harness automation tool that the user requested
* record `automation_driver` in the goal/task evidence for the lane

## Design Automation Contract

* state these items of the automation:
  * the objective, owner, authority, target, cadence, stop condition, and source of truth
  * the file task id, file comment destination, evidence to gather, action allowed, and action forbidden
  * the reporting path and the next MDScript entry point
* do not create prose-only automations
* do not create automations whose only durable instruction is "check this and report back"
* if the automation must continue work
  * choose the exact MDScript file and heading that owns the continuation
* if no suitable MDScript heading exists
  * before you create the automation, create or request a small workflow heading
* if the explicitly requested automation belongs to orchestrator or implementer MR/PR monitor work
  * set `{{cadence}}` to ten minutes
  * keep the project goal MDScript as the durable source of truth
  * record the next goal resume/check state in the automation contract
* if the automation only waits on CI/check state
  * use CI/check state as monitored state and repair input
  * mark it as a blocker only for default-branch merge decisions or an explicitly narrower repository/user proof gate
* [Select MDScript Reentry](#select-mdscript-reentry)

## Select MDScript Reentry

* set `{{mdscript_reentry}}` to an exact command shaped like `/mdscript-exec <absolute-mdscript-path>#stable-heading`
* before you record the re-entry, make sure that the target file exists and `#stable-heading` resolves to a real `##` state
* if `{{task_mdscript}}` exists for a watched or resumable lane
  * use `/mdscript-exec {{task_mdscript}}#hot-path-monitor` instead of generic role or workflow entries
* if the workflow file owns the continuation
  * use workflow-file entry points instead of broad role `SKILL.md` entry points
* common orchestrator re-entry points include:
  * `/mdscript-exec {{skills_root}}/self-orchestrate/workflows/mr-comment-watcher.mdscript.md#create-mr-comment-watcher`
  * `/mdscript-exec {{skills_root}}/self-orchestrate/workflows/monitor-implementer-lane.mdscript.md#monitor-implementer-lane`
  * `/mdscript-exec {{skills_root}}/self-orchestrate/workflows/merge-or-close-decision.mdscript.md#handle-merge-or-close-decision`
* common implementer re-entry points include:
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/mr-monitor.mdscript.md#create-mr-monitor-goal`
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher`
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/report-to-orchestrator.mdscript.md#report-to-orchestrator`
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
* include enough state for the automation to resume after thread compaction without chat memory
* for watcher automations, include the task-local context snapshot
  * tell the wakeup to refresh the live state and compare it to the previous ledger state
  * tell the wakeup to execute only the changed hot-path action
  * if the task script is not missing or stale
    * tell the wakeup not to read again or restate the full skill context
* tell each wakeup to add a file comment only for one of these events:
  * the state changed, a blocker appeared, or a deadline passed
  * unexpected input arrived, or the automation stops
* if the automation resumes a `self-orchestrate`, `self-implement`, or `self-review` role flow
  * include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
  * if the recorded selection does not satisfy the role contract, do not claim that the automation is correctly configured
* if the automation can write GitLab notes, reviews, comments, thread resolutions, close notes, or milestone-progress comments
  * include the role-specific GitLab sudo alias rule
* tell the automation that public notes must be sanitized
* tell the automation to stop, archive, or ask for authority if one of these events occurs:
  * the stop condition occurs, or the lane is terminal
  * the target is merged or closed, or the remaining action is more than the authority
* [Confirm Explicit Automation Authority](#confirm-explicit-automation-authority)

## Confirm Explicit Automation Authority

* find `{{explicit_automation_request}}` only in the current user message
* do not use an earlier request, a durable authority record, or a goal as a fresh explicit user request
* do not use a handoff, an automation record, or an agent instruction as a fresh explicit user request
* run [Resolve Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#resolve-goal-mdscript)
* if `{{explicit_automation_request}}` is absent, continue at [Stop Without Automation](#stop-without-automation)
* if `{{goal_mdscript}}` does not exist, continue at [Stop Without Automation](#stop-without-automation)
* record the explicit request evidence and `{{goal_mdscript}}` in the project comment MDScript
* [Create Or Update Automation](#create-or-update-automation)

## Create Or Update Automation

* before you call an automation tool, examine `{{explicit_automation_request}}` and `{{goal_mdscript}}` again
* use the available automation tool to create or change the automation from the MDScript body
* if the available automation tool is named `automation_update`
  * call it only after [Write Automation Body](#write-automation-body) made the complete MDScript continuation contract
* if the automation tool is available, do not hand-write raw automation directives
* if the automation body does not have the exact `{{mdscript_reentry}}`
  * do not create, change, replace, or claim an active automation
* store these items in the lane ledger or handoff:
  * the automation id, cadence, owner role, lane id, watched target, and stop condition
  * the file task id, file comment path, `{{goal_mdscript}}`, and `{{mdscript_reentry}}`

* if the automation tools are not available
  * set `{{blocker}}` to the exact missing automation capability
  * report the manual next check that is necessary for the current turn

* [Validate Automation Record](#validate-automation-record)

## Validate Automation Record

* make sure that the saved automation contains the exact `{{mdscript_reentry}}`
* make sure that `{{mdscript_reentry}}` re-enters `{{goal_mdscript}}`
* make sure that the automation mirrors the project goal MDScript
* make sure that the automation does not replace that goal as the durable source of truth
* make sure that the saved record includes the explicit user-request evidence
* make sure that the cadence matches the owner role and active-lane rule
* make sure that the automation names these items:
  * its file task source of truth, comment destination, and stop condition
  * its action limits, reporting path, and next jump
* make sure that the lane ledger or handoff includes the automation id and re-entry command

* if a necessary field is missing
  * before you report the automation as active, change it

* [Report Automation](#report-automation)

## Stop Without Automation

* record the missing explicit request or missing project goal MDScript in a project comment MDScript
* do not call an automation tool
* stop

## Report Automation

* report the automation id, owner role, lane id, target, cadence, stop condition, source of truth, and exact `{{mdscript_reentry}}`
* add a file comment with the automation contract, validation result, and next check state
* include whether the automation is active, paused, blocked, or terminal
* if `{{blocker}}` is set
  * report `Blocked: {{blocker}}`
  * before you ask the user, a repository owner, or another authority surface for input
    * run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `report-automation`
  * ask the smallest decision-ready question that is necessary to continue
