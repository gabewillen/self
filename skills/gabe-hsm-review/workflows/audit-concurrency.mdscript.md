<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Concurrency

* enforce **run-to-completion** (`ST-06`, `BH-06`) — flag re-entrant self-dispatch mid-step as `P0`
* flag external locks/queues used to paper over missing machine structure only when they replace explicit state/events — map to `ST-06` / project overlay notes
* if orthogonal/parallel regions appear, apply `OR-01`/`OR-02` per project policy
* do not require a particular framework actor runtime
* append findings with UML ids first
* return to the caller
