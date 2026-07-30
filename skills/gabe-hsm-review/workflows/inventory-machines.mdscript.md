<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Inventory Machines

* set `{{machine_inventory}}` to an empty list
* search scope for state machine / statechart definitions using framework-agnostic cues:
  * explicit states + transitions + events/guards
  * `state`/`transition`/`choice`/`initial`/`final` models
  * known bindings only as helpers: `hsm.Define`, `make_transition_table`, XState `createMachine`, etc.
* for each hit, record path, name if recoverable, and optional dialect binding
* also record nearby behavior units (entry/exit/effect/guard/activity implementations)
* write `{{out_dir}}/machines.json`
* set `{{machine_inventory}}` from that file
* return to the caller
