<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Handle Thread Event Contracts

* treat cross-thread events as executable owner actions, not status summaries or labels that require a parent to look up meaning

* every event report must include `{{event_exec}}`, `{{event_type}}`, `{{event_source}}`, `{{event_owner}}`, `{{parent_agent}}` or `{{parent_reporting_path}}`, `{{issue_or_mr}}`, `{{current_head}}`, `{{target_head}}`, `{{proof_decision}}`, `{{review_state}}`, `{{ci_state}}`, `{{unresolved_discussions}}`, `{{deadline}}`, `{{next_action}}`, and `{{blocker}}` when one exists

* do not emit a bare event label when an executable event applies
  * set `{{event_exec}}` to the exact MDScript execution jump for the event
  * include `{{event_exec}}` in the child-to-parent report, lane ledger, watcher output, and handoff
  * run the exact event heading when receiving an event instead of asking the next owner to infer the response

* use these canonical event executions
  * `DISPOSITION_READY`: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`
  * `TARGET_DRIFT`: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`
  * `HANDOFF_UNACKED`: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked`
  * `STALE_MR`: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`

* if only `{{event_type}}` exists, convert it to the canonical `{{event_exec}}` before reporting or acting

* when a watcher, child orchestrator, implementer, or reviewer observes one of these events
  * execute the event by using the matching `{{event_exec}}`
  * report the executed event to the parent agent or parent reporting path before stopping
  * record `{{event_exec}}` and `{{event_deadline}}` in the lane ledger

* if the required response cannot be performed inside current authority
  * report `Blocked for {{claim_scope}}: {{blocker}}` to the parent with `{{event_exec}}`, `{{event_type}}`, and the exact missing authority or resource

* when multiple events apply
  * handle `TARGET_DRIFT` before `DISPOSITION_READY`
  * handle `STALE_MR` before repeating proof
  * handle `HANDOFF_UNACKED` before adding lower-priority work

## Event DISPOSITION READY

* event type: `DISPOSITION_READY`

* canonical execution: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`

* preconditions
  * MR/PR is on the current integration target
  * exact-head CI is green
  * one fresh current-target `Proven` review exists
  * no unresolved discussions remain

* required response
  * root or parent starts the merge, close, or disposition workflow immediately
  * if disposition is denied, root records the explicit authority, policy, proof, merge, or tracker reason
  * do not leave `DISPOSITION_READY` as watcher context

* stop/report contract
  * report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, `{{current_head}}`, `{{target_head}}`, `{{ci_state}}`, `{{review_state}}`, `{{unresolved_discussions}}`, and `{{next_action}}` to the parent before stopping

## Event TARGET DRIFT

* event type: `TARGET_DRIFT`

* canonical execution: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`

* preconditions
  * MR/PR base, tested target, or proof target no longer equals the current integration target

* required response
  * owner refreshes onto the current target within one watcher cycle
  * if refresh cannot happen, owner reports the exact blocker, dirty state, conflict, missing authority, failed command, or thread failure
  * treat target drift as a hard interrupt over repeated old-target proof

* stop/report contract
  * report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, old target, current integration target, `{{current_head}}`, attempted refresh path, and blocker if any to the parent before stopping

## Event HANDOFF UNACKED

* event type: `HANDOFF_UNACKED`

* canonical execution: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked`

* preconditions
  * priority instruction has no acknowledgment, output, or blocker after one watcher cycle

* required response
  * child escalates to the parent immediately
  * parent reissues the handoff with a deadline, reassigns ownership, or records the explicit wait reason
  * stop waiting silently

* stop/report contract
  * report `{{event_exec}}`, `{{event_type}}`, the unacked instruction, owner, watcher cycle deadline, last contact attempt, and next owner to the parent before stopping

## Event STALE MR

* event type: `STALE_MR`

* canonical execution: `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`

* preconditions
  * no head movement after an explicit target-consume, rebase, merge-target refresh, or source-refresh instruction

* required response
  * owner reports the blocker path, dirty state, conflict, missing authority, failed command, or thread failure
  * do not repeat old-head proof as if it advances the lane

* stop/report contract
  * report `{{event_exec}}`, `{{event_type}}`, `{{issue_or_mr}}`, requested refresh instruction, last observed head, expected target head, attempted command/path, and blocker if any to the parent before stopping
