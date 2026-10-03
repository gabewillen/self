<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Structure

* for each region that a transition can enter shallowly
  * if the region has no initial, record `ST-01` — `P0`
* for each choice
  * if it has no outgoing transitions, record `ST-02` — `P0`
  * if the guards are not exhaustive and there is no unguarded default, record `ST-02` — `P0`
* for each final vertex
  * if it has an outgoing transition, an entry, an exit, or an activity, record `ST-03` — `P1`
* for each history vertex
  * if it has no composite owner or no first-entry default, record `ST-04` — `P1`
* for each transition end
  * if its vertex does not exist, record `ST-05` — `P0`
* for each set of transitions with the same trigger and the same source
  * if the guards are not disjoint and there is no single unguarded default at the end, record (`CF-06`, `CF-07`) — `P0`
* for each transition whose only work is to change data or to reply
  * if its kind is not internal, record `ST-09` — `P1`
* for each self-transition where the target is the source
  * if no stated reason says that entry and exit must run again or the activity must restart, record `ST-10` — `P1`
* for each transition with no trigger
  * if it uses an implied completion and not an explicit completion event, record `ST-11` — `P1`
* for orthogonal or parallel regions, record `CN-02` — `P0`
  * give the remediation: separate actors
* for state or event names that show the implementation technology and not the domain, record `ST-12` — `P2`
* append the findings to `{{findings_log}}`
* return to the caller
