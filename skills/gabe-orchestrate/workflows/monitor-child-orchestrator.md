<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Monitor Child Orchestrator

* read the child orchestrator's latest lane ledger, active subtickets, blocked subtickets, ready decisions, watcher state, next proof, and requested authority

* for watcher wakeups and urgent state changes, apply [Hot Path Event Handling](../SKILL.md#hot-path-event-handling) first; use linked workflow detail only after the table identifies the next owner action

* require the child orchestrator to report back before stopping for any reason; if the child is terminal, paused, obsolete, blocked, interrupted, or watcher-terminal without a parent-visible stop report, treat the child ledger as incomplete

* before counting a child lane as `Proven for {{claim_scope}}`, require the child orchestrator to write a parent-visible rollup stop comment under the child task id with the scoped proof decision, proof supplied, proof not claimed, next owner, blocker, and cleanup status

* after accepting a child rollup, verify the child task body, child goal MDScript, and lane ledger no longer describe active or awaited implementer work unless the rollup explicitly leaves a next owner and blocker

* run [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) for any child-reported or inferred `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`; require `{{event_exec}}` and execute the exact event jump before lower-priority monitoring work

* do not directly steer the child orchestrator's leaf implementers unless the child explicitly escalates a safety, permission, proof, or ownership boundary that this parent owns

* if a leaf implementer or subticket reports directly to this parent
  * route the report back through the child orchestrator with the exact child-orchestrator thread id and continuation jump

* if the child orchestrator is blocked
  * answer only the parent-scope decision, authority, dependency, or proof question that the child escalated

* if the child orchestrator reports `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`
  * start the root disposition workflow or explicitly deny it with the exact authority, policy, or proof reason

* if the child orchestrator reports `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`, `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked`, or `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`
  * require the child to interrupt its owned lane, refresh or escalate within one watcher cycle, and report the exact blocker if it cannot

* if the child orchestrator is stale, overloaded, or missing lane state
  * require the child to refresh its lane ledger before this parent creates new subticket work

* if the child orchestrator's scope has grown beyond its own lane cap
  * require the child to split by repository, ticket group, system boundary, incident area, or release train into another child orchestrator

* keep this parent ledger entry focused on the child orchestrator's thread id, title, parent issue, current phase, blocker, next proof, next check time, and reporting path

* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)
