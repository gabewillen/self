---
name: self
description: "ALWAYS use this skill for EVERY request first, before planning or answering, so it can route the role: main agents that are not subagents are orchestrate; subagents are implement (or one blind-lane MDScript); explicit /self-watch, /self-unwatch, /self-goal, /self-automate, /self-learn, /self-troubleshoot, and /self-voice still route first (/self-learn is a user-invoked skill and never runs from a hook; /self-voice and /self-troubleshoot are MDScripts only, not skills; self-common is shared MDScripts/hooks, not a skill); HSM is a review blind lane not a separate skill; review composition stays on the composing process with per-lane fanout only."
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
* [Route User Request](#route-user-request)

## Route User Request

* if `{{agent_position}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* read [boundaries.md](references/boundaries.md) and hold every boundary it names for the routed role

* ask "What would the user do?" from the current request, active local instructions, current evidence, and this installed skill family

* if the installed skills do not carry the needed context, appear stale, or are contradicted by a new user correction
  * run [Load Operating Context](../self-common/workflows/load-operating-context.md#load-operating-context)
  * if the user stated a durable correction in their own words
    * set `{{correction_source}}` to that user quote only
    * run [Update Living Skills](../self-common/workflows/update-living-skills.md#update-living-skills)

* if the request is a standalone interval PR watch that repairs review comments and CI with selected fixer models (`/self-watch`, interval+PR babysit, merge-ready watch loop)
  * set `{{self_role}}` to `self-watch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/self-unwatch`, stop watching a PR, or cancel an armed self-watch loop
  * set `{{self_role}}` to `self-unwatch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/self-learn` or an explicit user request for a living-skills reflection
  * set `{{self_role}}` to `self-learn`
  * never start a learn pass the user did not ask for — no hook, stop report, or role may force one
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/self-voice`, agent-voice drafting, Slack mention reply voice, or public-writing voice check
  * set `{{voice_mdscript}}` to `{{skills_root}}/self-voice/self-voice.mdscript.md`
  * run `/mdscript-exec {{voice_mdscript}}#draft-or-check-agent-voice`
  * stop after that MDScript returns — do not route a skill role for voice

* if `{{agent_position}}` is `main` and the request is `/self-troubleshoot`, or `{{agent_position}}` is `main` and the request reports a bug, failure, regression, outage, flake, or "why is this broken" to diagnose
  * set `{{troubleshoot_mdscript}}` to `{{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md`
  * run `/mdscript-exec {{troubleshoot_mdscript}}#troubleshoot-reported-issue`
  * stop after that MDScript returns — do not route a skill role for troubleshooting; the fix step delegates to `self-implement` from inside it

* if `{{agent_position}}` is `subagent` and the request names troubleshooting
  * keep the delegated worker or blind-lane contract: set `{{self_role}}` to `self-implement`, which holds the reproduce-before-fix gate and enters the troubleshoot MDScript itself when the delegation carries no reproduction
  * [Execute Routed Role](#execute-routed-role)

* if the request is HSM/SML hard-rule review, hierarchical state machine audit, or `/self-hsm-review`
  * set `{{self_role}}` to `self-review`
  * set `{{hsm_in_scope}}` to `true`
  * set `{{forced_lanes}}` to include `hsm` and `eng-hsm` when not already forced
  * run multi-lane review composition on this parent process with HSM lanes selected; do not treat HSM as a separate skill role
  * [Execute Routed Role](#execute-routed-role)

* if the request is a goal-driven proof loop until artifacts and multi-lane adversarial blind review (`/self-goal`, `/goal`, or stricter goal-until-signoff work)
  * set `{{self_role}}` to `self-goal`
  * when the harness already has a `/goal` ability (Grok host `/goal`, Cursor `goal` skill, etc.), self-goal prefers that for multi-round continuation and skips self-goal hooks while still following the self-goal MDScript workflow
  * [Execute Routed Role](#execute-routed-role)

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * set `{{self_role}}` to `self-automate`
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `subagent`
  * set `{{self_role}}` to `self-implement`
  * do not route a subagent into `self-review`, `self-orchestrate`, or `self-goal` as its skill role
  * if the delegated task is a single blind review lane, run only that lane's MDScript entrypoint from the parent packet, not the full review skill
  * [Execute Routed Role](#execute-routed-role)

* if `{{is_root_orchestrator}}` is `true`
  * set `{{self_role}}` to `self-orchestrate`
  * any agent with no parent that is not a subagent is an orchestrator — do not reclassify it as implementer or full-skill reviewer
  * when review is required (only before PR/MR create or merge), the orchestrator owns coordination and either composes multi-lane review on this process or requires the implementer lane to compose it; never treat root as a pure implementer because spawn tools are missing
  * if `{{can_spawn_subagents}}` is `false`
    * use single-process fallback and file-task role switches instead of promising separate subagent lanes
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `main` and a parent reporting path or parent agent exists (child orchestrator or parent-owned main thread)
  * set `{{self_role}}` to `self-orchestrate`
  * [Execute Routed Role](#execute-routed-role)

* set `{{self_role}}` to `self-orchestrate`
* [Execute Routed Role](#execute-routed-role)

## Execute Routed Role

* if `{{self_role}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* if `{{skills_root}}/{{self_role}}/SKILL.md` does not exist
  * stop and report the missing skill path and that the pack needs reinstalling

* run `/mdscript-exec {{skills_root}}/{{self_role}}/SKILL.md`

* carry `{{self_role}}`, `{{agent_position}}`, `{{is_root_orchestrator}}`, `{{parent_agent}}`, `{{parent_reporting_path}}`, and `{{can_spawn_subagents}}` into the routed skill

* if `{{self_role}}` is `self-orchestrate`
  * run `/mdscript-exec {{skills_root}}/self-common/workflows/goal-mdscript.md#write-goal-mdscript` before claiming ongoing monitoring, resumed coordination, or watcher ownership
  * do not claim the lane is resumable until that goal names the exact re-entry point and validation fields

* stop after the routed skill returns
