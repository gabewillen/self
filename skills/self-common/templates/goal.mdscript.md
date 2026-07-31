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

* record objective, scoped done state, source of truth, and parent reporting path
* record claim scope, preconditions, postconditions, invariants, proof path, and local resource path
* record lane ledger keys, model, reasoning, model_selection_basis, role jumps, event_exec values, stop rules, and authority boundaries
* record cleanup ownership for any chat threads this lane may create
* if a prompt may pause for authority input, record the pending decision field, return script path, return resume command, and caller resume heading

## Resume Goal

* validate recorded model, reasoning, and model_selection_basis against the model-reasoning contract
* if the model contract is missing or invalid, stop and report the exact model-contract blocker
* if entered through a return script, apply the returned answer to the pending decision
* refresh live repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state
* if a human correction or scope change invalidates the goal, update the goal before acting
  * [Hot Path](#hot-path)

## Hot Path

* execute the current owner action named by this goal
* if an event_exec applies, run that exact event jump before lower-priority work
* if the stop condition is reached
  * [Stop](#stop)

## Stop

* write a parent-visible file comment with the exact stop-report fields
* set goal status to `done`, `blocked`, `paused`, `obsolete`, or the closest exact terminal state
* stop and report to the parent reporting path
