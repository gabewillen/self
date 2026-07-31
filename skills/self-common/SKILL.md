---
name: self-common
description: "ALWAYS use this skill when another skill links into self-common/workflows or when installing this skill pack: shared MDScript primitives for goals, lane ledgers, return scripts, thread events, operating-context load, living skill updates, the /self-learn MDScript (not a skill), report boundaries, and related coordination."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Shared Workflow

* set `{{workflow}}` from the caller link or request (for example `goal-mdscript`, `lane-ledger`, `return-script`)
* if `{{workflow}}` is empty
  * list files under `workflows/`
  * ask the user for `{{workflow}}` by naming which shared workflow to run
  * [Use Shared Workflow](#use-shared-workflow)
* run `/mdscript-exec {{repo_root}}/skills/self-common/workflows/{{workflow}}.md`
* stop and report the workflow path used
