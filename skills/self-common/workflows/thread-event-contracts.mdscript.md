<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Thread Event Contracts

* read [event-exec map](../references/event-exec-map.md)
* treat cross-thread events as executable owner actions, not status summaries
* require every event report to include the fields listed in the event-exec map
* if only `{{event_type}}` exists
  * set `{{event_exec}}` from the canonical map for that type
* if a bare event label was emitted without `{{event_exec}}`
  * set `{{event_exec}}` to the exact MDScript execution jump for the event
* include `{{event_exec}}` in the child-to-parent report, lane ledger, watcher output, and handoff
* when a watcher, child orchestrator, implementer, or reviewer observes one of these events
  * [Dispatch Thread Event](#dispatch-thread-event)
* when multiple events apply
  * handle `TARGET_DRIFT` before `DISPOSITION_READY`
  * handle `STALE_MR` before repeating proof
  * handle `HANDOFF_UNACKED` before adding lower-priority work
* return to the caller

## Dispatch Thread Event

* run the exact event heading named by `{{event_exec}}`
* report the executed event to the parent agent or parent reporting path before stopping
* record `{{event_exec}}` and `{{event_deadline}}` in the lane ledger
* if the required response cannot be performed inside current authority
  * report `Blocked for {{claim_scope}}: {{blocker}}` to the parent with `{{event_exec}}`, `{{event_type}}`, and the exact missing authority or resource
  * stop
* return to the caller

## Event DISPOSITION READY

* set `{{event_type}}` to `DISPOSITION_READY`
* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
* verify the MR/PR is on the current integration target
  * if not, stop and report the target mismatch
* verify exact-head CI is green
  * if not, stop and report the CI state
* verify one fresh current-target `Proven` review exists
  * if not, stop and report the missing review
* verify no unresolved discussions remain
  * if any remain, stop and report the unresolved discussion ids
* start the merge, close, or disposition workflow immediately
* if disposition is denied
  * record the explicit authority, policy, proof, merge, or tracker reason
  * stop and report the denial to the parent
* do not leave `DISPOSITION_READY` as watcher context
* report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, `{{current_head}}`, `{{target_head}}`, `{{ci_state}}`, `{{review_state}}`, `{{unresolved_discussions}}`, and `{{next_action}}` to the parent before stopping
* stop

## Event TARGET DRIFT

* set `{{event_type}}` to `TARGET_DRIFT`
* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
* verify the MR/PR base, tested target, or proof target no longer equals the current integration target
  * if targets still match, stop and report that target drift is not present
* refresh onto the current target within one watcher cycle
* if refresh cannot happen
  * report the exact blocker, dirty state, conflict, missing authority, failed command, or thread failure
  * stop
* treat target drift as a hard interrupt over repeated old-target proof
* report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, old target, current integration target, `{{current_head}}`, attempted refresh path, and blocker if any to the parent before stopping
* stop

## Event HANDOFF UNACKED

* set `{{event_type}}` to `HANDOFF_UNACKED`
* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked`
* verify a priority instruction has no acknowledgment, output, or blocker after one watcher cycle
  * if an ack, output, or blocker exists, stop and report that the handoff is no longer unacked
* escalate to the parent immediately
* as parent, reissue the handoff with a deadline, reassign ownership, or record the explicit wait reason
* do not wait silently
* report `{{event_exec}}`, `{{event_type}}`, the unacked instruction, owner, watcher cycle deadline, last contact attempt, and next owner to the parent before stopping
* stop

## Event STALE MR

* set `{{event_type}}` to `STALE_MR`
* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr`
* verify no head movement after an explicit target-consume, rebase, merge-target refresh, or source-refresh instruction
  * if the head has moved, stop and report the new head
* report the blocker path, dirty state, conflict, missing authority, failed command, or thread failure
* do not repeat old-head proof as if it advances the lane
* report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, requested refresh instruction, last observed head, expected target head, attempted command/path, and blocker if any to the parent before stopping
* stop
