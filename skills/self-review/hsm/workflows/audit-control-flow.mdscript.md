<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Control Flow

* use the explicit graph model as the primary control-flow contract
  * expect modes, sequences, branches, waits, retries, and cancellation to show as states, transitions, guards, choices, or typed events
  * expect the allowed actions to show in the same graph elements
* for each control-flow decision, next-step selection, phase sequence, or allowed-action policy in an entry, exit, effect, or activity body
  * record `CF-00` / `HSM-BEHAVIOR-001` / `PAT-HSM-002` — `P0`
* for each conditional in a guard, effect, entry, exit, or activity
  * if it selects a transition, a target, or the next event for the machine, record `CF-02` / `CF-05` — `P0`
  * if it selects retry, failure, or success, record `CF-02` / `CF-05` — `P0`
  * write the location and the exact expression in each of these findings
  * if it is local data work with one continuation, allow it under `CF-03`
* if mutually exclusive outcomes do not show as guarded transitions or a choice with a default
  * record `CF-01` / `CF-04` — `P0`
* for each source vertex where many outgoing transitions use many guards to select outcomes or allowed actions
  * record `CF-09` / `HSM-GUARD-002` — `P0`
  * give the remediation: an explicit state in place of the multi-guard fan-out
* for each guard that prevents an action or selects behavior, and does not only block a transition
  * record `CF-08` / `HSM-GUARD-002` — `P0`
  * give the remediation: a state that owns the allowed action set
* for each guard with a side effect, record `BH-01` — `P0`
  * count dispatch, mutation, I/O, and important log output as side effects
  * count a guard that dispatches to report its own failure as a side effect
* for each entry, exit, or effect that does blocking, long, or async work
  * record `BH-02` / `BH-04` / `BH-05` — `P0`
  * give the remediation: an activity
* under `BH-06`, allow these items in an entry, exit, or effect:
  * changes to the data that the machine owns
  * structured logs or telemetry
  * a maximum of one typed completion or error event
* for each behavior that dispatches more than one progression event, record `BH-06` — `P1`
* under `BH-07`, allow an external call to report its outcome as a typed event
* if a behavior selects between branches that the machine state or the event payload can give, classify it as `CF-02`
* for each progression event that a behavior dispatches without an explicit completion or error kind
  * record `BH-08` — `P1`
* for each activity that branches an outcome in code and does not complete through an event
  * record `CF-02` / `TM-02` — `P0`
* for each activity that does more than one sequential phase, handoff, retry, or alternative next step in one body
  * record `BH-09` / `BH-10` / `HSM-ACTIVITY-002` / `TM-04` — `P0`
  * give the remediation: states that typed completion events advance
* for each multi-step workflow in an activity
  * if the workflow is not a state sequence with completion and error transitions, record `BH-10` / `PAT-ASYNC-002` — `P0`
* if a finding exists and you examined the API in the pinned `{{dialect}}` version
  * you can attach a `binding_note` to that finding
* otherwise do not attach a `binding_note`
* append the findings to `{{findings_log}}`
* return to the caller
