# Thread event execution map

Cross-thread events are executable owner actions. Every event report must include
`event_exec`, `event_type`, `event_source`, `event_owner`, parent agent or parent
reporting path, `issue_or_mr`, `current_head`, `target_head`, `proof_decision`,
`review_state`, `ci_state`, `unresolved_discussions`, `deadline`, `next_action`,
and `blocker` when one exists.

## Canonical event executions

| Event type | Canonical `event_exec` |
| --- | --- |
| `DISPOSITION_READY` | `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready` |
| `TARGET_DRIFT` | `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift` |
| `HANDOFF_UNACKED` | `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked` |
| `STALE_MR` | `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr` |

## Priority when multiple events apply

1. `TARGET_DRIFT` before `DISPOSITION_READY`
2. `STALE_MR` before repeating proof
3. `HANDOFF_UNACKED` before lower-priority work

## Report rule

Do not emit a bare event label when an executable event applies. Include
`event_exec` in the child-to-parent report, lane ledger, watcher output, and
handoff. Run the exact event heading when receiving an event.
