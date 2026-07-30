<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Structure

* for each machine in `{{machine_inventory}}` with kind `hsm`
  * check top-level `hsm.Initial` exists (HSM01 / CORE)
  * check composites that nest states have explicit `Initial` when auto-entry is intended (HSM02)
  * check no entry/exit on the top-level machine (HSM03–04)
  * check `hsm.Choice` nodes have outgoing transitions and a final unguarded fallback (HSM16–18 / DSL-04)
  * check finals have no transitions/activities/entry/exit (HSM49 / DSL-06)
  * check history only inside composites with default target when needed (HSM50–51 / DSL-05)
  * check names lack `/` and new symbols avoid `hsm_` / `_hsm` when grantt overlay on (DSL-02 / G-NAME)
  * check Target/Source paths resolve to declared vertices when statically obvious (HSM19)
  * append findings for violations with rule id, path, evidence snippet
* for each machine with kind `sml`
  * check transition tables use destination-first `<=` form in new/changed code (SML-TT)
  * check model exposed as `using sm = ...` / component `sm` pattern when emel overlay on
  * check no macros in models
  * append findings with rule id and path
* for large single files with many states and few submachines
  * consider `P2` state-explosion / missing decomposition (HSM47 / CORE-13)
* return to the caller
