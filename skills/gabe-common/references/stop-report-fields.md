# Stop report fields

Put stop-report fields only under the exact `## Stop Report` heading in a file
comment. Fields in summaries, evidence, or prose do not count and are malformed.

## Accepted stop reasons

`done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`,
`authority-boundary`, `context-limit`, `watcher-terminal`, `review-complete`

## Common fields under `## Stop Report`

| Field | When required |
| --- | --- |
| `stop_reason=...` | Every stop |
| `next_owner=...` | Every stop; `none` when no granted work remains |
| `next_action=...` | When any work remains |
| `blocker=...` | When blocked or partially blocked |
| `proof_decision=...` | When reporting a scoped proof outcome |
| `proof_supplied=...` | Terminal or proof-bearing stops |
| `proof_not_claimed=...` | Terminal or proof-bearing stops |
| `remaining_authority_boundary=...` | Terminal root stops |
| `cleanup_status=...` | Final, review-cleanup, child-lane cleanup, supersession |
| `resume_command=...` | When a return or goal resume continues the lane |
| `return_script=...` | When the stop asks an authority surface for input |
| `resumed=true` | Compaction-resume markers |
| `review_round=start` | Review-round start comments |

## Terminal root stop

When the scoped root claim is terminal and no granted source-health action
remains, include:

`stop_reason=done`, `next_owner=none`, `proof_decision=...`,
`proof_supplied=...`, `proof_not_claimed=...`,
`remaining_authority_boundary=...`, `cleanup_status=...`, `blocker=...`

## Child rollup stop

Child rollup stop comments include `role: orchestrator`, `parent_visible: true`,
scoped `proof_decision`, `stop_reason=done` or the exact terminal reason,
`next_owner` set to the parent task or root, `proof_not_claimed=...`,
`blocker=...`, and `cleanup_status=...`.

For source-health child rollups and final root stops, `proof_not_claimed` must
explicitly include `merge-readiness`, `live-proof`, `issue-close-readiness`,
`release-readiness`, `deployment-readiness`, and `publication` unless that broader
proof scope was explicitly granted and proven.

## Prompt stops

If the stop asks the user, a repository owner, or another authority surface
for input, include `return_script=...`, `resume_command=...`, and the pending
decision field under `## Stop Report`.
