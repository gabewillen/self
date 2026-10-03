<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Verify Real Proof

* run the focused tests and the related broader tests for the changed code or behavior

* before you run `{{proof_path}}`, check `{{contract_preconditions}}`

* if you will report an absent infrastructure, service, target, provider, storage, media, browser, or runtime precondition
  * [Try Local Resource Path](#try-local-resource-path)

* if the local resource path is absent or unsafe, or you tried all of its options
  * if a precondition, resource, safe target, credential, hardware, network path, source truth, or authority is still absent
    * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
    * set `{{blocker}}` to the exact precondition that is absent
    * set `{{stop_reason}}` to `blocked`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* examine the candidate through the proof boundary that `{{claim_scope}}` must have

* if `{{claim_scope}}` is `source-health`, `ci-repair`, `audit-completion`, or `blocker-note-completion`
  * give the source, check, audit, tracker, or handoff proof for that narrow claim
  * if the delegation does not also ask for live, publication, merge, close, release, deployment, or launch proof
    * record that proof as `{{proof_not_claimed}}`

* if `{{claim_scope}}` includes `live-proof`, `publication`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, `deployment-readiness`, launch, or final done
  * examine the final candidate through the real affected boundary with real local resources or the actual safe target

* if the work changes or claims a UI, frontend, dashboard, widget, or visible product surface
  * capture a current visual snapshot for each changed or claimed feature from the real browser or device target
  * inspect each snapshot

* if the work is code that changes runtime behavior, services, APIs, workers, or external boundaries
  * make sure that OpenTelemetry (OTEL) instrumentation covers the changed control paths, failure paths, and external boundaries
  * make sure a cardinality analysis exists for each new or changed OTEL metric dimension, span attribute, and resource attribute
  * make sure a cardinality analysis exists for each new or changed OTEL log attribute and event label
  * if the OTEL telemetry is absent, uses only a non-OTEL custom stack, or does not run in the proof path
    * set `{{blocker}}` to `OTEL telemetry is non-negotiable; missing or unproven instrumentation on changed paths`
    * repair the instrumentation or proof path
    * [Verify Real Proof](#verify-real-proof)
  * if the cardinality analysis is absent or incomplete, or leaves unbounded high-cardinality keys unbound
    * set `{{blocker}}` to `OTEL cardinality analysis is required; missing or incomplete analysis of label and attribute keys`
    * repair the instrumentation or record the cardinality analysis
    * [Verify Real Proof](#verify-real-proof)

* if the work replaced, renamed, or migrated pre-1.0 code that is not in a production or user-facing environment
  * search the diff and the repository for the replaced symbols, files, flags, and documentation
  * make sure that the old path is gone
  * if a deprecated shim, compatibility alias, legacy fallback, version-suffixed duplicate, gating flag, or unreferenced file remains
    * if no named released or deployed consumer depends on that item
      * set `{{blocker}}` to `pre-1.0 and undeployed code requires a hard cutover; deprecated or unused legacy code survives the change`
      * delete the legacy path that remains
      * [Verify Real Proof](#verify-real-proof)

* if `{{proof_path}}` is available but fails, is stale, or does not match `{{contract_postconditions}}`
  * repair the proof path or implementation
  * [Verify Real Proof](#verify-real-proof)
* if `{{proof_path}}` goes above a declared invariant, for example the CI budget
  * repair the proof path or implementation
  * [Verify Real Proof](#verify-real-proof)

* if a behavior depends on real resources
  * do not count mocked services, fake providers, offline fixtures, canned responses, stubs, or local scaffolds as done proof for it

* use mocks or stubs only as development aids
* if no real local stack or actual safe target can satisfy the proof path
  * you can also use mocks or stubs as explicitly non-final fallback evidence

* label mocks or stubs under `{{proof_not_claimed}}`, not as final proof

* if the local resource path is absent or unsafe, or you tried all of its options
  * if credentials, hardware, network, authority, or a safe target blocks the proof
    * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
    * set `{{blocker}}` to the exact resource that is absent
    * set `{{stop_reason}}` to `blocked`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

## Try Local Resource Path

* inspect the local instructions and project docs
* inspect repo setup surfaces such as `AGENTS.md`, `README*`, `Makefile`, `justfile`, `docker-compose*.yml`, `compose*.yml`, `package.json`, `pyproject.toml`, `scripts/*stack*`, `scripts/*local*`, `scripts/*preflight*`, and `scripts/*dev*`

* set `{{local_resource_path}}` to a local path that can satisfy the precondition, for example:
  * the local stack, bootstrap, preflight, or dev server
  * a compose profile, a fixture target, or a different safe local resource path

* if `{{local_resource_path}}` is set and safe
  * stand up, reuse, or run that local path inside `{{granted_permissions}}`
  * [Verify Real Proof](#verify-real-proof)

* if the local path exists but you did not try it
  * continue the proof with that path
  * [Verify Real Proof](#verify-real-proof)

* if the local path proves healthy
  * use that artifact only for the scoped claim that it actually proves
  * [Verify Real Proof](#verify-real-proof)

* if the local path is absent or unsafe, or it fails because an external item is absent
  * set `{{missing_precondition}}` to that exact external blocker (a credential, hardware device, network route, provider, safe target, source truth, or authority)
  * set `{{proof_decision}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to `{{missing_precondition}}`
  * set `{{stop_reason}}` to `blocked`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
