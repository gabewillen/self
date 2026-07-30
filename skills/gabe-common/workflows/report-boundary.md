<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report Status

* report count-first, evidence-first, and plainly

* treat reporting back to the parent agent as a hard stop condition for every child orchestrator, implementer, reviewer, and goal-resumed Gabe lane

* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)

* before any child orchestrator, implementer, reviewer, or goal-resumed Gabe lane stops for any reason
  * set `{{stop_reason}}` to `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, `watcher-terminal`, or the closest exact reason
  * run [Report Stop To File Comments](file-task-comments.md#report-stop-to-file-comments)
  * run [Cleanup Created Threads](thread-cleanup.md#cleanup-created-threads) for any chat thread, child lane thread, worker thread, reviewer thread, or subagent this lane created
  * report to `{{parent_agent}}` or `{{parent_reporting_path}}`
  * include `{{event_exec}}` and `{{event_type}}` when a disposition, drift, unacked handoff, stale MR, blocker, or terminal watcher condition exists
  * name the next owner and next action when any work remains

* do not close, delete, archive, stop polling, or go silent until the parent-visible file comment and parent report exist; if either report cannot be sent, record the failed report attempt, reason, and fallback location in the parent-visible ledger or source of truth

* do not claim a terminal lane is clean while any terminal or superseded child chat thread created by this lane remains open without a cleanup blocker, transfer record, or explicit durable-owner handoff

* use `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`

* name objective, owner, parent agent or reporting path, phase, stop reason when stopping, event execution and event type when applicable, issue/MR/PR, referenced tickets, `{{claim_scope}}`, contract preconditions, postconditions, invariants, proof path, local resource path when resources are involved, proof completed, proof not claimed, proof missing, review state, watcher state, residual risk, and exact authority needed

* when a project control-plane workflow has a final parent-visible comment with `proof_decision: Proven for {{claim_scope}}`, all owned child and implementer tasks are terminal for that claim, reviewer consensus is recorded, and no next action remains inside granted authority
  * stop after reporting that terminal state
  * perform required thread cleanup for created terminal or superseded chat threads, then stop
  * do not start open-ended cleanup, extra proof, extra review, publication, issue closure, merge preparation, or broader readiness work
  * only do bounded hygiene that is explicitly required to keep the proven diff clean; if hygiene cannot finish immediately, record it as follow-up instead of looping

* in repo-local single-process fallback, a parent-visible terminal comment on the root task with `proof_decision: Proven for {{claim_scope}}` is the parent/root report
  * set `next_owner` to `none` when no granted work remains
  * do not switch back to another role just to write a duplicate final comment
  * if checks or hygiene run after that terminal comment and do not change the proof decision, do not add another final comment; return the final response from the existing terminal record

* mention routine polling only when it changed state

* if `{{blocker}}` is set
  * if the blocker is missing infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or a safe target, report the local resource path attempted or why no local path can satisfy it
  * report `Blocked for {{claim_scope}}: {{blocker}}`
  * before asking Gabe, the user, a repository owner, or another authority surface for input, run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this workflow and `{{return_resume_heading}}` set to `report-status`
  * ask the smallest decision-ready question needed to proceed

* do not replace missing evidence with confidence
