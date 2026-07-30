<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Time And Determinism

* scan behavior paths for `time.Sleep`, `time.After`, `time.NewTicker`, `time.Tick`, wall `time.Now` in dispatch-critical logic
* flag those inside HSM entry/exit/effect/activity/guard as `P0`/`P1` (CORE-05 / G-TIME / HSM42 / G-DET)
* require machine-owned `hsm.After` / `hsm.Every` / `hsm.At` (or SML tick events with injected time) instead
* flag while/poll loops inside activities (CORE-04) as `P0`
* flag activities used for short synchronous work (HSM44–45) as `P2`
* flag long activities that ignore `ctx.Done()` (HSM46) as `P1`
* flag random, env, FS, or network reads inside transition-driving logic without injection (CORE-26 / G-DET) as `P1`
* for sml: flag wall-clock reads in guards/actions and actor-created threads/timers (SML-G1 / SML-T1) as `P0`
* append findings to `{{findings}}`
* return to the caller
