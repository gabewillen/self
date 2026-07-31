<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Monitor Child Orchestrator

* read the child orchestrator's latest lane ledger, active subtickets, blocked subtickets, ready decisions, watcher state, next proof, and requested authority
* resolve `{{goal_mdscript}}` from the child or parent goal path when present
* for watcher wakeups and urgent state changes, run [Hot Path Event Handling](hot-path-event-handling.md#hot-path-event-handling) first
* [Verify Child Stop Report](#verify-child-stop-report)

## Verify Child Stop Report

* if the child is terminal, paused, obsolete, blocked, interrupted, or watcher-terminal without a parent-visible stop report
  * set `{{blocker}}` to `child stop report missing`
  * require the child to report back before this parent accepts terminal state
  * stop after requiring the missing stop report
* before counting a child lane as `Proven for {{claim_scope}}`
  * verify the child wrote a parent-visible rollup stop comment under the child task id with scoped proof decision, proof supplied, proof not claimed, next owner, blocker, and cleanup status
* if the rollup stop comment is missing required fields
  * set `{{blocker}}` to the missing child rollup field
  * send the child the exact remediation for the missing rollup
  * stop after the remediation handoff
* after accepting a child rollup
  * verify the child task body, child goal MDScript, and lane ledger no longer describe active or awaited implementer work unless the rollup explicitly leaves a next owner and blocker
* if durable child state still describes active implementer work after a proven rollup
  * set `{{blocker}}` to `stale child active-work state after rollup`
  * require the child to repair durable state
  * stop after requiring the repair
* [Dispatch Child Events](#dispatch-child-events)

## Dispatch Child Events

* run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) for any child-reported or inferred `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
* if `{{event_exec}}` is set
  * execute the exact event jump before lower-priority monitoring work
* if the child reports disposition-ready
  * start the root disposition workflow or explicitly deny it with the exact authority, policy, or proof reason
  * stop after disposition start or denial is recorded
* if the child reports target-drift, handoff-unacked, or stale-mr
  * require the child to interrupt its owned lane, refresh or escalate within one watcher cycle, and report the exact blocker if it cannot
  * stop after the interrupt handoff
* [Steer Child Orchestrator](#steer-child-orchestrator)

## Steer Child Orchestrator

* do not directly steer the child orchestrator's leaf implementers unless the child explicitly escalates a safety, permission, proof, or ownership boundary that this parent owns
* if a leaf implementer or subticket reports directly to this parent
  * route the report back through the child orchestrator with the exact child-orchestrator thread id and continuation jump
* if the child orchestrator is blocked
  * answer only the parent-scope decision, authority, dependency, or proof question that the child escalated
  * stop after answering the escalated parent-scope question
* if the child orchestrator is stale, overloaded, or missing lane state
  * require the child to refresh its lane ledger before this parent creates new subticket work
  * stop after requiring the ledger refresh
* if the child orchestrator's scope has grown beyond its own lane cap
  * require the child to split by repository, ticket group, system boundary, incident area, or release train into another child orchestrator
  * stop after requiring the split
* keep this parent ledger entry focused on the child orchestrator's thread id, title, parent issue, current phase, blocker, next proof, next check time, and reporting path
* run [Report Status](../../self-common/workflows/report-boundary.md#report-status)
