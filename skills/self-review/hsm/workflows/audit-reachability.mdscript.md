<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Reachability

* compute the set of vertices that each initial pseudostate can reach through transitions and composite entry
* for each vertex that is not in that set, record `RC-01` — `P0`, unreachable vertex
* for each non-final vertex with no outgoing transition and no deferral, record `RC-02` — `P0`, dead end
* for each declared event that no transition consumes, record `RC-03` — `P1`, event goes into the void
* for each event that code outside the machine dispatches and no transition handles, record `RC-04` — `P1`
* in each finding, name the consequence that callers can see
  * for example: "callers can dispatch this event but the machine will never act on it"
* append the findings to `{{findings_log}}`
* return to the caller
