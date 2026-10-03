<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Thread Event Contracts

* read [event-exec map](../references/event-exec-map.md)
* use cross-thread events as executable owner actions, not as status summaries
* make sure that each event report has the fields that the event-exec map lists
* if only `{{event_type}}` exists
  * set `{{event_exec}}` from the canonical map for that type
* if an agent sent a bare event label without `{{event_exec}}`
  * set `{{event_exec}}` to the exact MDScript execution jump for the event
* put `{{event_exec}}` in the child-to-parent report, the lane ledger, the watcher output, and the handoff
* if a watcher, child orchestrator, implementer, or reviewer sees one of these events
  * [Dispatch Thread Event](#dispatch-thread-event)
* if more than one event applies
  * do `TARGET_DRIFT` before `DISPOSITION_READY`
  * do `STALE_MR` before you do the proof again
  * do `HANDOFF_UNACKED` before you add work with a lower priority
* return to the caller

## Dispatch Thread Event

* run the exact event heading that `{{event_exec}}` names
* before you stop, report the executed event to the parent agent or the parent reporting path
* record `{{event_exec}}` and `{{event_deadline}}` in the lane ledger
* if you cannot do the necessary response inside the current authority
  * report `Blocked for {{claim_scope}}: {{blocker}}` to the parent with `{{event_exec}}` and `{{event_type}}`
  * in that report, name the exact authority or resource that is not there
  * stop
* return to the caller

## Event DISPOSITION READY

* set `{{event_type}}` to `DISPOSITION_READY`
* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
* make sure that the MR/PR is on the current integration target
  * if it is not, stop and report the target mismatch
* make sure that the exact-head CI is green
  * if it is not, stop and report the CI state
* make sure that one fresh `Proven` review for the current target exists
  * if it does not exist, stop and report that the review is not there
* make sure that no discussions stay open
  * if a discussion stays open, stop and report the ids of the open discussions
* start the merge, close, or disposition workflow immediately
* if the disposition is denied
  * record the explicit authority, policy, proof, merge, or tracker reason
  * stop and report the denial to the parent
* do not keep `DISPOSITION_READY` only as watcher context
* before you stop, report these values to the parent:
  * `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, `{{current_head}}`, and `{{target_head}}`
  * `{{ci_state}}`, `{{review_state}}`, `{{unresolved_discussions}}`, and `{{next_action}}`
* stop

## Event TARGET DRIFT

* set `{{event_type}}` to `TARGET_DRIFT`
* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
* make sure that one of these targets is not equal to the current integration target:
  * the MR/PR base, the tested target, or the proof target
* if all these targets are equal to the current integration target
  * stop and report that no target drift exists
* move the MR/PR onto the current target in one watcher cycle or less
* if you cannot move it
  * report the exact blocker, dirty state, conflict, authority that is not there, failed command, or thread failure
  * stop
* give target drift priority as a hard interrupt over more proof on the old target
* before you stop, report these values to the parent:
  * `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, the old target, and the current integration target
  * `{{current_head}}`, the refresh path that you tried, and the blocker if one exists
* stop

## Event HANDOFF UNACKED

* set `{{event_type}}` to `HANDOFF_UNACKED`
* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked`
* make sure that a priority instruction has no acknowledgment, output, or blocker after one watcher cycle
  * if an ack, output, or blocker exists, stop and report that the handoff now has an ack
* escalate to the parent immediately
* as the parent, do one of these actions:
  * send the handoff again with a deadline
  * give the ownership to a different owner
  * record the explicit reason to wait
* do not wait silently
* before you stop, report these values to the parent:
  * `{{event_exec}}`, `{{event_type}}`, the instruction without an ack, and the owner
  * the watcher cycle deadline, the last contact try, and the next owner
* stop

## Event STALE MR

* set `{{event_type}}` to `STALE_MR`
* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr`
* make sure that the head did not move after an explicit instruction of one of these types:
  * target-consume, rebase, merge-target refresh, or source-refresh
* if the head moved
  * stop and report the new head
* report the blocker path, dirty state, conflict, authority that is not there, failed command, or thread failure
* do not do old-head proof again as if it moves the lane forward
* before you stop, report these values to the parent:
  * `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, and the requested refresh instruction
  * the last head that you saw and the expected target head
  * the command or path that you tried, and the blocker if one exists
* stop
