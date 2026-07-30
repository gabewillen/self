---
name: gabe
description: "Compatibility router for project-scoped Gabe MDScript operating-model work with tasks, comments, plans, goals, and instructions stored under ~/.agents/projects/project-name/. Use when the user asks for Gabe-shaped judgment, delegation, prioritization, review, messaging, coordination, MR/PR watching, post-merge closure, implementation, or decision support but has not chosen a split role. Routes by agent position: a subagent runs gabe-implement, a main agent that can spawn subagents runs gabe-orchestrate, a main agent that cannot runs gabe-implement, and any review request runs gabe-review. Explicit invocations route to gabe-watch, gabe-unwatch, gabe-goal, gabe-hsm-review, or gabe-automate first. Select the best available model and effort level for each role and task."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Agent Position

* set `{{agent_position}}` to `subagent` when this agent was spawned by another agent, carries a delegated contract, or has a `{{parent_agent}}` or `{{parent_reporting_path}}`
* otherwise set `{{agent_position}}` to `main`
* set `{{can_spawn_subagents}}` to `true` when this runtime exposes a subagent, task, or child-thread creation tool
* otherwise set `{{can_spawn_subagents}}` to `false`
* set `{{is_review_request}}` to `true` when the request is an independent readiness review, blind-review pass, plan, diff, handoff, MR/PR readiness, goal, final report, or publication hygiene review
* [Route Gabe Request](#route-gabe-request)

## Route Gabe Request

* read [boundaries.md](references/boundaries.md) and hold every boundary it names for the routed role

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and this installed skill family

* if the installed skills do not carry the needed context, appear stale, or are contradicted by a new human correction
  * run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)

* if the request is a standalone interval PR watch that repairs review comments and CI with selected fixer models (`/gabe-watch`, interval+PR babysit, merge-ready watch loop)
  * run `/mdscript-exec {{repo_root}}/skills/gabe-watch/SKILL.md` when present, otherwise `/mdscript-exec ~/.agents/skills/gabe-watch/SKILL.md`
  * execute as `gabe-watch`

* if the request is `/gabe-unwatch`, stop watching a PR, or cancel an armed gabe-watch loop
  * run `/mdscript-exec {{repo_root}}/skills/gabe-unwatch/SKILL.md` when present, otherwise `/mdscript-exec ~/.agents/skills/gabe-unwatch/SKILL.md`
  * execute as `gabe-unwatch`

* if the request is HSM/SML hard-rule review, hierarchical state machine audit, or `/gabe-hsm-review`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-hsm-review/SKILL.md` when present, otherwise `/mdscript-exec ~/.agents/skills/gabe-hsm-review/SKILL.md`
  * execute as `gabe-hsm-review`

* if the request is a goal-driven proof loop until artifacts and triple adversarial blind review (`/gabe-goal`, `/goal`, deprecated `/grind`, or stricter goal-until-signoff work)
  * run `/mdscript-exec {{repo_root}}/skills/gabe-goal/SKILL.md` when present, otherwise `/mdscript-exec ~/.agents/skills/gabe-goal/SKILL.md`
  * execute as `gabe-goal`

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * run `/mdscript-exec {{repo_root}}/skills/gabe-automate/SKILL.md`
  * execute as `gabe-automate`

* if `{{is_review_request}}` is `true`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-review/SKILL.md`
  * execute as `gabe-review`

* if `{{agent_position}}` is `subagent`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md`
  * execute as `gabe-implement`

* if `{{agent_position}}` is `main` and `{{can_spawn_subagents}}` is `false`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md`
  * execute as `gabe-implement`
  * own the work in this agent and do not promise delegated lanes this runtime cannot create

* if `{{agent_position}}` is `main` and `{{can_spawn_subagents}}` is `true`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/SKILL.md`
  * execute as `gabe-orchestrate`

* if the request is creating, updating, reviewing, or handing off a recurring monitor, PR/MR watcher, blocker watcher, lane-management wakeup, or thread follow-up while acting as `gabe-orchestrate`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript`

* set `{{gabe_role}}` to the role selected above and carry it into the routed skill
* before any Gabe orchestrator claims ongoing monitoring, resumed coordination, or watcher ownership
  * run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript`
  * do not claim the lane is resumable until the MDScript goal names the exact re-entry point and validation fields

