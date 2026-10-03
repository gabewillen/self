<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Extract Model

* for each machine in `{{machine_inventory}}`, get its finalized graph by the least expensive route that works:
  * a model introspection API or transition-snapshot API on the finalized model
  * a model export or diagram export that the project already makes
  * an instrumented run that records all vertices and transitions at startup
  * if no other route exists, read the definition **and all builders and helpers that it calls**
    * expand each builder or helper into the vertices and transitions that it adds
* normalize each graph to `{{out_dir}}/graph.json`:
  * `vertices`: qualified name, kind (state, composite, initial, choice, history, final), owner
  * `transitions`: qualified name, source, target, events, has_guard, kind (internal, local, external)
  * `events`: declared name, kind, and the dispatch sites outside the machine
  * `behaviors`: entry, exit, effect, guard, activity — each with the source location that holds it
* set `{{graph_source}}` to the route that you used
* if the route was source expansion
  * set `{{graph_confidence}}` to `low`
  * record a `P2` finding: the graph is not machine-readable, so you cannot prove the structural review
* return to the caller
