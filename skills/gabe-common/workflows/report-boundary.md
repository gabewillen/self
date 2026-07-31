<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report Status

* report count-first, evidence-first, and plainly
* treat reporting back to the parent agent as a hard stop condition for every child orchestrator, implementer, reviewer, and goal-resumed Agent lane
* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)
* before any child orchestrator, implementer, reviewer, or goal-resumed Agent lane stops for any reason
  * [Emit Stop Package](#emit-stop-package)
* if a project control-plane workflow has a final parent-visible comment with `proof_decision: Proven for {{claim_scope}}`, all owned child and implementer tasks are terminal for that claim, reviewer consensus is recorded, and no next action remains inside granted authority
  * [Close Terminal Proven Lane](#close-terminal-proven-lane)
* if repo-local single-process fallback has a parent-visible terminal comment on the root task with `proof_decision: Proven for {{claim_scope}}`
  * [Close Single Process Terminal](#close-single-process-terminal)
* if `{{blocker}}` is set
  * [Report Blocker](#report-blocker)
* use status labels `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`
* name objective, owner, parent agent or reporting path, phase, stop reason when stopping, event execution and event type when applicable, issue/MR/PR, referenced tickets, `{{claim_scope}}`, contract preconditions, postconditions, invariants, proof path, local resource path when resources are involved, proof completed, proof not claimed, proof missing, review state, watcher state, residual risk, and exact authority needed
* mention routine polling only when it changed state
* do not replace missing evidence with confidence
* return to the caller

## Emit Stop Package

* set `{{stop_reason}}` to `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, `watcher-terminal`, or the closest exact reason
* run [Report Stop To File Comments](file-task-comments.md#report-stop-to-file-comments)
* run [Cleanup Created Threads](thread-cleanup.md#cleanup-created-threads) for any chat thread, child lane thread, worker thread, reviewer thread, or subagent this lane created
* report to `{{parent_agent}}` or `{{parent_reporting_path}}`
* include `{{event_exec}}` and `{{event_type}}` when a disposition, drift, unacked handoff, stale MR, blocker, or terminal watcher condition exists
* name the next owner and next action when any work remains
* if the parent-visible file comment or parent report cannot be sent
  * record the failed report attempt, reason, and fallback location in the parent-visible ledger or source of truth
  * stop
* do not close, delete, archive, stop polling, or go silent until the parent-visible file comment and parent report exist
* do not claim a terminal lane is clean while any terminal or superseded child chat thread created by this lane remains open without a cleanup blocker, transfer record, or explicit durable-owner handoff
* return to the caller

## Close Terminal Proven Lane

* report the terminal proven state for `{{claim_scope}}`
* run [Cleanup Created Threads](thread-cleanup.md#cleanup-created-threads) for created terminal or superseded chat threads
* stop after reporting that terminal state
* do not start open-ended cleanup, extra proof, extra review, publication, issue closure, merge preparation, or broader readiness work
* only do bounded hygiene that is explicitly required to keep the proven diff clean
* if hygiene cannot finish immediately
  * record it as follow-up
  * stop

## Close Single Process Terminal

* set `next_owner` to `none` when no granted work remains
* do not switch back to another role just to write a duplicate final comment
* if checks or hygiene run after that terminal comment and do not change the proof decision
  * return the final response from the existing terminal record
  * stop
* return to the caller

## Report Blocker

* if `{{blocker}}` is about infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or a safe target
  * report the local resource path attempted or why no local path can satisfy it
* report `Blocked for {{claim_scope}}: {{blocker}}`
* if an authority answer is required before the lane can continue
  * set `{{return_source_workflow}}` to this workflow
  * set `{{return_resume_heading}}` to `report-status`
  * run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script)
  * ask the smallest decision-ready question needed to proceed as `{{pending_decision}}`
  * stop after the prompt while waiting for the answer
* stop
