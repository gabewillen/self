<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Eng Core Blind Review

* set `{{reviewer_lane}}` to `eng-core`
* set `{{rules_pack}}` to `core`
* set `{{extra_rules_files}}` to `local.rules.md`, the locally authored rules a re-vendor must not drop
* when the diff adds or changes OpenTelemetry (OTEL) instrumentation, metrics, spans, attributes, or labels
  * attack missing or incomplete cardinality analysis under CORE-OBS-002 before any sign-off
  * require evidence that each new or changed metric dimension, span attribute, resource attribute, log attribute, and event label was analyzed as bounded or unbounded
  * treat unanalyzed cardinality or unbounded high-cardinality keys left unbound as a release-blocking finding
* when the diff replaces, renames, or migrates code that is pre-1.0 and not deployed to a production or user-facing environment
  * attack every retained old path under LOCAL-CUT-001 before any sign-off
  * search the diff and the repository for deprecated shims, compatibility aliases, legacy fallbacks, version-suffixed duplicates, gating flags, and files the change left unreferenced
  * require the diff to name a released or deployed consumer, and the condition that retires the old path, for each retained path
  * treat deprecated, legacy, or unreferenced code left behind without such a named consumer as a release-blocking finding
* when the review scope carries commits rather than a squashed working tree
  * read each commit in the range with `git log --stat` and `git show` before any sign-off
  * attack any commit that carries more than one logical change under LOCAL-GIT-001
  * attack formatting sweeps, drive-by refactors, dependency bumps, and unrelated fixes that ride along inside another change's commit
  * attack checkpoint messages such as `wip`, `fixup`, `oops`, `address review`, and `fix typo` surviving in the pushed range
  * treat a commit that cannot build or pass its governing checks on its own as a finding against bisectability
* run [Engineering Rules Blind Review](engineering-rules.mdscript.md#engineering-rules-blind-review)
