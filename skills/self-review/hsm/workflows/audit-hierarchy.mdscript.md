<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Hierarchy

* for each multi-step workflow
  * if its step states are siblings without a parent composite that owns the shared workflow scope
    * record `HI-05` / `HSM-HIERARCHY-001` / `PAT-HSM-003` — `P0`
* sort the transitions into groups by trigger, then by the parent of the source vertex
* for each group where sibling vertices have the same trigger with the same target or effect
  * if the transitions are exact duplicates, record `HI-01`
  * if the responses are different only in detail, record `HI-02`
  * in the finding, name the composite ancestor that must own the transition
* for each entry, exit, activity, or defer that more than one sibling repeats, record `HI-03`
* for the same deferred-event set or `defer` / `hsm.defer` declaration on more than one sibling workflow state
  * record `HI-06` — `P0`
  * give the remediation: one deferral that the parent owns
* for each set of leaves that repeat a transition that a parent can own, record `HI-04`
* if a parent already owns a shared handler or deferral, write a note and record no finding
* append the findings to `{{findings_log}}`
* return to the caller
