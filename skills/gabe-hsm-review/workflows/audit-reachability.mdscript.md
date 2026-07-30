<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Reachability

Pure graph computation over `{{out_dir}}/graph.json`. No source reading.

* compute the set of vertices reachable from every initial pseudostate, following transitions and
  composite entry
* for each vertex not in that set, record `RC-01` — `P0`, unreachable vertex
* for each non-final vertex with no outgoing transition and no deferral, record `RC-02` — `P0`,
  dead end
* for each declared event consumed by no transition, record `RC-03` — `P1`, event is dispatched into
  the void
* for each event dispatched from outside the machine but handled by no transition, record `RC-04` — `P1`
* name the caller-visible consequence in each finding, for example "callers can dispatch this event
  but the machine will never act on it"
* append findings to `{{findings_log}}`
* return to the caller
