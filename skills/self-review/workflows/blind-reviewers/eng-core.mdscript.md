<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Eng Core Blind Review

* set `{{reviewer_lane}}` to `eng-core`
* set `{{rules_pack}}` to `core`
* set `{{extra_rules_files}}` to `local.rules.md`, the local rules that a re-vendor must not remove
* if the diff adds or changes OpenTelemetry (OTEL) instrumentation, metrics, spans, attributes, or labels
  * attack missing or incomplete cardinality analysis under CORE-OBS-002 before any sign-off
  * make sure that the evidence marks each new or changed item as bounded or unbounded
    * the items are metric dimensions, span attributes, resource attributes, log attributes, and event labels
  * treat unanalyzed cardinality or unbounded high-cardinality keys left unbound as a release-blocking finding
* if the diff replaces, renames, or migrates pre-1.0 code that is not deployed to a production or user-facing environment
  * attack every retained old path under LOCAL-CUT-001 before any sign-off
  * search the diff and the repository for these items:
    * deprecated shims, compatibility aliases, legacy fallbacks, and version-suffixed duplicates
    * gate flags, and files that the change left without references
  * for each retained path, make sure that the diff names a released or deployed consumer
  * for each retained path, make sure that the diff names the condition that retires the old path
  * if deprecated, legacy, or unreferenced code stays without such a named consumer, treat it as a release-blocking finding
* if the review scope has commits and not a squashed working tree
  * before any sign-off, read each commit in the range with `git log --stat` and `git show`
  * attack each commit that has more than one logical change under LOCAL-GIT-001
  * attack format sweeps, drive-by refactors, dependency bumps, and unrelated fixes inside the commit of a different change
  * attack checkpoint messages such as `wip`, `fixup`, `oops`, `address review`, and `fix typo` that stay in the pushed range
  * if a commit cannot build or pass its own checks alone, treat it as a finding against bisectability
* run [Engineering Rules Blind Review](engineering-rules.mdscript.md#engineering-rules-blind-review)
