<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Define Implementation Contract

* before you edit, state these items:
  * the objective, the done state, the inputs, and the outputs
  * the proof artifacts, the tests, and the authority that remains
* if the objective is a bug, regression, outage, flake, or reported failure, [Require A Reproduction Before Fixing](#require-a-reproduction-before-fixing)
* set `{{claim_scope}}` to a typed scope: `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`
* set `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and `{{remaining_blockers}}`
* if the requested done state is broader than the proof that you can get
  * claim only the narrower scope, and name the gap in `{{remaining_blockers}}`
* if a precondition needs infrastructure, a service, a target, hardware, a network, storage, or a browser, [Resolve Local Resource Path](#resolve-local-resource-path)
* for async, lifecycle, retry, timeout, or user-visible behavior, model the states, events, guards, typed inputs and outputs, failures, and teardown
* if the system already knows a fact through typed data or events
  * use that data, and do not ask a model to rebuild it
* if the code work changes runtime behavior, services, APIs, workers, or external boundaries
  * make OpenTelemetry (OTEL) telemetry on the changed control paths, failure paths, and external boundaries a non-negotiable `{{contract_postconditions}}` and `{{contract_invariants}}` requirement
  * use the OTEL API or SDK of the language, not a custom telemetry stack
  * do a cardinality analysis for each new or changed OTEL key under CORE-OBS-002
    * the keys are metric dimensions, span, resource, and log attributes, and event labels
    * record each key as bounded or unbounded
  * if the planned edit does not include OTEL instrumentation for those paths
    * set `{{blocker}}` to `OTEL telemetry is non-negotiable for code implementation; missing instrumentation on changed paths`
    * repair the contract and implementation plan to include OTEL on those paths
    * [Define Implementation Contract](#define-implementation-contract)
  * if the planned OTEL instrumentation has no cardinality analysis
    * set `{{blocker}}` to `OTEL cardinality analysis is required; missing analysis of label and attribute keys`
    * [Define Implementation Contract](#define-implementation-contract)
* if the work replaces, renames, or migrates pre-1.0 code that is not deployed (LOCAL-CUT-001)
  * add the deletion of the old path, its tests, its configuration, and its docs to `{{contract_postconditions}}`
  * keep an old path only for a named deployed consumer, and record the condition that retires it
* return to the caller

## Require A Reproduction Before Fixing

* if `{{troubleshoot_pass_active}}` or `{{red_confirmed}}` is `true`
  * set `{{proof_path}}` to `{{repro_command}}`, do not change `{{repro_test_path}}`, and return to the caller
* if the delegation gives a reproduction that fails for this failure
  * set `{{proof_path}}` to it, set `{{red_confirmed}}` to `true`, and return to the caller
* set `{{troubleshoot_pass_active}}` to `true`
* run `/mdscript-exec {{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md#troubleshoot-reported-issue` to get a red reproduction before you fix
* do not fix a failure that this lane did not reproduce

## Resolve Local Resource Path

* look in `AGENTS.md`, `README*`, `Makefile`, `justfile`, compose files, `package.json`, `pyproject.toml`, and `scripts/*{stack,local,preflight,dev}*`
* set `{{local_resource_path}}` to a safe local path that can satisfy the precondition
  * for example a local stack, bootstrap, preflight, dev server, compose profile, or fixture target
* if none exists, set it to absent, and record what you searched
* do not report missing infrastructure as blocked until one of these is true:
  * you used that path
  * you showed that it is unsafe or cannot satisfy the precondition
* return to the caller

## Implement Narrowly

* hold `LOCAL-LEAN-001` to `LOCAL-LEAN-003`: read first, then make the least change that satisfies `{{objective}}`
* if the request is complex, ship the short version, and ask in the report if the user needs more
* keep the local architecture, and do not refactor unrelated code
* hold each `MUST` rule of the packs in `{{impl_rule_packs}}`
  * if the list is empty, or the paths changed, run [Select Implementation Rules](select-implementation-rules.mdscript.md#select-implementation-rules) and [Apply Selected Engineering Rules](apply-selected-engineering-rules.mdscript.md#apply-selected-engineering-rules)
* if the code work changes runtime behavior, services, APIs, workers, or external boundaries
  * emit telemetry through OpenTelemetry (OTEL) on the changed control paths, failure paths, and external boundaries
  * analyze the cardinality of each new or changed OTEL key before you finish
  * bound or reject each unbounded high-cardinality key
* for a pre-1.0, undeployed replacement, move each call site in the same change
  * delete the old path, its tests, configuration, and docs in the same change
  * do not add `@deprecated`, `legacy`, or compatibility markers
* fix a general defect in the shared mechanism, not with a branch for one name or one product
* build and validate through the type or schema that owns the contract
* if the objective or the claim scope changes, [Define Implementation Contract](#define-implementation-contract)
* return to the caller
