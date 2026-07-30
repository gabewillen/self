---
name: gabe-common
description: >-
  Shared MDScript workflows used by the Gabe skill family (goal MDScripts,
  lane ledger, return scripts, thread events, operating-context load, report
  boundary, and related coordination primitives). Use when a Gabe skill links
  into gabe-common/workflows or when installing the Gabe skill pack.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Shared Workflow

* set `{{workflow}}` from the caller link or request (for example `goal-mdscript`, `lane-ledger`, `return-script`)
* if `{{workflow}}` is empty
  * list files under `workflows/`
  * ask the user which shared workflow to run
  * [Use Shared Workflow](#use-shared-workflow)
* run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/{{workflow}}.md`
* stop and report the workflow path used
