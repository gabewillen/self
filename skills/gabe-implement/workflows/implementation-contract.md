<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Define Implementation Contract

* state objective, done state, accepted inputs, promised outputs, blockers, proof artifacts, tests, review gate, watcher requirement, and remaining authority before editing

* state the exact claim before review as `{{claim_scope}}` and `{{proof_claim}}`
  * use typed scopes such as `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`
  * separate `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, and `{{authority_needed}}`
  * do not ask reviewers for vague `ready` when the actual claim is source-health, CI repair, audit completion, blocker-note completion, publication, live proof, merge readiness, close readiness, release readiness, or deployment readiness
  * if the requested done state is broader than the proof available, claim only the narrower scope and name the broader blocker

* when any precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources
  * identify the repo-local stack, bootstrap, preflight, dev server, compose profile, fixture target, or safe local resource path that can satisfy the precondition
  * record it as `{{local_resource_path}}`
  * if no such path exists, record `{{local_resource_path}}` as absent with the searched files or commands
  * do not treat missing infrastructure as blocked until this local path has been used, shown unsafe, or shown unable to satisfy the precondition

* make proof decidable even when proof is not available:
  * if every precondition exists and the proof path passes, report `Proven for {{claim_scope}}`
  * if a precondition, resource, safe target, credential, hardware, network path, or authority is missing after the local resource path is absent, unsafe, or exhausted, report `Blocked for {{claim_scope}}: missing <exact precondition>`
  * if proof is stale, incomplete, failing, over budget, unclear, or mismatched to the contract while preconditions are available, repair it instead of reporting blocked
  * if an available local resource path was skipped, repair that gap instead of reporting blocked

* for async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior
  * model explicit states, events, guards, typed inputs, typed outputs, failures, metrics, ownership, rollback, and teardown

* if the system already knows a fact through structured data, typed state, product contracts, telemetry, or events
  * use deterministic code or product state instead of asking a model to reconstruct it

## Implement Narrowly

* make the least invasive change that satisfies `{{objective}}` and preserves local architecture

* prefer explicit contracts, typed events, deterministic transforms, reversible paths, and observable boundaries

* do not make unrelated refactors or metadata churn

* if user or orchestrator changes the objective
  * update the implementation contract before continuing

* if the claim scope changes
  * update `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and `{{remaining_blockers}}` before continuing
