<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Require Automate Skill

* before an agent calls `automation_update` or an automation tool that creates or changes an automation
  * [Load Automate Skill](#load-automate-skill)
* examine the automation contract for these fields:
  * `{{mdscript_reentry}}`, the owner role, the lane id, and the watched target
  * the source of truth, the cadence, the stop condition, the allowed actions, and the forbidden actions
  * the parent agent, the reporting path, the next jump, and the stop-report rule
* if a necessary field is not there
  * stop and report the exact fields that are not there
* if the automation is an explicit external watcher and a goal MDScript exists
  * prefer a `{{mdscript_reentry}}` that targets the `{{goal_mdscript}}#resume-goal` of the lane
* make sure that a watcher automation gets the live state again on each wake
* make sure that a watcher automation executes the hot-path action that changed
* make sure that a watcher automation does not read or state the skill context again on each wake
* make sure that a watcher automation executes the related event MDScript jump for these conditions:
  * `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
* make sure that a watcher automation reports `{{event_exec}}` to the parent reporting path before it stops
* if the automation resumes `self-orchestrate`, `self-implement`, or `self-review`
  * run [Select Configured Model And Reasoning](model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to the resumed role
  * make sure that the automation body or the goal MDScript it references has these lines:
    * `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
* make sure that `{{mdscript_reentry}}` is an exact command with the shape `/mdscript-exec <absolute-mdscript-path>#stable-heading`
  * if the shape is wrong, stop and report the incorrect re-entry command
* if no stable MDScript re-entry point exists
  * before you create the automation, create the workflow heading or ask for it
  * if you cannot create the heading, [Block Automation Preflight](#block-automation-preflight)
* until the `self-automate` contract is complete, do not do these actions:
  * call `automation_update` or write raw automation directives by hand
  * create, change, or replace an automation
  * say that an automation is active
* return to the caller

## Load Automate Skill

* if `self-automate` is in the active skill list
  * run `/mdscript-exec {{skills_root}}/self-automate/SKILL.md`
  * run `/mdscript-exec {{skills_root}}/self-automate/SKILL.md#load-automation-context`
  * return to [Require Automate Skill](#require-automate-skill)
* load `self-automate` by absolute path from `{{skills_root}}/self-automate/SKILL.md`
  * if you cannot load the skill, [Block Automation Preflight](#block-automation-preflight)
* run `/mdscript-exec {{skills_root}}/self-automate/SKILL.md`
* run `/mdscript-exec {{skills_root}}/self-automate/SKILL.md#load-automation-context`
* return to [Require Automate Skill](#require-automate-skill)

## Block Automation Preflight

* set `{{blocker}}` to the exact automation skill or MDScript entry point that is not there
* if this is a child orchestrator, implementer, reviewer, or automation lane
  * before you stop, report `Blocked: {{blocker}}` to the parent reporting path
* stop
