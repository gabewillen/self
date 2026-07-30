<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Hierarchy

Cluster from `{{out_dir}}/graph.json`.

* group transitions by trigger, then by the source vertex's parent
* for each group where sibling vertices carry the same trigger with the same target or effect
  * record `HI-01` for exact duplicates, `HI-02` when the responses differ only in detail
  * remediate by naming the composite ancestor that should own the transition
* for shared entry, exit, or activity repeated across siblings, record `HI-03`
* for leaves multiplied by a transition a parent could own, record `HI-04`
* where a parent already owns a shared handler, note it and file nothing
* append findings to `{{findings_log}}`
* return to the caller
