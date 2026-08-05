<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Verify Real Proof

* run focused tests and relevant broader tests for the touched code or behavior

* check `{{contract_preconditions}}` before running `{{proof_path}}`

* if reporting a missing infrastructure, service, target, provider, storage, media, browser, or runtime precondition
  * [Try Local Resource Path](#try-local-resource-path)

* if a precondition, resource, safe target, credential, hardware, network path, source truth, or authority is missing after the local resource path is absent, unsafe, or exhausted
  * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to the exact missing precondition
  * set `{{stop_reason}}` to `blocked`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* verify the candidate through the proof boundary required by `{{claim_scope}}`

* if `{{claim_scope}}` is `source-health`, `ci-repair`, `audit-completion`, or `blocker-note-completion`
  * supply the source, check, audit, tracker, or handoff proof for that narrow claim
  * record live, publication, merge, close, release, deployment, or launch proof as `{{proof_not_claimed}}` unless the delegation also requires it

* if `{{claim_scope}}` includes `live-proof`, `publication`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, `deployment-readiness`, launch, or final done
  * verify the final candidate through the real affected boundary with real local resources or the actual safe target

* if the work changes or claims a UI, frontend, dashboard, widget, or visible product surface
  * capture and inspect a current visual snapshot for each changed or claimed feature from the real browser or device target

* if the work is code that changes runtime behavior, services, APIs, workers, or external boundaries
  * verify OpenTelemetry (OTEL) instrumentation covers the changed control paths, failure paths, and external boundaries
  * verify cardinality was analyzed for every new or changed OTEL metric dimension, span attribute, resource attribute, log attribute, and event label
  * if OTEL telemetry is missing, uses only a non-OTEL custom telemetry stack, or is not exercised by the proof path
    * set `{{blocker}}` to `OTEL telemetry is non-negotiable; missing or unproven instrumentation on changed paths`
    * repair the instrumentation or proof path
    * [Verify Real Proof](#verify-real-proof)
  * if cardinality analysis is missing, incomplete, or leaves unbounded high-cardinality keys unbound
    * set `{{blocker}}` to `OTEL cardinality analysis is required; missing or incomplete analysis of label and attribute keys`
    * repair the instrumentation or record the cardinality analysis
    * [Verify Real Proof](#verify-real-proof)

* if `{{proof_path}}` is available but fails, is stale, exceeds a declared invariant such as CI budget, or does not match `{{contract_postconditions}}`
  * repair the proof path or implementation
  * [Verify Real Proof](#verify-real-proof)

* do not count mocked services, fake providers, offline fixtures, canned responses, stubs, or local scaffolds as done proof for behavior that depends on real resources

* use mocks or stubs only as development aids or explicitly non-final fallback evidence when no real local stack or actual safe target can satisfy the proof path

* label mocks or stubs under `{{proof_not_claimed}}` instead of final proof

* if credentials, hardware, network, authority, or a safe target blocks proof after the local resource path is absent, unsafe, or exhausted
  * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to the exact missing resource
  * set `{{stop_reason}}` to `blocked`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

## Try Local Resource Path

* inspect local instructions and repo setup surfaces such as `AGENTS.md`, `README*`, `Makefile`, `justfile`, `docker-compose*.yml`, `compose*.yml`, `package.json`, `pyproject.toml`, `scripts/*stack*`, `scripts/*local*`, `scripts/*preflight*`, `scripts/*dev*`, and project docs

* set `{{local_resource_path}}` to the local stack, bootstrap, preflight, dev server, compose profile, fixture target, or safe local resource path that can satisfy the precondition

* if `{{local_resource_path}}` is set and safe
  * stand up, reuse, or run that local path inside `{{granted_permissions}}`
  * [Verify Real Proof](#verify-real-proof)

* if the local path exists but was not attempted
  * continue verifying with that path
  * [Verify Real Proof](#verify-real-proof)

* if the local path proves healthy
  * use that artifact only for the scoped claim it actually proves
  * [Verify Real Proof](#verify-real-proof)

* if the local path is absent, unsafe, or fails because an external credential, hardware device, network route, provider, safe target, source truth, or authority is missing
  * set `{{missing_precondition}}` to that exact external blocker
  * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to `{{missing_precondition}}`
  * set `{{stop_reason}}` to `blocked`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
