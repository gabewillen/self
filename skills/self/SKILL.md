---
name: self
description: "ALWAYS use this skill for EVERY request first, before you plan or answer. This skill routes the role. Main agents that are not subagents are orchestrate. Subagents are implement (or one blind-lane MDScript). Explicit /self-watch, /self-unwatch, /self-goal, /self-automate, /self-learn, /self-troubleshoot, and /self-voice also route first. /self-learn is a user-invoked skill and never runs from a hook. /self-voice and /self-troubleshoot are skills whose bodies are in a linked MDScript. self-common is shared MDScripts/hooks, not a skill. HSM is a review blind lane, not a separate skill. The process that composes a review keeps that composition, with per-lane fanout only."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Agent Position

* if `{{repo_root}}` is set and the `{{repo_root}}/skills` directory exists
  * set `{{skills_root}}` to `{{repo_root}}/skills`
* otherwise set `{{skills_root}}` to `~/.agents/skills`
* if the spawn contract, handoff, task file, or runtime parent fields are present
  * find `{{parent_agent}}` and `{{parent_reporting_path}}` in them
* set `{{agent_position}}` to `main`
* if another agent spawned this agent
  * set `{{agent_position}}` to `subagent`
* if this agent has a delegated worker contract
  * set `{{agent_position}}` to `subagent`
* if `{{parent_agent}}` or `{{parent_reporting_path}}` is not empty
  * set `{{agent_position}}` to `subagent`
* if `{{agent_position}}` is `main` and `{{parent_agent}}` and `{{parent_reporting_path}}` are empty
  * set `{{is_root_orchestrator}}` to `true`
* otherwise set `{{is_root_orchestrator}}` to `false`
* if this runtime has a tool that creates a subagent, a task, or a child thread
  * set `{{can_spawn_subagents}}` to `true`
* otherwise set `{{can_spawn_subagents}}` to `false`
* [Route User Request](#route-user-request)

## Route User Request

* if `{{agent_position}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* read [boundaries.md](references/boundaries.md) and hold every boundary it names for the routed role

* ask "What would the user do?" Use the current request, active local instructions, current evidence, and this installed skill family.

* if the installed skills do not have the necessary context, are stale, or a new user correction contradicts them
  * run [Load Operating Context](../self-common/workflows/load-operating-context.mdscript.md#load-operating-context)
  * if the user stated a durable correction in their own words
    * set `{{correction_source}}` to that user quote only
    * run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)

* if the request is a standalone interval PR watch that repairs review comments and CI with selected fixer models. Examples are `/self-watch`, interval+PR babysit, and a merge-ready watch loop.
  * set `{{self_role}}` to `self-watch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/self-unwatch`, a request to stop a PR watch, or to cancel an armed self-watch loop
  * set `{{self_role}}` to `self-unwatch`
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/self-learn` or an explicit user request for a living-skills reflection
  * set `{{self_role}}` to `self-learn`
  * do not start a learn pass that the user did not ask for. A hook, a stop report, or a role must not force one.
  * [Execute Routed Role](#execute-routed-role)

* if the request is `/self-voice`, an agent-voice draft, a Slack mention reply voice, or a public-writing voice check
  * set `{{voice_mdscript}}` to `{{skills_root}}/self-voice/self-voice.mdscript.md`
  * run `/mdscript-exec {{voice_mdscript}}#draft-or-check-agent-voice`
  * stop after that MDScript returns. Voice is its own skill, so do not also route an orchestrate or implement role for it.

* if `{{agent_position}}` is `main` and the request is `/self-troubleshoot` or reports a problem to diagnose. A problem is a bug, failure, regression, outage, flake, or "why is this broken".
  * set `{{troubleshoot_mdscript}}` to `{{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md`
  * run `/mdscript-exec {{troubleshoot_mdscript}}#troubleshoot-reported-issue`
  * stop after that MDScript returns. Troubleshoot is its own skill, and its fix step delegates to `self-implement` from inside it.

* if `{{agent_position}}` is `subagent` and the request names troubleshoot work
  * keep the delegated worker or blind-lane contract
  * set `{{self_role}}` to `self-implement`. It holds the reproduce-before-fix gate. If the delegation has no reproduction, it enters the troubleshoot MDScript itself.
  * [Execute Routed Role](#execute-routed-role)

* if the request is HSM/SML hard-rule review, hierarchical state machine audit, or `/self-hsm-review`
  * set `{{self_role}}` to `self-review`
  * set `{{hsm_in_scope}}` to `true`
  * if `{{forced_lanes}}` does not include `hsm` and `eng-hsm`, add them to `{{forced_lanes}}`
  * run multi-lane review composition on this parent process with the HSM lanes selected
  * do not use HSM as a separate skill role
  * [Execute Routed Role](#execute-routed-role)

* if the request is a goal-driven proof loop until artifacts and multi-lane adversarial blind review exist. Examples are `/self-goal`, `/goal`, and stricter goal-until-signoff work.
  * set `{{self_role}}` to `self-goal`
  * if the harness already has a `/goal` ability (Grok host `/goal`, Cursor `goal` skill, and others)
    * self-goal uses that ability for multi-round continuation and does not use the self-goal hooks
    * self-goal continues to follow the self-goal MDScript workflow
  * [Execute Routed Role](#execute-routed-role)

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * set `{{self_role}}` to `self-automate`
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `subagent`
  * set `{{self_role}}` to `self-implement`
  * do not route a subagent into `self-review`, `self-orchestrate`, or `self-goal` as its skill role
  * if the delegated task is a single blind review lane
    * run only the MDScript entrypoint of that lane from the parent packet, not the full review skill
  * [Execute Routed Role](#execute-routed-role)

* if `{{is_root_orchestrator}}` is `true`
  * set `{{self_role}}` to `self-orchestrate`
  * an agent with no parent that is not a subagent is an orchestrator. Do not change it to implementer or full-skill reviewer.
  * if review is necessary (only before PR/MR create or merge)
    * the orchestrator owns coordination
    * compose multi-lane review on this process, or tell the implementer lane that it must compose it
  * if spawn tools are missing, do not use root as a pure implementer
  * if `{{can_spawn_subagents}}` is `false`
    * use single-process fallback and file-task role switches instead of a promise of separate subagent lanes
  * [Execute Routed Role](#execute-routed-role)

* if `{{agent_position}}` is `main` and a parent reporting path or a parent agent exists. Examples are a child orchestrator and a parent-owned main thread.
  * set `{{self_role}}` to `self-orchestrate`
  * [Execute Routed Role](#execute-routed-role)

* set `{{self_role}}` to `self-orchestrate`
* [Execute Routed Role](#execute-routed-role)

## Execute Routed Role

* if `{{self_role}}` is empty
  * [Detect Agent Position](#detect-agent-position)

* if `{{skills_root}}/{{self_role}}/SKILL.md` does not exist
  * stop and report the missing skill path. Tell the user to install the pack again.

* run `/mdscript-exec {{skills_root}}/{{self_role}}/SKILL.md`

* carry `{{self_role}}`, `{{agent_position}}`, `{{is_root_orchestrator}}`, `{{parent_agent}}`, `{{parent_reporting_path}}`, and `{{can_spawn_subagents}}` into the routed skill

* if `{{self_role}}` is `self-orchestrate`
  * before you claim a continuous monitor, resumed coordination, or watcher ownership
    * run `/mdscript-exec {{skills_root}}/self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript`
  * if that goal does not name the exact re-entry point and validation fields
    * do not claim that the lane is resumable

* stop after the routed skill returns
