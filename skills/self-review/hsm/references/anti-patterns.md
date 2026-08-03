# Anti patterns for the reviewer

- Do not run a later gate after an earlier gate found something, unless `{{full_sweep}}` is `true`.
- Do not treat any rule as advisory. Every rule blocks; the only escape is a named waiver.
- Do not report a finding that has not survived blind refutation.
- Do not treat docs or SUMMARY files as proof the machine is correct.
- Do not derive structure by reading definition source when `graph.json` exists.
- Do not report a rule the repo's own pre-commit/edit-time enforcement already blocks; audit that
  enforcement for gaps instead.
- Do not waive a blocking finding without an explicit user waiver naming rule ids.
- Do not name a library API in a finding without confirming it in the pinned version.
- Do not let a project overlay weaken a core rule or demote it out of blocking.
- Do not accept orthogonal or parallel regions; require actors coordinating by events.
- Do not accept duplicated same-event transitions on siblings when an ancestor can own them.
- Do not accept flat multi-step workflows without a hierarchical parent for shared scope.
- Do not accept the same `defer` / deferred-event set copied onto every workflow step state.
- Do not accept behavior hidden inside entry, exit, effect, or activity bodies; require it in the graph.
- Do not accept multi-guard fan-outs that gate actions; prefer an explicit state. Guards only prevent transitions.
- Do not accept multi-step workflows inside one activity; decompose into states and drive them with completion events.
- Do not accept "the activity mutates the struct directly" — activities run outside the RTC step.
- Do not rewrite machines in this skill — findings and remediation only.
