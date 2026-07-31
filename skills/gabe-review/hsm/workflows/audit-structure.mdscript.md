<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Structure

* for each region any transition can enter shallowly, require an initial (`ST-01`) — `P0`
* for each choice, require outgoing transitions and an unguarded default when guards are not
  exhaustive (`ST-02`) — `P0`
* for each final vertex, require no outgoing transitions and no entry, exit, or activity (`ST-03`) — `P1`
* for each history vertex, require a composite owner and a first-entry default (`ST-04`) — `P1`
* for each transition end, require an existing vertex (`ST-05`) — `P0`
* for each set of transitions sharing a trigger and a source, require disjoint guards or a single
  trailing unguarded default (`CF-06`, `CF-07`) — `P0` when neither holds
* for each transition whose only work is updating data or replying, require internal kind (`ST-09`) — `P1`
* for each self-transition where target equals source, require a stated reason of entry/exit
  re-execution or activity restart (`ST-10`) — `P1`
* for each transition with no trigger, require an explicit completion event rather than implied
  completion (`ST-11`) — `P1`
* flag orthogonal or parallel regions (`CN-02`) — `P0`, remediate as separate actors
* flag state or event names that encode implementation technology instead of the domain (`ST-12`) — `P2`
* append findings to `{{findings_log}}`
* return to the caller
