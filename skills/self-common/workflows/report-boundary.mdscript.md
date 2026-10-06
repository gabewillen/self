<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report Status

* report counts first, evidence first, and in plain words
* name each skipped item as `skipped: <item>, add when <trigger>`
* use a report to the parent agent as a hard stop condition
  * this rule applies to each child orchestrator, implementer, reviewer, and goal-resumed agent lane
* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* before a child orchestrator, implementer, reviewer, or goal-resumed agent lane stops for any reason
  * [Emit Stop Package](#emit-stop-package)
* examine a project control-plane workflow for these terminal conditions:
  * a final comment that the parent can see has `proof_decision: Proven for {{claim_scope}}`
  * all owned child and implementer tasks are terminal for that claim
  * the reviewer consensus is recorded
  * no next action stays inside the granted authority
* if all of these terminal conditions are true
  * [Close Terminal Proven Lane](#close-terminal-proven-lane)
* if a repo-local single-process fallback has a terminal comment on the root task that the parent can see
  * if that comment has `proof_decision: Proven for {{claim_scope}}`, [Close Single Process Terminal](#close-single-process-terminal)
* if `{{blocker}}` is set
  * [Report Blocker](#report-blocker)
* use the status labels `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`
* name these items:
  * the objective, the owner, the parent agent or reporting path, and the phase
  * the stop reason if you stop, and the event execution and event type if they apply
  * the issue/MR/PR, the referenced tickets, and `{{claim_scope}}`
  * the contract preconditions, postconditions, and invariants
  * the proof path, and the local resource path if resources are part of the work
  * the proof that is complete, the proof that is not claimed, and the proof that is not there
  * the review state, the watcher state, the residual risk, and the exact authority that is necessary
* tell about routine polls only if they changed the state
* do not use confidence in place of evidence that is not there
* return to the caller

## Emit Stop Package

* set `{{stop_reason}}` to one of these values, or to the nearest exact reason:
  * `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`
  * `authority-boundary`, `context-limit`, `watcher-terminal`
* run [Report Stop To File Comments](file-task-comments.mdscript.md#report-stop-to-file-comments)
* run [Cleanup Created Threads](thread-cleanup.mdscript.md#cleanup-created-threads) for each thread or subagent that this lane created
  * this includes chat threads, child lane threads, worker threads, and reviewer threads
* report to `{{parent_agent}}` or `{{parent_reporting_path}}`
* if one of these conditions exists, include `{{event_exec}}` and `{{event_type}}`:
  * a disposition, a drift, a handoff without an ack, a stale MR, a blocker, or a terminal watcher condition
* if work remains, name the next owner and the next action
* if you cannot send the file comment or the parent report that the parent can see
  * record the failed report, the reason, and the fallback location
  * put this record in the ledger or source of truth that the parent can see
  * stop
* until the file comment and the parent report exist where the parent can see them, do not do these actions:
  * close, delete, or archive the lane
  * stop the polls or become silent
* examine the terminal or superseded child chat threads that this lane created
* if one of these threads stays open, do not claim that the terminal lane is clean
  * this rule does not apply to a thread with a cleanup blocker, a transfer record, or a durable-owner handoff
* return to the caller

## Close Terminal Proven Lane

* report the terminal proven state for `{{claim_scope}}`
* run [Cleanup Created Threads](thread-cleanup.mdscript.md#cleanup-created-threads) for the created terminal or superseded chat threads
* after you report that terminal state, stop
* do not start these types of work:
  * open-ended cleanup, more proof, more review, or publication
  * issue closure, merge preparation, or wider readiness work
* only do limited hygiene that is explicitly necessary to keep the proven diff clean
* if the hygiene cannot finish immediately
  * record it as a follow-up
  * stop

## Close Single Process Terminal

* if no granted work remains, set `next_owner` to `none`
* do not change back to a different role only to write a duplicate final comment
* if checks or hygiene run after that terminal comment and do not change the proof decision
  * return the final response from the terminal record that exists
  * stop
* return to the caller

## Report Blocker

* if `{{blocker}}` is about infrastructure, service setup, provider setup, runtime resources, or storage
  * report the local resource path that you tried, or the reason that no local path can satisfy it
* if `{{blocker}}` is about a browser, media, or a safe target
  * report the local resource path that you tried, or the reason that no local path can satisfy it
* report `Blocked for {{claim_scope}}: {{blocker}}`
* if the lane must get an authority answer before it can continue
  * set `{{return_source_workflow}}` to this workflow
  * set `{{return_resume_heading}}` to `report-status`
  * run [Prepare Prompt Return Script](return-script.mdscript.md#prepare-prompt-return-script)
  * ask the smallest question that is ready for a decision and lets the lane continue, as `{{pending_decision}}`
  * after the prompt, stop and wait for the answer
* stop
