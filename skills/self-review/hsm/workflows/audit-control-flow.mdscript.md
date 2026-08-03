<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Control Flow

* treat explicit graph modeling as the primary control-flow contract: modes, sequencing, branching,
  waiting, retries, cancellation, and allowed actions must appear as states, transitions, guards,
  choices, or typed events
* for each control-flow decision, next-step selection, phase sequence, or allowed-action policy
  hidden inside entry, exit, effect, or activity bodies, record `CF-00` / `HSM-BEHAVIOR-001` /
  `PAT-HSM-002` — `P0`
* for each conditional in a guard, effect, entry, exit, or activity
  * if it selects a transition, a target, which event drives the machine next, or retry versus fail
    versus success, record `CF-02` / `CF-05` — `P0`, with the location and the exact expression
  * if it is local data work with one continuation, allow it under `CF-03`
* require mutually exclusive outcomes to appear as guarded transitions or a choice with a default
  (`CF-01`, `CF-04`) — `P0`
* for each source vertex where multiple outgoing transitions use multiple guards to choose outcomes
  or allowed actions, record `CF-09` / `HSM-GUARD-002` — `P0`, and require an explicit state instead
  of the multi-guard fan-out
* for each guard used to prevent an action or select behavior rather than only block a transition,
  record `CF-08` / `HSM-GUARD-002` — `P0`, and prefer a state that owns the allowed action set
* for each guard with any side effect — dispatch, mutation, I/O, logging that matters — record
  `BH-01` — `P0`. A guard that reports its own failure by dispatching is still a side effect
* for each entry, exit, or effect doing blocking, long-running, or async work, record
  `BH-02` / `BH-04` / `BH-05` — `P0`; remediate as an activity
* for each entry, exit, or effect, allow under `BH-06`: machine-owned data mutation, structured
  logging or telemetry, and at most one typed completion or error event
* for each behavior dispatching more than one progression event, record `BH-06` — `P1`
* distinguish under `BH-07`: reporting an external call's outcome as a typed event is allowed;
  selecting between branches derivable from machine state or event payload is `CF-02`
* for each progression event dispatched from behavior without an explicit completion or error kind,
  record `BH-08` — `P1`
* for each activity that branches an outcome in code instead of completing via an event, record
  `CF-02` / `TM-02` — `P0`
* for each activity that performs multiple sequential phases, handoffs, retries, or alternative next
  steps inside one body, record `BH-09` / `BH-10` / `HSM-ACTIVITY-002` / `TM-04` — `P0`, and require
  decomposition into states advanced by typed completion events
* for each multi-step workflow hidden in an activity rather than exposed as a state sequence with
  completion/error transitions, record `BH-10` / `PAT-ASYNC-002` — `P0`
* attach a `binding_note` only after the finding exists, and only for an API confirmed in the pinned
  `{{dialect}}` version
* append findings to `{{findings_log}}`
* return to the caller
