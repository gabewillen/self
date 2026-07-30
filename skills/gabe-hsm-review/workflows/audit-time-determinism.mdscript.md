<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Time And Determinism

* for each sleep, timer, or ticker created inside a behavior, record `TM-01` — `P0`; time belongs to
  the model as an after, every, or at trigger
* for each blocking wait inside a guard, effect, entry, or exit, record `BH-05` — `P0`
* for each ambient clock, random, filesystem, network, or environment read in a guard, effect,
  entry, or exit, record `TM-03` — `P1`; require injection or event-carried data
* for each async completion that returns by any route other than an event, record `TM-02` — `P0`
* for each activity that ignores cancellation, record `BH-03` — `P1`
* for short synchronous work placed in an activity where entry or effect would do, record `BH-03` — `P2`
* boundary loops and tests outside machine behavior may use platform timers; do not report those
* append findings to `{{findings_log}}`
* return to the caller
