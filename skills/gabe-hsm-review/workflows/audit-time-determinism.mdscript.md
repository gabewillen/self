<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Time And Determinism

* scan entry/exit/effect/guard for sleeps, ambient timers, wall-clock reads, blocking waits (`BH-02`, `BH-05`, `TM-01`, `TM-03`) — `P0`/`P1`
* require **machine-owned time events** (after/every/at or UML time events) rather than ad-hoc sleeps in behaviors (`TM-01`) — `P0`
* require async completion to re-enter as **events**; activities may run long work but must not branch outcomes in-code (`TM-02`, `CF-02`) — `P0`
* flag long-running/async work placed in entry/exit/effect/guard instead of activity (`BH-03`, `BH-04`) — `P0`
* flag activities that cannot be canceled/interrupted on state exit when the platform supports it — `P1`
* flag short pure sync work incorrectly forced into activities when entry/effect would suffice — `P2` (style)
* flag random/env/FS/network in guards or pure behaviors without injection (`TM-03`) — `P1`
* append findings with UML ids first; framework timer API names only as `framework_note`
* return to the caller
