---
name: self-learn
description: "ALWAYS use this skill when the user runs /self-learn or explicitly asks for a living-skills reflection pass: scan only direct user corrections from this conversation, restate what the user said, and update project or global skill rules per scope. Never runs automatically — learn is user-invoked, not a Stop hook."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reflect And Learn

* this pass runs only when the user asked for it (`/self-learn`) — no harness Stop hook may force it
* set `{{skills_root}}` to `{{repo_root}}/skills` when that directory exists, otherwise `~/.agents/skills`
* set `{{learn_scope}}` to the conversation range the user named; otherwise the whole current conversation
* set `{{learn_findings}}` to an empty list
* collect only **user** messages in `{{learn_scope}}`: human chat, explicit user corrections, and direct user instructions that change how future agents must behave
* do **not** treat the agent's own debugging, discoveries, tool failures, model failures, self-critique, evaluation design, or inferred best practices as learnable lessons
* do **not** invent a durable rule from incident evidence unless the **user** stated that rule or correction in their words
* for each user message that is a durable correction (not one-off task direction for this lane only)
  * quote the user's words as `{{user_correction_quote}}`
  * set `{{correction_source}}` to that quote
  * set `{{rule_scope}}` to `project` when the rule is project-specific, otherwise `global` only when project-agnostic
  * append one finding with `summary` restating only what the user said, `kind` (`new-rule` | `strengthen` | `disambiguate` | `scope-boundary` | `remove-ambiguity`), `targets`, `rule_scope`, and `user_quote`
* if the user only gave task-local direction with no durable future-agent rule
  * do not append a finding
* if `{{learn_findings}}` is empty
  * set `{{learn_status}}` to `nothing-to-learn`
  * [Report Learn Pass](#report-learn-pass)
* set `{{learn_status}}` to `updating`
* [Apply Findings](#apply-findings)

## Apply Findings

* set `{{correction_source}}` to the first finding's `user_quote` in `{{learn_findings}}`
* if `{{correction_source}}` is empty or not a direct user quote
  * discard that finding
  * if more findings remain in `{{learn_findings}}`
    * [Apply Findings](#apply-findings)
  * set `{{learn_status}}` to `nothing-to-learn`
  * [Report Learn Pass](#report-learn-pass)
* set `{{correction_kind}}` to that finding's `kind`
* set `{{skill_update_summary}}` to that finding's `summary`
* run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)
* remove that finding from `{{learn_findings}}`
* if more findings remain in `{{learn_findings}}`
  * [Apply Findings](#apply-findings)
* set `{{learn_status}}` to `updated`
* [Report Learn Pass](#report-learn-pass)

## Report Learn Pass

* report `learn_status={{learn_status}}` and any `{{skill_files_changed}}`, or that nothing durable and **user-sourced** needed a skill update
* stop
