<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Concurrency

* scan scope for `sync.Mutex`, `sync.RWMutex`, heavy `atomic.` use, custom queues, mailboxes, `process_queue`, `defer_queue`
* when grantt/mjw-style overlays apply and a type is an actor, NATS consumer/producer, or protects lifecycle with mutex/atomics without an HSM
  * add `P0` “HSM required” finding with the grantt when-required rule
* when an HSM already serializes RTC context but code still locks for normal machine context
  * add `P0`/`P1` HSM27–28 finding
* flag custom pending-event buffers / replay queues when `hsm.Defer` would fit (G-PRIM / HSM48) as `P1`
* flag parallel/orthogonal region modeling or multi-active-region hacks (CORE-15 / DSL-03) as `P0`
* flag re-entrant self-dispatch during a step (CORE-28 / SML-RE) as `P0`
* for sml: flag any mailbox/post-for-later (SML-NQ) as `P0`
* do not flag pure stateless utilities that only compute without lifecycle
* append findings to `{{findings}}`
* return to the caller
