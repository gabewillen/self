<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Hierarchy

* require multi-step workflows to nest step states under a hierarchical parent/composite that owns
  the shared workflow scope (`HI-05` / `HSM-HIERARCHY-001` / `PAT-HSM-003`) — `P0` when steps are
  siblings without that parent
* group transitions by trigger, then by the source vertex's parent
* for each group where sibling vertices carry the same trigger with the same target or effect
  * record `HI-01` for exact duplicates, `HI-02` when the responses differ only in detail
  * remediate by naming the composite ancestor that should own the transition
* for shared entry, exit, activity, or defer repeated across siblings, record `HI-03`
* for the same deferred-event set or `defer` / `hsm.defer` declaration copied onto multiple sibling
  workflow states, record `HI-06` — `P0`, and require one parent-owned deferral
* for leaves multiplied by a transition a parent could own, record `HI-04`
* where a parent already owns a shared handler or deferral, note it and file nothing
* append findings to `{{findings_log}}`
* return to the caller
