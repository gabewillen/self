---
name: self
description: "ALWAYS use this skill first, for every request. It picks the role. Every role does the least work that works (Ponytail). A subagent is implement, or one blind review lane. A main agent asks once whether to orchestrate with subagents or work directly, before it writes or edits. Self-review runs only when the user asks. /self-watch, /self-unwatch, /self-goal, /self-automate, /self-learn, /self-troubleshoot, and /self-voice route here first. /self-learn never runs from a hook."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Route User Request

* if the `{{repo_root}}/skills` directory exists, set `{{skills_root}}` to it
* otherwise set `{{skills_root}}` to `~/.agents/skills`
* find `{{parent_agent}}` and `{{parent_reporting_path}}` in the spawn contract, handoff, or task file
* if another agent spawned this agent, or either parent value is set
  * set `{{agent_position}}` to `subagent`
* otherwise set `{{agent_position}}` to `main`
* if this runtime has a tool that creates a subagent or a child thread, set `{{can_spawn_subagents}}` to `true`
* read [boundaries.md](references/boundaries.md), and hold each boundary for the role
* ask "What would the user do?" from the request, the local instructions, and the current evidence
* if the user stated a durable correction in their own words
  * set `{{correction_source}}` to that quote only
  * run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)
* [Pick Role](#pick-role)

## Pick Role

* if the request is `/self-watch`, or an interval watch of a PR, set `{{self_role}}` to `self-watch`
* if the request is `/self-unwatch`, or asks to stop a PR watch, set `{{self_role}}` to `self-unwatch`
* if the request is `/self-learn`, or the user explicitly asks for a living-skills reflection, set `{{self_role}}` to `self-learn`
* if the user explicitly asks for an automation, set `{{self_role}}` to `self-automate`
* if `{{self_role}}` is set, [Execute Routed Role](#execute-routed-role)
* if the request is `/self-voice`, or a voice draft or check
  * run `/mdscript-exec {{skills_root}}/self-voice/self-voice.mdscript.md#draft-or-check-agent-voice`
  * stop
* if `{{agent_position}}` is `subagent`
  * set `{{self_role}}` to `self-implement`
  * if the task is one blind review lane, run only that lane MDScript from the parent packet
  * [Execute Routed Role](#execute-routed-role)
* if the request is `/self-hsm-review`, or a hierarchical state machine audit
  * set `{{self_role}}` to `self-review`
  * set `{{hsm_in_scope}}` to `true`
  * add `hsm` and `eng-hsm` to `{{forced_lanes}}`
  * [Execute Routed Role](#execute-routed-role)
* run [Decide Execution Mode](../self-common/workflows/execution-mode.mdscript.md#decide-execution-mode)
* if the request is `/self-troubleshoot`, or reports a bug, failure, regression, outage, or flake
  * run `/mdscript-exec {{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md#troubleshoot-reported-issue` with `{{execution_mode}}`
  * stop
* if the request is `/self-goal` or `/goal`
  * set `{{self_role}}` to `self-goal`
* if `{{self_role}}` is empty and `{{execution_mode}}` is `direct`
  * set `{{self_role}}` to `self-implement`
  * set `{{parent_reporting_path}}` to the user conversation
* if `{{self_role}}` is empty
  * set `{{self_role}}` to `self-orchestrate`
  * if `{{can_spawn_subagents}}` is `false`, use the single-process fallback, not separate lanes
* [Execute Routed Role](#execute-routed-role)

## Execute Routed Role

* if `{{skills_root}}/{{self_role}}/SKILL.md` does not exist
  * stop, and tell the user to install the pack again
* run `/mdscript-exec {{skills_root}}/{{self_role}}/SKILL.md`
* carry `{{agent_position}}`, `{{execution_mode}}`, `{{parent_agent}}`, `{{parent_reporting_path}}`, and `{{can_spawn_subagents}}` into it
* stop after the routed skill returns
