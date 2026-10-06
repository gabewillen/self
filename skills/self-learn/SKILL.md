---
name: self-learn
description: "ALWAYS use this skill when the user runs /self-learn or explicitly asks for a living-skills reflection pass. Scan only direct user corrections from this conversation. Restate what the user said. Make the smallest change to the project or global skill rules for each scope (Ponytail). This skill never runs automatically. Learn is user-invoked, not a Stop hook."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reflect And Learn

* run this pass only when the user asked for it (`/self-learn`). A harness Stop hook must not force it.
* if the `{{repo_root}}/skills` directory exists
  * set `{{skills_root}}` to `{{repo_root}}/skills`
* otherwise set `{{skills_root}}` to `~/.agents/skills`
* if the user named a conversation range
  * set `{{learn_scope}}` to that range
* otherwise set `{{learn_scope}}` to the full current conversation
* set `{{learn_findings}}` to an empty list
* collect only **user** messages in `{{learn_scope}}`. These are human chat, explicit user corrections, and direct user instructions.
  * collect a direct user instruction only if it changes how future agents must behave
* do **not** use these items as lessons to learn:
  * the debug work, discoveries, and self-critique of the agent
  * tool failures, model failures, and evaluation design
  * best practices that the agent found itself
* if the **user** did not state a rule or correction in their own words
  * do **not** invent a durable rule from incident evidence
* for each user message that is a durable correction (not a one-time task direction for this lane only)
  * quote the words of the user as `{{user_correction_quote}}`
  * set `{{correction_source}}` to that quote
  * if the rule is project-specific, set `{{rule_scope}}` to `project`
  * if the rule is project-agnostic, set `{{rule_scope}}` to `global`
  * append one finding with `summary`, `kind`, `targets`, `rule_scope`, and `user_quote`
    * in `summary`, restate only what the user said
    * set `kind` to `new-rule` | `strengthen` | `disambiguate` | `scope-boundary` | `remove-ambiguity`
* if the user only gave task-local direction with no durable future-agent rule
  * do not append a finding
* if `{{learn_findings}}` is empty
  * set `{{learn_status}}` to `nothing-to-learn`
  * [Report Learn Pass](#report-learn-pass)
* set `{{learn_status}}` to `updating`
* [Apply Findings](#apply-findings)

## Apply Findings

* set `{{correction_source}}` to the `user_quote` of the first finding in `{{learn_findings}}`
* if `{{correction_source}}` is empty or not a direct user quote
  * discard that finding
  * if more findings remain in `{{learn_findings}}`
    * [Apply Findings](#apply-findings)
  * set `{{learn_status}}` to `nothing-to-learn`
  * [Report Learn Pass](#report-learn-pass)
* set `{{correction_kind}}` to the `kind` of that finding
* set `{{skill_update_summary}}` to the `summary` of that finding
* run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)
* remove that finding from `{{learn_findings}}`
* if more findings remain in `{{learn_findings}}`
  * [Apply Findings](#apply-findings)
* set `{{learn_status}}` to `updated`
* [Report Learn Pass](#report-learn-pass)

## Report Learn Pass

* report `learn_status={{learn_status}}` and all `{{skill_files_changed}}`
* if no skill file changed, report that no durable **user-sourced** rule needed a skill change
* stop
