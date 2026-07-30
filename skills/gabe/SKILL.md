---
name: gabe
description: "Compatibility router for project-scoped Gabe MDScript operating-model work with tasks, comments, plans, goals, and instructions stored under ~/.agents/projects/project-name/. Use when the user asks for Gabe-shaped judgment, delegation, prioritization, review, messaging, coordination, MR/PR watching, post-merge closure, implementation, or decision support but has not chosen a split role. Routes by agent position: a subagent runs gabe-implement, a main agent that can spawn subagents runs gabe-orchestrate, a main agent that cannot runs gabe-implement, and any review request runs gabe-review. Explicit invocations route to gabe-watch, gabe-unwatch, gabe-goal, gabe-hsm-review, or gabe-automate first. Select the best available model and effort level for each role and task."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Agent Position

* set `{{skills_root}}` to `{{repo_root}}/skills` when `{{repo_root}}` is set and that directory exists
* otherwise set `{{skills_root}}` to `~/.agents/skills`
* set `{{agent_position}}` to `subagent` when this agent was spawned by another agent, carries a delegated contract, or has a `{{parent_agent}}` or `{{parent_reporting_path}}`
* otherwise set `{{agent_position}}` to `main`
* set `{{can_spawn_subagents}}` to `true` when this runtime exposes a subagent, task, or child-thread creation tool
* otherwise set `{{can_spawn_subagents}}` to `false`
* set `{{is_review_request}}` to `true` when the request is an independent readiness review, blind-review pass, plan, diff, handoff, MR/PR readiness, goal, final report, or publication hygiene review
* otherwise set `{{is_review_request}}` to `false`
* [Route Gabe Request](#route-gabe-request)

## Route Gabe Request

* if `{{agent_position}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* read [boundaries.md](references/boundaries.md) and hold every boundary it names for the routed role

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and this installed skill family

* if the installed skills do not carry the needed context, appear stale, or are contradicted by a new human correction
  * run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)

* if the request is a standalone interval PR watch that repairs review comments and CI with selected fixer models (`/gabe-watch`, interval+PR babysit, merge-ready watch loop)
  * set `{{gabe_role}}` to `gabe-watch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/gabe-unwatch`, stop watching a PR, or cancel an armed gabe-watch loop
  * set `{{gabe_role}}` to `gabe-unwatch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is HSM/SML hard-rule review, hierarchical state machine audit, or `/gabe-hsm-review`
  * set `{{gabe_role}}` to `gabe-hsm-review`
  * [Execute Routed Role](#execute-routed-role)

* if the request is a goal-driven proof loop until artifacts and triple adversarial blind review (`/gabe-goal`, `/goal`, deprecated `/grind`, or stricter goal-until-signoff work)
  * set `{{gabe_role}}` to `gabe-goal`
  * [Execute Routed Role](#execute-routed-role)

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * set `{{gabe_role}}` to `gabe-automate`
  * [Execute Routed Role](#execute-routed-role)

* if `{{is_review_request}}` is `true`
  * set `{{gabe_role}}` to `gabe-review`
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `subagent`
  * set `{{gabe_role}}` to `gabe-implement`
  * [Execute Routed Role](#execute-routed-role)

* if `{{can_spawn_subagents}}` is `false`
  * set `{{gabe_role}}` to `gabe-implement`
  * do not promise delegated lanes this runtime cannot create
  * [Execute Routed Role](#execute-routed-role)

* set `{{gabe_role}}` to `gabe-orchestrate`
* [Execute Routed Role](#execute-routed-role)

## Execute Routed Role

* if `{{gabe_role}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* if `{{skills_root}}/{{gabe_role}}/SKILL.md` does not exist
  * stop and report the missing skill path and that the pack needs reinstalling

* run `/mdscript-exec {{skills_root}}/{{gabe_role}}/SKILL.md`

* carry `{{gabe_role}}`, `{{agent_position}}`, and `{{can_spawn_subagents}}` into the routed skill

* if `{{gabe_role}}` is `gabe-orchestrate`
  * run `/mdscript-exec {{skills_root}}/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript` before claiming ongoing monitoring, resumed coordination, or watcher ownership
  * do not claim the lane is resumable until that goal names the exact re-entry point and validation fields

* stop after the routed skill returns
