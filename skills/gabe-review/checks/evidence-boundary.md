<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Evidence Boundary

* read [Evidence Boundary Policy](../references/evidence-boundary-policy.md)
* name the exact claim, typed `{{proof_scope}}`, and exact proof
* if the artifact is a PR or MR
  * inspect for `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, and `{{proof_path}}`
  * for each missing Design by Contract field
    * add a finding with consequence and evidence pointer
* if any precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources
  * inspect for `{{local_resource_path}}`
  * if `{{local_resource_path}}` is missing
    * add a finding requiring the local resource path that can satisfy or falsify the precondition
* [Classify Proof Decision](#classify-proof-decision)

## Classify Proof Decision

* if every precondition was available, every invariant held, and the proof path passed with current evidence
  * set `{{proof_decision}}` to `Proven for {{proof_scope}}`
* if a named precondition, resource, safe target, credential, hardware, network path, or authority is missing after any available local resource path has been checked or exhausted
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}`
  * set `{{blocker}}` to the exact missing precondition
* if the proof failed, went stale, is incomplete, or mismatches the stated contract while preconditions remain available
  * set `{{proof_decision}}` to `Not ready for {{proof_scope}}`
* if the author claimed `Blocked` for a failure, stale, incomplete, or mismatched proof path
  * add a finding requiring `Not ready for {{proof_scope}}` instead of `Blocked`
* if the author claimed `Blocked` for missing infrastructure while a local stack, bootstrap, preflight, dev server, fixture target, compose file, or safe local resource path exists
  * add a finding requiring the local path be run or ruled out first
* if the author skipped an available local resource path
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * add a finding requiring the implementer to run or rule out that local path before claiming blocked proof
* if the local resource path passes and the author claims broader final readiness outside `{{proof_scope}}`
  * add a finding that local resource proof does not satisfy the broader claim
* if the local resource path is absent, unsafe, or fails because a credential, provider, hardware device, network route, external safe target, or authority is genuinely unavailable
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
  * set `{{blocker}}` to the exact external precondition that prevents local proof
* [Check Scope Mapping](#check-scope-mapping)

## Check Scope Mapping

* map the supplied proof to the typed scopes in the evidence-boundary policy
* if the author gives a vague `ready` claim
  * set `{{proof_scope}}` to the narrowest scope actually supported by the supplied proof
  * set `{{verdict_qualifier}}` to `Proven for {{proof_scope}} only` when broader final proof remains
* if narrower proof is offered for a broader claim
  * add a finding that source-health or other narrow proof does not satisfy the broader claim
* if valid narrower proof is blocked only because broader final proof outside `{{proof_scope}}` is missing
  * record the gap under `{{proof_not_claimed}}` or `{{remaining_blockers}}`
* if green CI, route checks, stale screenshots, unclear issue proof, Draft status, live-resource blockers, traces, transcripts, benchmarks, or browser artifacts are blended into one mushy readiness state
  * add a finding requiring exact proof-scope and Design by Contract mapping
* if a CI budget or test invariant failed
  * set the failure class to source-health proof-path failure
* [Check Real Resource Proof](#check-real-resource-proof)

## Check Real Resource Proof

* if `{{proof_scope}}` includes `live-proof` or any final-readiness aggregate
  * inspect for real-system proof such as screenshots, UI snapshots, traces, metrics, logs, rendered routes, real service responses, call/audio artifacts, or comparable durable outputs
  * if real-system proof is missing
    * add a finding requiring real-system proof for `{{proof_scope}}`
* if mocked services, fake providers, offline fixtures, canned responses, stubs, or local scaffolds are final proof for behavior that depends on real resources
  * [Handle Mock As Final Proof](#handle-mock-as-final-proof)
* return to the caller

## Handle Mock As Final Proof

* if the real resource can be stood up locally
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * add a finding requiring real-resource proof
  * return to the caller
* if the real resource cannot be accessed without outside help
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing real resource`
  * set `{{blocker}}` to the exact missing resource, target, access, or authority
  * return to the caller
* return to the caller

## Check UI And Product Surface

* read [UI Product Surface Policy](../references/ui-product-surface-policy.md)
* if the artifact does not change or claim a UI, frontend, dashboard, widget, or other user-visible product surface
  * return to the caller
* set `{{ui_features}}` to every changed or claimed user-visible feature, including every visible button, table, graph, widget, workflow, empty state, breakpoint, CLI command, and target selector treated as a claim
* for each feature in `{{ui_features}}`
  * inspect for a current visual snapshot from the real browser or device target
  * if the snapshot is missing
    * add a finding requiring a current per-feature visual snapshot
  * if the snapshot exists
    * inspect the snapshot and connect it to the feature claim
    * if the snapshot is a single broad screenshot, DOM-only assertion, unique-selector test, uninspected snapshot, stale snapshot, or mock-backed route used as per-feature proof
      * add a finding rejecting that artifact as per-feature UI proof
* return to the caller
