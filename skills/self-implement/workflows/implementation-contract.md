<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Define Implementation Contract

* state objective, done state, accepted inputs, promised outputs, blockers, proof artifacts, tests, review gate, watcher requirement, and remaining authority before editing

* set `{{claim_scope}}` and `{{proof_claim}}` to the exact claim before review

* use a typed scope such as `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`

* set `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, and `{{authority_needed}}`

* do not ask reviewers for vague `ready` when the actual claim is source-health, CI repair, audit completion, blocker-note completion, publication, live proof, merge readiness, close readiness, release readiness, or deployment readiness

* if the requested done state is broader than the proof available
  * claim only the narrower scope
  * name the broader blocker in `{{remaining_blockers}}`

* if any precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources
  * [Resolve Local Resource Path](#resolve-local-resource-path)

* if every precondition exists and the proof path passes
  * report `Proven for {{claim_scope}}`
  * stop

* if a precondition, resource, safe target, credential, hardware, network path, or authority is missing after the local resource path is absent, unsafe, or exhausted
  * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to the exact missing precondition
  * set `{{stop_reason}}` to `blocked`
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* if proof is stale, incomplete, failing, over budget, unclear, or mismatched to the contract while preconditions are available
  * repair the proof instead of reporting blocked
  * run [Verify Real Proof](verify-real-proof.md#verify-real-proof)

* if an available local resource path was skipped
  * repair that gap instead of reporting blocked
  * run [Verify Real Proof](verify-real-proof.md#verify-real-proof)

* for async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior
  * model explicit states, events, guards, typed inputs, typed outputs, failures, metrics, ownership, rollback, and teardown

* if the system already knows a fact through structured data, typed state, product contracts, telemetry, or events
  * use deterministic code or product state instead of asking a model to reconstruct it

## Resolve Local Resource Path

* identify the repo-local stack, bootstrap, preflight, dev server, compose profile, fixture target, or safe local resource path that can satisfy the precondition

* set `{{local_resource_path}}` to that path when it exists

* if no such path exists
  * set `{{local_resource_path}}` to absent
  * record the searched files or commands

* do not treat missing infrastructure as blocked until this local path has been used, shown unsafe, or shown unable to satisfy the precondition

## Implement Narrowly

* make the least invasive change that satisfies `{{objective}}` and preserves local architecture

* prefer explicit contracts, typed events, deterministic transforms, reversible paths, and observable boundaries

* hold every MUST and MUST NOT constraint from selected packs in `{{impl_rule_packs}}` while editing; those packs load the same `self-review/references/engineering-rules/*.rules.md` files the matching `eng-*` review lanes will check later

* if `{{impl_rule_packs}}` is empty and the work is code
  * run [Select Implementation Rules](select-implementation-rules.md#select-implementation-rules)
  * run [Apply Selected Engineering Rules](apply-selected-engineering-rules.md#apply-selected-engineering-rules)

* do not make unrelated refactors or metadata churn

* if user or orchestrator changes the objective
  * update the implementation contract
  * [Define Implementation Contract](#define-implementation-contract)

* if the claim scope changes
  * update `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and `{{remaining_blockers}}`
  * [Define Implementation Contract](#define-implementation-contract)

* if in-scope paths or languages change enough that selected packs are stale
  * run [Select Implementation Rules](select-implementation-rules.md#select-implementation-rules)
  * run [Apply Selected Engineering Rules](apply-selected-engineering-rules.md#apply-selected-engineering-rules)
