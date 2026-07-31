<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Extract Model

* for each machine in `{{machine_inventory}}`, obtain its finalized graph by the cheapest route
  that works:
  * a model introspection or transition-snapshot API on the finalized model
  * a model/diagram export the project already produces
  * an instrumented run that records every vertex and transition at startup
  * only if none exist: read the definition **and every builder or helper it calls**, expanding each
    into the vertices and transitions it injects
* normalize each graph to `{{out_dir}}/graph.json`:
  * `vertices`: qualified name, kind (state, composite, initial, choice, history, final), owner
  * `transitions`: qualified name, source, target, events, has_guard, kind (internal, local, external)
  * `events`: declared name, kind, and the dispatch sites outside the machine
  * `behaviors`: entry, exit, effect, guard, activity — each with the source location holding it
* set `{{graph_source}}` to the route used
* if the route was source expansion, set `{{graph_confidence}}` to `low` and record a `P2` finding:
  the model graph is not machine-readable, so structural review is unverifiable
* return to the caller
