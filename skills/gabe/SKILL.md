---
name: gabe
description: "ALWAYS use this skill for EVERY request first, before planning or answering, so it can route the role: main agents that are not subagents are orchestrate; subagents are implement (or one blind-lane MDScript); explicit /gabe-watch, /gabe-unwatch, /gabe-goal, /gabe-automate, and /gabe-learn still route first (/gabe-learn is an MDScript only, not a skill); HSM is a review blind lane not a separate skill; review composition stays on the composing process with per-lane fanout only."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Agent Position

* set `{{skills_root}}` to `{{repo_root}}/skills` when `{{repo_root}}` is set and that directory exists
* otherwise set `{{skills_root}}` to `~/.agents/skills`
* infer `{{parent_agent}}` and `{{parent_reporting_path}}` from the spawn contract, handoff, task file, or runtime parent fields when present
* set `{{agent_position}}` to `subagent` when this agent was spawned by another agent, carries a delegated worker contract, or has a non-empty `{{parent_agent}}` or `{{parent_reporting_path}}`
* otherwise set `{{agent_position}}` to `main`
* set `{{is_root_orchestrator}}` to `true` when `{{agent_position}}` is `main` and `{{parent_agent}}` is empty and `{{parent_reporting_path}}` is empty
* otherwise set `{{is_root_orchestrator}}` to `false`
* set `{{can_spawn_subagents}}` to `true` when this runtime exposes a subagent, task, or child-thread creation tool
* otherwise set `{{can_spawn_subagents}}` to `false`
* [Route Gabe Request](#route-gabe-request)

## Route Gabe Request

* if `{{agent_position}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* read [boundaries.md](references/boundaries.md) and hold every boundary it names for the routed role

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and this installed skill family

* if the installed skills do not carry the needed context, appear stale, or are contradicted by a new human correction
  * run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)
  * set `{{correction_source}}` to the human correction or named skill gap
  * run [Update Living Skills](../gabe-common/workflows/update-living-skills.md#update-living-skills)

* if the request is a standalone interval PR watch that repairs review comments and CI with selected fixer models (`/gabe-watch`, interval+PR babysit, merge-ready watch loop)
  * set `{{gabe_role}}` to `gabe-watch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/gabe-unwatch`, stop watching a PR, or cancel an armed gabe-watch loop
  * set `{{gabe_role}}` to `gabe-unwatch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/gabe-learn`, a stop-hook learn pass, or a forced living-skills reflection
  * set `{{learn_mdscript}}` to `{{skills_root}}/gabe-common/workflows/gabe-learn.mdscript.md`
  * run `/mdscript-exec {{learn_mdscript}}#reflect-and-learn`
  * stop after that MDScript returns — do not route a skill role for learn

* if the request is HSM/SML hard-rule review, hierarchical state machine audit, or `/gabe-hsm-review`
  * set `{{gabe_role}}` to `gabe-review`
  * set `{{hsm_in_scope}}` to `true`
  * set `{{forced_lanes}}` to include `hsm` and `eng-hsm` when not already forced
  * run gabe-review composition on this parent process with HSM lanes selected; do not treat HSM as a separate skill role
  * [Execute Routed Role](#execute-routed-role)

* if the request is a goal-driven proof loop until artifacts and multi-lane adversarial blind review (`/gabe-goal`, `/goal`, or stricter goal-until-signoff work)
  * set `{{gabe_role}}` to `gabe-goal`
  * when the harness already has a `/goal` ability (Grok host `/goal`, Cursor `goal` skill, etc.), gabe-goal prefers that for multi-round continuation and skips gabe-goal hooks while still following the gabe-goal MDScript workflow
  * [Execute Routed Role](#execute-routed-role)

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * set `{{gabe_role}}` to `gabe-automate`
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `subagent`
  * set `{{gabe_role}}` to `gabe-implement`
  * do not route a subagent into `gabe-review`, `gabe-orchestrate`, or `gabe-goal` as its skill role
  * if the delegated task is a single blind review lane, run only that lane's MDScript entrypoint from the parent packet, not the full gabe-review skill
  * [Execute Routed Role](#execute-routed-role)

* if `{{is_root_orchestrator}}` is `true`
  * set `{{gabe_role}}` to `gabe-orchestrate`
  * any agent with no parent that is not a subagent is an orchestrator — do not reclassify it as implementer or full-skill reviewer
  * when review is required, the orchestrator owns coordination and either composes multi-lane review on this process or requires the implementer lane to compose it; never treat root as a pure implementer because spawn tools are missing
  * if `{{can_spawn_subagents}}` is `false`
    * use single-process fallback and file-task role switches instead of promising separate subagent lanes
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `main` and a parent reporting path or parent agent exists (child orchestrator or parent-owned main thread)
  * set `{{gabe_role}}` to `gabe-orchestrate`
  * [Execute Routed Role](#execute-routed-role)

* set `{{gabe_role}}` to `gabe-orchestrate`
* [Execute Routed Role](#execute-routed-role)

## Execute Routed Role

* if `{{gabe_role}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* if `{{skills_root}}/{{gabe_role}}/SKILL.md` does not exist
  * stop and report the missing skill path and that the pack needs reinstalling

* run `/mdscript-exec {{skills_root}}/{{gabe_role}}/SKILL.md`

* carry `{{gabe_role}}`, `{{agent_position}}`, `{{is_root_orchestrator}}`, `{{parent_agent}}`, `{{parent_reporting_path}}`, and `{{can_spawn_subagents}}` into the routed skill

* if `{{gabe_role}}` is `gabe-orchestrate`
  * run `/mdscript-exec {{skills_root}}/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript` before claiming ongoing monitoring, resumed coordination, or watcher ownership
  * do not claim the lane is resumable until that goal names the exact re-entry point and validation fields

* stop after the routed skill returns
