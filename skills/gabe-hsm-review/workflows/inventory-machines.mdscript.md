<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Inventory Machines

* set `{{machine_inventory}}` to an empty list
* if dialect includes `hsm.go` or `hsm.*`
  * search scope for `hsm.Define(`, `hsm.State(`, `hsm.Initial(`, model vars assigned from Define
  * for each hit, record path, symbol/name if recoverable, and kind `hsm`
* if dialect includes `sml.cpp`
  * search scope for `make_transition_table`, `struct model`, `sml::sm<`, `emel::` component `sm.hpp`
  * for each hit, record path, component namespace if recoverable, and kind `sml`
* also record likely behavior files nearby (`*_test.go`, `actions.hpp`, `guards.hpp`, `detail.hpp`)
* write `{{out_dir}}/machines.json` with the inventory
* set `{{machine_inventory}}` from that file
* if inventory is empty but scope clearly contains lifecycle/actor/NATS consumer code without a machine
  * leave inventory empty (later audits may still raise “HSM required” findings)
* return to the caller
