---
id: {{goal_id}}
task_id: {{task_id}}
owner_role: {{owner_role}}
status: {{status}}
claim_scope: {{claim_scope}}
goal_type: {{goal_type}}
source_of_truth: {{source_of_truth}}
model: {{model}}
reasoning: {{reasoning}}
model_selection_basis: {{model_selection_basis}}
created_at: {{created_at}}
updated_at: {{updated_at}}
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Goal Contract

* write all text in ASD-STE100, as the `mdscript-write` conventions tell you
* record the objective, the scoped done state, the source of truth, and the report path to the parent
* record the claim scope, the preconditions, the postconditions, and the invariants
* record the proof path and the local resource path
* record the lane ledger keys, the `model`, the `reasoning`, and the `model_selection_basis`
* record the role jumps, the `event_exec` values, the stop rules, and the authority boundaries
* record which lane owns the cleanup of the chat threads that this lane can create
* if a prompt can pause for authority input
  * record the field for the pending decision and the path of the return script
  * record the return resume command and the resume heading of the caller

## Resume Goal

* examine the recorded `model`, `reasoning`, and `model_selection_basis` against the model-reasoning contract
* if the model contract is missing or not valid, stop and report the exact model-contract blocker
* if you came in through a return script, apply the returned answer to the pending decision
* read again the live state of the repo, the tracker, the MR/PR, the CI, and the review
* read again the live state of the discussion, the telemetry, and the proof
* if a human correction or a scope change makes the goal not valid, change the goal before you act
  * [Hot Path](#hot-path)

## Hot Path

* execute the current action of the owner that this goal names
* if an `event_exec` applies, run that exact event jump before work of lower priority
* if the stop condition is reached
  * [Stop](#stop)

## Stop

* write a parent-visible file comment with the exact stop-report fields
* set the goal status to `done`, `blocked`, `paused`, `obsolete`, or the nearest exact terminal state
* stop and report to the report path of the parent
