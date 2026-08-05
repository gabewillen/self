<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Eng Core Blind Review

* set `{{reviewer_lane}}` to `eng-core`
* set `{{rules_pack}}` to `core`
* set `{{extra_rules_files}}` to `local.rules.md`, the locally authored rules a re-vendor must not drop
* when the diff adds or changes OpenTelemetry (OTEL) instrumentation, metrics, spans, attributes, or labels
  * attack missing or incomplete cardinality analysis under CORE-OBS-002 before any sign-off
  * require evidence that each new or changed metric dimension, span attribute, resource attribute, log attribute, and event label was analyzed as bounded or unbounded
  * treat unanalyzed cardinality or unbounded high-cardinality keys left unbound as a release-blocking finding
* run [Engineering Rules Blind Review](engineering-rules.mdscript.md#engineering-rules-blind-review)
