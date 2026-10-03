<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Time And Determinism

* for each sleep, timer, or ticker that a behavior creates, record `TM-01` — `P0`
  * write in the finding that time belongs to the model as an after, every, or at trigger
* for each blocking wait in a guard, effect, entry, or exit, record `BH-05` — `P0`
* for each guard, effect, entry, or exit
  * if it reads an ambient clock, random value, filesystem, network, or environment, record `TM-03` — `P1`
  * give the remediation: injection, or data that an event carries
* for each async completion that returns by a route that is not an event, record `TM-02` — `P0`
* for each activity that ignores cancellation, record `BH-03` — `P1`
* for short synchronous work in an activity where an entry or effect is enough, record `BH-03` — `P2`
* do not report platform timers in boundary loops and tests outside machine behavior
* append the findings to `{{findings_log}}`
* return to the caller
