<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Control Flow

* for each conditional in a guard, effect, entry, exit, or activity
  * if it selects a transition, a target, which event drives the machine next, or retry versus fail
    versus success, record `CF-02` / `CF-05` — `P0`, with the location and the exact expression
  * if it is local data work with one continuation, allow it under `CF-03`
* require mutually exclusive outcomes to appear as guarded transitions or a choice with a default
  (`CF-01`, `CF-04`) — `P0`
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
* attach a `binding_note` only after the finding exists, and only for an API confirmed in the pinned
  `{{dialect}}` version
* append findings to `{{findings_log}}`
* return to the caller
