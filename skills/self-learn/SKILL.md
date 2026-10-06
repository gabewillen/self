---
name: self-learn
description: "ALWAYS use this skill when the user runs /self-learn or explicitly asks for a living-skills reflection. Scan only direct user corrections in this conversation, and restate only what the user said. Make the smallest project or global skill change for each (Ponytail). It never runs from a hook."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reflect And Learn

* run this pass only when the user asked for it; no hook forces it
* set `{{learn_scope}}` to the range that the user named, or this conversation
* collect only user messages in `{{learn_scope}}` that state a durable rule for future agents
  * never learn from agent debugging, discoveries, failures, self-critique, or best practices that the agent found
  * skip one-time directions for this task
* for each durable correction
  * set `{{correction_source}}` to the user's quote
  * run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)
* report `learn_status` as `updated` with each changed file, or `nothing-to-learn` when the user stated no durable rule
* stop
