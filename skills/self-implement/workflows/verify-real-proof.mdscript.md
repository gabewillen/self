<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Verify Real Proof

* run the focused tests and the related broader tests
* check `{{contract_preconditions}}`, then run `{{proof_path}}` through the boundary that `{{claim_scope}}` needs
* if a precondition needs infrastructure, run [Resolve Local Resource Path](implementation-contract.mdscript.md#resolve-local-resource-path), and stand up or reuse it inside `{{granted_permissions}}`
* for a narrow claim (`source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`), give that proof, and list the broader proof under `{{proof_not_claimed}}`
* for `live-proof`, `publication`, a readiness claim, or done, check the final candidate on the real affected boundary
* for a changed visible surface, capture and inspect a current snapshot of each changed feature
  * use the real browser or device
* if the work is code that changes runtime behavior, services, APIs, workers, or external boundaries
  * make sure that OpenTelemetry (OTEL) instrumentation covers the changed control paths, failure paths, and external boundaries
  * make sure a cardinality analysis exists for each new or changed OTEL key
  * if the OTEL telemetry is absent, uses only a custom stack, or does not run in the proof path
    * set `{{blocker}}` to `OTEL telemetry is non-negotiable; missing or unproven instrumentation on changed paths`
    * repair it, then [Verify Real Proof](#verify-real-proof)
  * if the cardinality analysis is absent or incomplete, or leaves an unbounded key
    * set `{{blocker}}` to `OTEL cardinality analysis is required; missing or incomplete analysis of label and attribute keys`
    * repair it, then [Verify Real Proof](#verify-real-proof)
* for a pre-1.0, undeployed replacement, search for the old symbols, files, flags, and docs
  * if one remains without a named deployed consumer, delete it, then [Verify Real Proof](#verify-real-proof)
* if the proof fails, is stale, breaks an invariant, or does not match the postconditions
  * repair it, then [Verify Real Proof](#verify-real-proof)
* never count mocks, fakes, fixtures, canned responses, or stubs as done proof for real-resource behavior; list them under `{{proof_not_claimed}}`
* if a credential, hardware, network, safe target, source truth, or authority is still missing after the local path
  * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to the missing item, and `{{stop_reason}}` to `blocked`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* return to the caller
