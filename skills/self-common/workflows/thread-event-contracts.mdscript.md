<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Thread Event Contracts

* treat a cross-thread event as an owner action, not a status line
* if `{{event_exec}}` is empty, set it to the event heading of `{{event_type}}` in this file
  * for example `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
* put `{{event_exec}}` in the report, the lane ledger, the watcher output, and the handoff
* if more events apply, run `TARGET_DRIFT` before `DISPOSITION_READY`, `STALE_MR` before more proof, and `HANDOFF_UNACKED` before lower-priority work
* run the heading that `{{event_exec}}` names
* if the response needs authority that you do not have
  * report `Blocked for {{claim_scope}}: {{blocker}}` to the parent with `{{event_exec}}`, and stop
* before you stop, report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, the heads, and the next action to the parent
* return to the caller

## Event DISPOSITION READY

* set `{{event_type}}` to `DISPOSITION_READY`
* stop and report the failed check if one of these is true:
  * the PR is not on the current target, or exact-head CI is not green
  * no fresh `Proven` review exists, or a discussion is open
* start the merge, close, or disposition workflow now
* if the disposition is denied, record the reason, and report it to the parent
* stop

## Event TARGET DRIFT

* set `{{event_type}}` to `TARGET_DRIFT`
* if the PR base, tested target, and proof target all equal the current target, stop and report no drift
* move the PR onto the current target in one watcher cycle, before more proof on the old target
* if you cannot, report the exact blocker, and stop
* stop

## Event HANDOFF UNACKED

* set `{{event_type}}` to `HANDOFF_UNACKED`
* if the priority instruction got an ack, output, or blocker, stop and report it
* escalate to the parent now
* as the parent, do one of these:
  * send the handoff again with a deadline
  * give it to a different owner
  * record why you wait
* stop

## Event STALE MR

* set `{{event_type}}` to `STALE_MR`
* if the head moved after the refresh instruction, stop and report the new head
* report the blocker, and do not run old-head proof again
* stop
