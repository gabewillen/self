<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Actor Boundary

* for each read or write of machine state or attributes, find the code that does it
  * if this code is not in a guard, effect, entry, or exit of the same machine, record `AC-01` — `P0`
  * if this code is in an activity, record `AC-06` — `P0`
    * write in the finding that activities run outside the step and must return results as events
* for each access to the state or attributes of a **different** actor from outside that actor
  * if the access reads, record `AC-02` — `P0`
    * give the remediation: a request event, with the response in the payload
  * if the access writes, record `AC-03` — `P0`
    * give the remediation: a dispatched event
* for each guard that reads the state of a different actor, record `AC-04` — `P0`
  * write in the finding that the actor boundary is wrong
  * recommend that the machines merge, or that the actors exchange events
* for each snapshot, current-state query, state string comparison, or switch on state that selects the next step
  * record `AC-05` — `P0`
  * write in the finding that observation can only log, persist, report status, and gate readiness
* for each lock or mutex that protects machine data, record `AC-07` — `P0`
  * treat the lock as a pointer to the out-of-step access that it hides
* for each getter that exposes the data that a machine owns, record `AC-08` — `P0`
* for each ordinary method that changes the data that a machine owns, record `AC-08` — `P0`
* for each behavior that enters its own machine again in the middle of a step, record `AC-09` / `ST-06` — `P0`
* for concurrency that is not separate actors that coordinate with events, record `CN-01` / `CN-02` — `P0`
* for coordination between actors that does not use events, record `CN-03` — `P0`
* append the findings to `{{findings_log}}`
* return to the caller
