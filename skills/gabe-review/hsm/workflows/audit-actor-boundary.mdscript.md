<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Actor Boundary

* for each read or write of machine state or attributes, locate the code holding it
  * if it is not inside a guard, effect, entry, or exit of that same machine, record `AC-01` — `P0`
  * if it is inside an activity, record `AC-06` — `P0`; activities run outside the step and must
    return results as events
* for each access to a **different** actor's state or attributes from outside that actor
  * reading, record `AC-02` — `P0`; remediate as a request event with a response carried in the payload
  * writing, record `AC-03` — `P0`; remediate as a dispatched event
* for each guard that consults another actor's state, record `AC-04` — `P0`; the actor boundary is
  wrong, so recommend merging the machines or exchanging events
* for each observation surface used to decide what happens next — snapshot, current-state query,
  state string comparison, switch on state — record `AC-05` — `P0`; observation may log, persist,
  report status, and gate readiness only
* for each lock or mutex protecting machine data, record `AC-07` — `P0`, and treat it as a pointer
  to the out-of-step access it is hiding
* for each getter exposing machine-owned data, or ordinary method mutating it, record `AC-08` — `P0`
* for each behavior that re-enters its own machine mid-step, record `AC-09` / `ST-06` — `P0`
* for concurrency modeled as anything other than separate actors coordinating by events, record
  `CN-01` / `CN-02` — `P0`
* for cross-actor coordination that bypasses events, record `CN-03` — `P0`
* append findings to `{{findings_log}}`
* return to the caller
