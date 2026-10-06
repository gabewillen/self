<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Define Implementation Contract

* before you edit, state the objective, done state, accepted inputs, promised outputs, blockers, and proof artifacts
* before you edit, state the tests, review gate, watcher requirement, and the authority that remains

* if the objective is a bug, regression, outage, flake, or other reported failure
  * [Require A Reproduction Before Fixing](#require-a-reproduction-before-fixing)

* set `{{claim_scope}}` and `{{proof_claim}}` to the exact claim before review

* use a typed scope such as `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`

* set `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, and `{{authority_needed}}`

* if the actual claim is source-health, CI repair, audit completion, blocker-note completion, publication, or live proof
  * do not ask reviewers for a vague `ready`
* if the actual claim is merge readiness, close readiness, release readiness, or deployment readiness
  * do not ask reviewers for a vague `ready`

* if the done state that the delegation asks for is broader than the available proof
  * claim only the narrower scope
  * name the broader blocker in `{{remaining_blockers}}`

* if a precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources
  * [Resolve Local Resource Path](#resolve-local-resource-path)

* if each precondition exists and the proof path passes
  * report `Proven for {{claim_scope}}`
  * stop

* if the local resource path is absent or unsafe, or you tried all of its options
  * if a precondition, resource, safe target, credential, hardware, network path, or authority is still absent
    * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
    * set `{{blocker}}` to the exact precondition that is absent
    * set `{{stop_reason}}` to `blocked`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* if preconditions are available and the proof is stale, incomplete, failed, over budget, unclear, or does not match the contract
  * do not report blocked
  * repair the proof
  * run [Verify Real Proof](verify-real-proof.mdscript.md#verify-real-proof)

* if you skipped an available local resource path
  * do not report blocked
  * repair that gap
  * run [Verify Real Proof](verify-real-proof.mdscript.md#verify-real-proof)

* for async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior
  * model explicit states, events, guards, typed inputs, typed outputs, failures, metrics, ownership, rollback, and teardown

* if the code work changes runtime behavior, services, APIs, workers, or external boundaries
  * put OTEL telemetry on the changed control paths, failure paths, and external boundaries
  * make that telemetry a non-negotiable `{{contract_postconditions}}` and `{{contract_invariants}}` requirement
  * if the language has OpenTelemetry (OTEL) APIs or an SDK
    * use those OpenTelemetry (OTEL) APIs or that SDK for those signals
  * do not accept a non-OTEL custom telemetry stack as a substitute for the same signals
  * do a cardinality analysis for each new or changed OTEL metric dimension, span attribute, and resource attribute under CORE-OBS-002
  * do a cardinality analysis for each new or changed OTEL log attribute and event label under CORE-OBS-002
  * in the contract evidence, record if each OTEL label or attribute key is bounded or unbounded
  * if the planned edit does not include OTEL instrumentation for those paths
    * set `{{blocker}}` to `OTEL telemetry is non-negotiable for code implementation; missing instrumentation on changed paths`
    * repair the contract and implementation plan to include OTEL on the changed control paths, failure paths, and external boundaries
    * [Define Implementation Contract](#define-implementation-contract)
  * if the planned OTEL instrumentation has no cardinality analysis
    * set `{{blocker}}` to `OTEL cardinality analysis is required; missing analysis of label and attribute keys`
    * repair the contract to include a cardinality analysis for each new or changed OTEL signal
    * [Define Implementation Contract](#define-implementation-contract)

* if the work replaces, renames, or migrates pre-1.0 code that is not in a production or user-facing environment
  * under LOCAL-CUT-001, add the removal of the replaced path, its tests, its configuration, and its documentation to `{{contract_postconditions}}`
  * make that removal occur in the same change
  * if no released or deployed consumer depends on the old path today
    * do not keep the old path
  * if you keep an old path
    * record its consumer and the condition that retires it as contract evidence
  * if the planned edit keeps a deprecated shim, compatibility alias, legacy fallback, version-suffixed duplicate, gating flag, or unreferenced file
    * if no named released or deployed consumer depends on that item
      * set `{{blocker}}` to `pre-1.0 and undeployed code requires a hard cutover; planned edit leaves deprecated or unused legacy code`
      * repair the contract and implementation plan to delete the replaced path in the same change
      * [Define Implementation Contract](#define-implementation-contract)

* if the system already knows a fact through structured data, typed state, product contracts, telemetry, or events
  * use deterministic code or product state
  * do not ask a model to reconstruct that fact

## Require A Reproduction Before Fixing

* if `{{troubleshoot_pass_active}}` is `true` or `{{red_confirmed}}` is `true`
  * set `{{proof_path}}` to the handed-down `{{repro_command}}`
  * treat `{{repro_test_path}}` as the reproduction that this lane must not change
  * return to the caller
* if the delegation gives a reproduction (a command, test, or artifact check that fails for this failure)
  * set `{{proof_path}}` to that reproduction
  * set `{{red_confirmed}}` to `true`
  * return to the caller
* set `{{troubleshoot_pass_active}}` to `true`
* if `{{skills_root}}` is empty and `{{implement_skill_root}}` is set
  * set `{{skills_root}}` to the parent of `{{implement_skill_root}}`
* if `{{skills_root}}` is empty and `{{repo_root}}/skills` exists
  * set `{{skills_root}}` to `{{repo_root}}/skills`
* if `{{skills_root}}` is empty
  * set `{{blocker}}` to `skills_root unresolved; cannot run self-troubleshoot`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* before you edit a fix, run `/mdscript-exec {{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md#troubleshoot-reported-issue` to get a red reproduction
* do not fix a failure that this lane did not reproduce

## Resolve Local Resource Path

* find a local path that can satisfy the precondition, for example:
  * the repo-local stack, bootstrap, preflight, or dev server
  * a compose profile, a fixture target, or a different safe local resource path

* if that path exists
  * set `{{local_resource_path}}` to that path

* if no such path exists
  * set `{{local_resource_path}}` to absent
  * record the files or commands that you searched

* until you use this local path, or show that it is unsafe or cannot satisfy the precondition
  * do not report absent infrastructure as blocked

## Implement Narrowly

* make the smallest change that satisfies `{{objective}}`
* keep the local architecture
* hold the `PONY-*` rules of the `impl-ponytail` pack: read first, then climb the ladder to the least code that works
* if `{{ponytail_level}}` is empty
  * set `{{ponytail_level}}` to the level that the user named in this conversation: `lite`, `full`, `ultra`, or `off`
  * if the user did not name a level, set `{{ponytail_level}}` to `full`
* if `{{ponytail_level}}` is `lite`
  * build what the user asked for
  * name the shorter alternative in one line, and let the user select
* if `{{ponytail_level}}` is `ultra`
  * prefer deletion to addition
  * ship the shortest version, and question the rest of the requirement in the same report
* if `{{ponytail_level}}` is `off`
  * do not apply `PONY-LADDER-001`, `PONY-DEL-001`, or `PONY-OUT-001`
  * continue to apply `PONY-READ-001`, `PONY-KEEP-001`, and `PONY-CHECK-001`
* if the request is complex
  * ship the shorter version, and ask in the same report if the user needs the full version
  * do not stop for an answer that has a safe default

* prefer explicit contracts, typed events, deterministic transforms, reversible paths, and observable boundaries

* if the code work changes runtime behavior, services, APIs, workers, or external boundaries
  * emit telemetry through OpenTelemetry (OTEL) on the changed control paths, failure paths, and external boundaries
  * analyze the cardinality of each new or changed OTEL metric dimension, span attribute, and resource attribute
  * analyze the cardinality of each new or changed OTEL log attribute and event label
  * do these cardinality analyses before you complete the edit
  * before ship, bound or reject unbounded high-cardinality label and attribute keys
  * treat absent OTEL instrumentation or an absent cardinality analysis as a release-blocking construction defect, not a deferred nicety

* if the work replaces, renames, or migrates pre-1.0 code that is not in a production or user-facing environment
  * move each call site to the replacement in this same change
  * delete the replaced path in this same change
  * delete the tests, configuration, documentation, and now-unreferenced files of the replaced path with it
  * do not introduce `@deprecated`, `DEPRECATED`, `legacy`, `old`, or backwards-compatibility markers for that code
  * treat deprecated, legacy, or unreferenced code that you leave behind as a release-blocking construction defect, not a deferred cleanup

* if the bug or contract is general (every event schema, every JSON hop, every selection)
  * fix the shared mechanism
  * do not add an ad-hoc branch that makes only one name, one stimulus, or one product work

* do not invent conversion helpers or special-case rebuilds that hide a broken generic path
* construct or validate through the type or schema that already owns the contract

* when you edit, keep each MUST and MUST NOT constraint from the selected packs in `{{impl_rule_packs}}`
* these packs load the same `self-review/references/engineering-rules/*.rules.md` files that the related `eng-*` review lanes check later

* if `{{impl_rule_packs}}` is empty and the work is code
  * run [Select Implementation Rules](select-implementation-rules.mdscript.md#select-implementation-rules)
  * run [Apply Selected Engineering Rules](apply-selected-engineering-rules.mdscript.md#apply-selected-engineering-rules)

* do not make unrelated refactors or metadata churn

* if the user or the orchestrator changes the objective
  * change the implementation contract
  * [Define Implementation Contract](#define-implementation-contract)

* if the claim scope changes
  * change `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and `{{remaining_blockers}}`
  * [Define Implementation Contract](#define-implementation-contract)

* if the in-scope paths or languages change so much that the selected packs are stale
  * run [Select Implementation Rules](select-implementation-rules.mdscript.md#select-implementation-rules)
  * run [Apply Selected Engineering Rules](apply-selected-engineering-rules.mdscript.md#apply-selected-engineering-rules)
