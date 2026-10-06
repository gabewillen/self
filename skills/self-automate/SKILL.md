---
name: self-automate
description: "ALWAYS use this skill before you create, change, or hand off an automation, or call automation_update. Automations include monitors, reminders, PR watchers, blocker watchers, and lane wakeups. Do not automate work that this process can do now (Ponytail). Use the harness's own loop if one exists. Otherwise build an MDScript automation with an exact mdscript-exec re-entry, owner, cadence, stop condition, and grants. Do it only when the user asked in this message."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Automation Context

* if the work is a one-time action that this process can do now, do it, and do not automate it
* set `{{explicit_automation_request}}` only from the current user message, never from an earlier request, a goal, a handoff, or an agent
* run [Resolve Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#resolve-goal-mdscript)
* if the request or `{{goal_mdscript}}` is missing, record that in a project comment, call no automation tool, and stop
* set the objective, owner role, lane, watched target, source of truth, cadence, and stop condition
* set the grants, forbidden actions, evidence fields, and reporting path
  * an implementer or orchestrator PR monitor uses a ten-minute cadence, and the goal stays the source of truth
  * treat CI state as repair input, and as a blocker only for a default-branch merge
* set `{{mdscript_reentry}}` to `/mdscript-exec <absolute path>#<stable heading>`, and make sure that the heading exists
  * prefer the lane goal's `#resume-goal`, or the workflow heading that owns the continuation, over a broad `SKILL.md`
  * if no heading fits, create a small one first
* if the harness has its own automation, schedule, or loop that can run `{{mdscript_reentry}}`
  * use only it, and start no custom ticker
* otherwise use `automation_update` or the tool that the user asked for
* [Write Automation Body](#write-automation-body)

## Write Automation Body

* write the body as an MDScript continuation:
  * the re-entry, owner, lane, target, source of truth, cadence, and stop condition
  * the grants, evidence, reporting path, and next jump
* include enough state to resume after a compaction without chat memory
* on each wake, refresh the live state, compare it to the ledger, and act only on what changed
  * do not read the full skill context again
* add a file comment only for these events:
  * the state changed, a blocker or unexpected input appeared, a deadline passed, or the automation stops
* for a role flow, include `model`, `reasoning`, and `model_selection_basis`
* for GitLab writes, include the role alias rule, and keep public notes sanitized
* stop, archive, or ask for authority for these events:
  * the stop condition occurs, the target merges or closes, or the next action needs more authority
* create or change the automation only with this complete body and the exact `{{mdscript_reentry}}`
* if no automation tool exists, set `{{blocker}}` to it, and report the manual next check
* [Report Automation](#report-automation)

## Report Automation

* make sure that the saved automation holds these:
  * the exact re-entry into `{{goal_mdscript}}`, and the user's request
  * the stop condition, the limits, and the reporting path
  * the goal stays the source of truth; the automation only mirrors it
* record the automation id, cadence, owner, lane, target, stop condition, task, comment path, goal, and re-entry in the lane ledger
* add a file comment with the contract, the check result, and whether it is active, paused, blocked, or terminal
* if `{{blocker}}` is set, report `Blocked: {{blocker}}`
  * if you need a decision, run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `report-automation`
