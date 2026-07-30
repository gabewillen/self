<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Data Boundaries

* flag external mutation of machine internals instead of event-driven interaction as `P1` design smell (pair with UML graph ownership)
* flag missing explicit unhandled/defer policy (`ST-07`, `ST-08`) as `P1`
* flag ad-hoc deferred-event buffers outside the machine (`ST-08`) as `P1`
* do not enforce framework-specific attribute APIs unless project overlay requires them
* append findings with UML ids first
* return to the caller
