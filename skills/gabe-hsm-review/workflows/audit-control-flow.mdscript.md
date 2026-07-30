<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Control Flow

* load [hsm-core-rules.md](../references/hsm-core-rules.md) control-flow and behavior sections
* scan behaviors in scope: **guards**, **effects/actions**, **entry**, **exit**, **activities/do-activities** (framework names may differ)
* for each conditional (`if` / `else` / `switch` / `?:` / branch tables / success-fail early returns that pick a path)
  * if it selects a transition, next state, which event to emit to drive the machine, retry vs fail vs success, or which algorithm/path runs next
    * add `P0` finding `CF-02` / `CF-05` with location and evidence
  * if it is purely local data math/formatting with a single continuation
    * allow under `CF-03` (note in evidence if borderline)
* require runtime branching between outcomes to appear as **guarded transitions** and/or **choice** with outgoing guards and else/default when needed (`CF-01`, `CF-04`, `ST-02`)
* flag missing choice/else when multiple guarded outcomes are incomplete (`ST-02`) as `P0`/`P1`
* flag guards with side effects (`BH-01`) as `P0`
* flag entry/exit/effect with external I/O, sleeps, network, timer creation, or other world side effects (`BH-02`, `BH-05`) as `P0`
* flag long-running or async work in entry/exit/effect/guard instead of activity (`BH-03`, `BH-04`) as `P0`
* flag activities that themselves branch control flow instead of completing via events (`CF-02`, `TM-02`) as `P0`
* flag self re-dispatch that breaks RTC (`BH-06`, `ST-06`) as `P0`
* find sibling states with the **same event** and same (or near-same) target/effect
  * if not handled once on a common hierarchical parent, add `P0`/`P1` `HI-01` / `HI-02` recommending lift into composite
* only after UML findings, optionally attach `framework_note` for local remediation syntax (Choice API name, etc.) without changing severity
* append all findings to `{{findings}}`
* return to the caller
