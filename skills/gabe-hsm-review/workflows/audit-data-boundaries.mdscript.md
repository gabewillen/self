<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Data Boundaries

* flag external packages/methods mutating machine fields/context/attributes directly (CORE-08 / CORE-19 / HSM22) as `P0`
* flag durable machine state stuffed into `context.Context` instead of attributes/fields (HSM24) as `P1`
* flag submachines reading/writing each other’s context (CORE-24 / SML-X1) as `P0`
* flag missing explicit unhandled-event policy where events can disappear (CORE-23 / SML-UE) as `P1`
* flag public API that requires callers to poke internals instead of dispatching events (CORE-09) as `P1`
* for sml:
  * flag context fields used as per-dispatch scratch (`request`, `phase`, `step`, `err`, `*_out`) (SML-C1) as `P1`
  * flag context mutation in guards (SML-C2) as `P0`
  * flag required event fields as owning pointers/dynamic containers on hot path (SML-E1) as `P1`
  * flag callbacks stored or calling `process_event` (SML-X2) as `P0`
* for grantt tool-surface ownership claims
  * flag post-filter of `TakeSnapshot` tool lists instead of HSM-owned visibility (G-OWN) as `P1`
* append findings to `{{findings}}`
* return to the caller
