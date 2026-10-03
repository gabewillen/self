<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Evidence Boundary

* read [Evidence Boundary Policy](../references/evidence-boundary-policy.md)
* name the exact claim, the typed `{{proof_scope}}`, and the exact proof
* if the artifact is a PR or MR
  * examine the artifact for `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, and `{{proof_path}}`
  * for each Design by Contract field that is missing
    * add a finding with the consequence and an evidence pointer
* if a precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources
  * examine the artifact for `{{local_resource_path}}`
  * if `{{local_resource_path}}` is missing
    * add a finding that asks for the local resource path that can satisfy or falsify the precondition
* [Classify Proof Decision](#classify-proof-decision)

## Classify Proof Decision

* if all preconditions were available, all invariants held, and the proof path passed with current evidence
  * set `{{proof_decision}}` to `Proven for {{proof_scope}}`
* if a named precondition, resource, safe target, credential, hardware, network path, or authority is missing
  * if you examined or used all available local resource paths
    * set `{{proof_decision}}` to `Blocked for {{proof_scope}}`
    * set `{{blocker}}` to the exact missing precondition
* if the proof failed, is stale, is incomplete, or does not agree with the stated contract
  * if the preconditions are still available
    * set `{{proof_decision}}` to `Not ready for {{proof_scope}}`
* if the author claimed `Blocked` for a failed, stale, or incomplete proof path, or a contract mismatch
  * add a finding that asks for `Not ready for {{proof_scope}}` instead of `Blocked`
* if the author claimed `Blocked` for missing infrastructure
  * if a local stack, bootstrap, preflight, dev server, fixture target, compose file, or safe local resource path exists
    * add a finding that asks the author to run or rule out the local path first
* if the author skipped an available local resource path
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * add a finding that tells the implementer to run or rule out that path before a blocked claim
* if the local resource path passes and the author claims broader final readiness outside `{{proof_scope}}`
  * add a finding that local resource proof does not satisfy the broader claim
* if the local resource path is absent, unsafe, or fails
  * if the cause is a credential, provider, hardware device, network route, external safe target, or authority that is not available
    * set `{{grade}}` to `Blocked for {{proof_scope}}`
    * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
    * set `{{blocker}}` to the exact external precondition that prevents local proof
* [Check Scope Mapping](#check-scope-mapping)

## Check Scope Mapping

* map the proof that the author gave to the typed scopes in the evidence-boundary policy
* if the author gives a vague `ready` claim
  * set `{{proof_scope}}` to the narrowest scope that the given proof actually supports
  * if broader final proof remains
    * set `{{verdict_qualifier}}` to `Proven for {{proof_scope}} only`
* if the author offers narrower proof for a broader claim
  * add a finding that source-health or other narrow proof does not satisfy the broader claim
* if valid narrower proof is blocked only because broader final proof outside `{{proof_scope}}` is missing
  * record the gap under `{{proof_not_claimed}}` or `{{remaining_blockers}}`
* if one unclear readiness state mixes green CI, route checks, stale screenshots, unclear issue proof, Draft status, or live-resource blockers
  * add a finding that asks for an exact proof-scope and Design by Contract mapping
* if one unclear readiness state mixes traces, transcripts, benchmarks, or browser artifacts
  * add a finding that asks for an exact proof-scope and Design by Contract mapping
* if a CI budget or test invariant failed
  * set the failure class to source-health proof-path failure
* [Check Real Resource Proof](#check-real-resource-proof)

## Check Real Resource Proof

* if `{{proof_scope}}` includes `live-proof` or a final-readiness aggregate
  * examine the artifact for real-system proof, for example screenshots, UI snapshots, traces, metrics, logs, or rendered routes
  * examine the artifact for real service responses, call/audio artifacts, or other durable outputs of the same type
  * if real-system proof is missing
    * add a finding that asks for real-system proof for `{{proof_scope}}`
* if mocked services, fake providers, offline fixtures, canned responses, stubs, or local scaffolds are final proof
  * if the behavior depends on real resources
    * [Handle Mock As Final Proof](#handle-mock-as-final-proof)
* return to the caller

## Handle Mock As Final Proof

* if you can stand up the real resource locally
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * add a finding that asks for real-resource proof
  * return to the caller
* if you cannot get access to the real resource without outside help
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing real resource`
  * set `{{blocker}}` to the exact missing resource, target, access, or authority
  * return to the caller
* return to the caller

## Check UI And Product Surface

* read [UI Product Surface Policy](../references/ui-product-surface-policy.md)
* if the artifact does not change or claim a UI, frontend, dashboard, widget, or other user-visible product surface
  * return to the caller
* set `{{ui_features}}` to each changed or claimed user-visible feature
* include each visible button, table, graph, widget, workflow, empty state, breakpoint, CLI command, and claimed target selector
* for each feature in `{{ui_features}}`
  * examine the feature for a current visual snapshot from the real browser or device target
  * if the snapshot is missing
    * add a finding that asks for a current visual snapshot for each feature
  * if the snapshot exists
    * examine the snapshot and connect it to the feature claim
    * if the snapshot is one broad screenshot, a DOM-only assertion, or a unique-selector test
      * add a finding that rejects that artifact as per-feature UI proof
    * if the snapshot is not examined, is stale, or uses a mock-backed route as per-feature proof
      * add a finding that rejects that artifact as per-feature UI proof
* return to the caller
