<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Control Flow

* run check-patterns control-flow scans for the active dialect over `{{review_scope}}`
* for `hsm` behavior (entry/exit/effect/activity/guard functions)
  * flag `if`/`switch` that selects which event to dispatch or which transition path to take (CORE-01 / G-BRANCH / HSM16) as `P0`/`P1`
  * allow pure data shaping and a single typed completion/error dispatch when `{{allow_completion_dispatch}}` is true (G-COMP / G-ERR / HSM11)
  * flag missing `CompletionEventKind` on machine-owned follow-up progression events (HSM11 / G-COMP) as `P0`
  * flag failure progression not using `ErrorEventKind` when clearly machine-owned error (G-ERR) as `P1`
  * flag triggerless transitions expecting implicit completion (HSM10) as `P0`
  * flag string wildcard event triggers instead of typed/`AnyEvent` (HSM12) as `P1`
  * flag `AnyEvent` without lifecycle guards when it can swallow internal events (HSM52) as `P1`
* for `sml` actions/detail/member methods
  * flag runtime `if`/`switch`/`?:` and branch-emulating loops (SML-A2 / SML-A3) as `P0`
  * flag helpers in `detail` that choose algorithm/path/variant (SML-A5 / SML-D1) as `P0`
  * flag self `process_event` from guard/action/entry/exit (SML-RE) as `P0`
  * flag completion/anonymous used as per-element data loops (SML-COMP) as `P0`
* confirm conditional graph routing uses `hsm.Choice` / guarded transitions / SML guards — not ad hoc target selection
* append all findings onto `{{findings}}`
* return to the caller
