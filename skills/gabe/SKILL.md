---
name: gabe
description: "Compatibility router for project-scoped Gabe MDScript operating-model work with tasks, comments, plans, goals, and instructions stored under ~/.agents/projects/project-name/. Use when the user asks for Gabe-shaped judgment, delegation, prioritization, review, messaging, coordination, MR/PR watching, post-merge closure, implementation, or decision support but has not chosen a split role. Route standalone interval PR repair watches to gabe-watch, coordination to gabe-orchestrate, implementation to gabe-implement, and independent review to gabe-review. Use gpt-5.6 Sol with medium reasoning for orchestrators and select a task-appropriate gpt-5.6-family model and reasoning level for implementers and reviewers."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Route Gabe Request

* infer `{{gabe_role}}` from the request, current thread role, and any handoff contract

* read [boundaries.md](references/boundaries.md) and hold every boundary it names for the routed role

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and this installed skill family

* if the installed skills do not carry the needed context, appear stale, or are contradicted by a new human correction
  * run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)

* if the request is a standalone interval PR watch that repairs review comments and CI with composer-2.5 / grok-4.5 fixers (`/gabe-watch`, interval+PR babysit, merge-ready watch loop)
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

* if the request is creating, updating, reviewing, or handing off a recurring monitor, PR/MR watcher, blocker watcher, lane-management wakeup, or thread follow-up for project-scoped Gabe work
  * run `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/SKILL.md`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript`
  * execute as `gabe-orchestrate`

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * run `/mdscript-exec {{repo_root}}/skills/gabe-automate/SKILL.md`
  * execute as `gabe-automate`

* if the request is root coordination, prioritization, delegation, lane setup, lane monitoring, MR/PR comment watching, permission-boundary decision, proof intake, post-merge ticket closure, publication decision, or decision-ready reporting
  * run `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/SKILL.md`
  * execute as `gabe-orchestrate`

* if the request is delegated implementation, issue execution, repo repair, MR/PR ownership, verification, review repair, or release-prep work
  * run `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md`
  * execute as `gabe-implement`

* if the request is independent readiness review, blind-review pass, plan review, diff review, handoff review, MR/PR readiness review, goal review, final report review, or publication hygiene review
  * run `/mdscript-exec {{repo_root}}/skills/gabe-review/SKILL.md`
  * execute as `gabe-review`

* if the role is ambiguous
  * default root or coordinating threads to `gabe-orchestrate`
  * default worker threads with a delegated implementation contract to `gabe-implement`
  * default explicit review requests to `gabe-review`

* before any Gabe orchestrator claims ongoing monitoring, resumed coordination, or watcher ownership
  * run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript`
  * do not claim the lane is resumable until the MDScript goal names the exact re-entry point and validation fields

