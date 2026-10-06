<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report Status

* report the result first, then counts and evidence, in plain words
* name each skipped item as `skipped: <item>, add when <trigger>`
* use the label `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`
* name the objective, owner, phase, PR or ticket, claim scope, and proof path
* name the proof that is complete, not claimed, and missing, with the residual risk and the authority that you need
* report a routine poll only if it changed the state
* do not put confidence in place of evidence
* if `{{blocker}}` is set, [Report Blocker](#report-blocker)
* if this lane has a parent and it stops for any reason, [Emit Stop Package](#emit-stop-package)
* return to the caller

## Emit Stop Package

* set `{{stop_reason}}` to `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, or `watcher-terminal`
* run [Report Stop To File Comments](file-task-comments.mdscript.md#report-stop-to-file-comments)
* run [Cleanup Created Threads](thread-cleanup.mdscript.md#cleanup-created-threads)
* report to `{{parent_agent}}` or `{{parent_reporting_path}}`, with `{{event_exec}}` when an event applies, and the next owner and action when work remains
* do not close, archive, or go silent until the parent can see the comment and the report
  * if you cannot write them, record the failure where the parent can see it, and stop
* if the claim is `Proven for {{claim_scope}}` and no granted action remains
  * stop, and do not start more proof, review, cleanup, publication, or merge work
  * do not switch roles only to write a second final comment
* return to the caller

## Report Blocker

* for an infrastructure, service, browser, or safe-target blocker, name the local resource path that you tried, or why none fits
* report `Blocked for {{claim_scope}}: {{blocker}}`
* if the lane needs an authority answer
  * set `{{return_source_workflow}}` to this workflow
  * set `{{return_resume_heading}}` to `report-status`
  * run [Prepare Prompt Return Script](return-script.mdscript.md#prepare-prompt-return-script)
  * ask the smallest decision question, and stop
* stop
