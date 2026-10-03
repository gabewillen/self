<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Monitor Child Orchestrator

* read the latest lane ledger of the child orchestrator
* read its active subtickets, blocked subtickets, ready decisions, watcher state, next proof, and requested authority
* if a child or parent goal path exists
  * set `{{goal_mdscript}}` to that goal path
* for watcher wakeups and urgent state changes, run [Hot Path Event Handling](hot-path-event-handling.mdscript.md#hot-path-event-handling) first
* [Verify Child Stop Report](#verify-child-stop-report)

## Verify Child Stop Report

* if the child is terminal, paused, obsolete, blocked, interrupted, or watcher-terminal without a parent-visible stop report
  * set `{{blocker}}` to `child stop report missing`
  * before this parent accepts the terminal state, tell the child to report back
  * after you ask for the missing stop report, stop
* before you count a child lane as `Proven for {{claim_scope}}`
  * make sure that the child wrote a parent-visible rollup stop comment under the child task id
  * make sure that the comment has the scoped proof decision, `proof_supplied`, `proof_not_claimed`, next owner, blocker, and cleanup status
* if the rollup stop comment does not have all the necessary fields
  * set `{{blocker}}` to the missing child rollup field
  * send the child the exact remediation for the missing rollup
  * after the remediation handoff, stop
* after you accept a child rollup
  * if the rollup does not explicitly leave a next owner and a blocker
    * make sure that the child task body, goal MDScript, and lane ledger show no active or awaited implementer work
* if the durable child state still describes active implementer work after a proven rollup
  * set `{{blocker}}` to `stale child active-work state after rollup`
  * tell the child to repair the durable state
  * after you ask for the repair, stop
* [Dispatch Child Events](#dispatch-child-events)

## Dispatch Child Events

* if the child reports or you find `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
* if `{{event_exec}}` is set
  * before lower-priority monitor work, execute the exact event jump
* if the child reports disposition-ready
  * start the root disposition workflow, or explicitly deny it with the exact authority, policy, or proof reason
  * after you record the disposition start or the denial, stop
* if the child reports target-drift, handoff-unacked, or stale-mr
  * tell the child to interrupt its owned lane
  * tell the child to refresh or escalate within one watcher cycle
  * if the child cannot do this
    * tell the child to report the exact blocker
  * after the interrupt handoff, stop
* [Steer Child Orchestrator](#steer-child-orchestrator)

## Steer Child Orchestrator

* if the child did not explicitly escalate a safety, permission, proof, or ownership boundary that this parent owns
  * do not directly steer the leaf implementers of the child orchestrator
* if a leaf implementer or subticket reports directly to this parent
  * send the report back through the child orchestrator with the exact child-orchestrator thread id and continuation jump
* if the child orchestrator is blocked
  * answer only the parent-scope decision, authority, dependency, or proof question that the child escalated
  * after you answer the escalated parent-scope question, stop
* if the child orchestrator is stale, overloaded, or has no lane state
  * before this parent creates new subticket work, tell the child to refresh its lane ledger
  * after you ask for the ledger refresh, stop
* if the scope of the child orchestrator is larger than its own lane cap
  * tell the child to split the scope into a different child orchestrator
  * tell the child to split by repository, ticket group, system boundary, incident area, or release train
  * after you ask for the split, stop
* in this parent ledger entry, keep only these child fields:
  * the thread id, title, parent issue, current phase, and blocker
  * the next proof, next check time, and reporting path
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)
