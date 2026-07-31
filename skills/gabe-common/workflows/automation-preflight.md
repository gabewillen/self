<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Require Automate Skill

* before any agent-shaped agent calls `automation_update` or any available automation creation or update tool
  * [Load Automate Skill](#load-automate-skill)
* require the automation contract to include `{{mdscript_reentry}}`, owner role, lane id, watched target, source of truth, cadence, stop condition, allowed actions, forbidden actions, parent agent, reporting path, next jump, and stop-report rule
  * if any required field is missing, stop and report the exact missing contract fields
* for explicit external watcher automations, prefer `{{mdscript_reentry}}` that targets the lane's `{{goal_mdscript}}#resume-goal` when a goal MDScript exists
* require watcher automations to refresh live state and execute the changed hot-path action instead of re-reading or restating skill context on every wake
* require watcher automations to execute the matching event MDScript jump when `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR` conditions are met
* require watcher automations to report `{{event_exec}}` to the parent reporting path before stopping
* if the automation resumes `gabe-orchestrate`, `gabe-implement`, or `gabe-review`
  * run [Select Configured Model And Reasoning](model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to the resumed role
  * require the automation body or referenced goal MDScript to include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
* require `{{mdscript_reentry}}` to be an exact command shaped like `/mdscript-exec <absolute-mdscript-path>#stable-heading`
  * if the shape is wrong, stop and report the invalid re-entry command
* if no stable MDScript re-entry point exists
  * create or request the missing workflow heading before creating the automation
  * if the heading cannot be created, [Block Automation Preflight](#block-automation-preflight)
* do not call `automation_update`, hand-write raw automation directives, create, update, replace, or claim an automation active until the `gabe-automate` contract is complete
* return to the caller

## Load Automate Skill

* if `gabe-automate` is present in the active skill list
  * run `/mdscript-exec {{repo_root}}/skills/gabe-automate/SKILL.md`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-automate/SKILL.md#load-automation-context`
  * return to [Require Automate Skill](#require-automate-skill)
* load `gabe-automate` by absolute path from `{{repo_root}}/skills/gabe-automate/SKILL.md`
  * if the skill cannot be loaded, [Block Automation Preflight](#block-automation-preflight)
* run `/mdscript-exec {{repo_root}}/skills/gabe-automate/SKILL.md`
* run `/mdscript-exec {{repo_root}}/skills/gabe-automate/SKILL.md#load-automation-context`
* return to [Require Automate Skill](#require-automate-skill)

## Block Automation Preflight

* set `{{blocker}}` to the exact missing automation skill or MDScript entry point
* report `Blocked: {{blocker}}` to the parent reporting path before stopping when this is a child orchestrator, implementer, reviewer, or automation lane
* stop
