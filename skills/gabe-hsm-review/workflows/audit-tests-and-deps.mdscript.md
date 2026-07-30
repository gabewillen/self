<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Tests And Deps

* for hsm.go tests in scope
  * flag assertions on post-transition state without waiting Dispatch/Set/Stop channels (HSM53) as `P1`
  * flag production use of AfterProcess/AfterEntry-style hooks as sync (HSM54) as `P0`
* for grantt overlay
  * enumerate tracked `go.mod` files under repo that require `github.com/stateforward/hsm.go`
  * flag any version other than exactly `v1.3.1` or any `replace` of that module (grantt pin) as `P0`
  * flag substitute state-machine libraries as `P0`
* for sml/emel tests
  * note missing determinism / no-alloc / bounded-anonymous-transition tests as `P2` when machines are non-trivial
* if project claims boundary transfer via HSM
  * require structural + negative proof paths named; missing negative proof is `P1` under grantt milestone evidence themes
* append findings to `{{findings}}`
* return to the caller
