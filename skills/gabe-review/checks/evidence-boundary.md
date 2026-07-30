<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Check Evidence Boundary

* name the exact claim, typed `{{proof_scope}}`, and exact proof

* require Design by Contract fields for every PR/MR proof decision: `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, and `{{proof_path}}`

* when any precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources, require `{{local_resource_path}}`: the repo-local stack, bootstrap, preflight, dev server, compose profile, fixture target, or safe local resource path that can satisfy or falsify the precondition

* decide the proof path into one of two terminal states:
  * `Proven for {{proof_scope}}`: every precondition was available, every invariant held, and the proof path passed with current evidence
  * `Blocked for {{proof_scope}}`: a named precondition, resource, safe target, credential, hardware, network path, or authority is missing after any available local resource path has been checked or exhausted, so the proof path cannot be run

* use `Not ready for {{proof_scope}}` only for repairable proof failures when preconditions are available, such as stale screenshots, missing browser artifacts, unclear issue proof, contract/type mismatch, a failing CI invariant, or evidence that does not match the stated contract

* do not call a proof path `Blocked` when it actually failed, went stale, is incomplete, or mismatches the stated contract

* do not call a proof path `Blocked` for missing infrastructure when the repository already provides a local stack, bootstrap script, preflight command, dev server, fixture target, compose file, or safe local resource path that can satisfy the precondition

* if the author skipped an available local resource path
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * add a finding requiring the implementer to run or rule out that local path before claiming blocked proof

* if the local resource path passes
  * treat it as setup or resource proof for the named scope only
  * do not let healthy local infrastructure imply publishability, production, live-provider, merge, close, launch, release, deployment, or final readiness unless that broader proof path is also named and passed

* if the local resource path is absent, unsafe, or fails because a credential, provider, hardware device, network route, external safe target, or authority is genuinely unavailable
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
  * set `{{blocker}}` to the exact external precondition that prevents local proof

* use typed proof scopes:
  * `source-health`: source diff, contracts, lint, type checks, unit or focused integration checks, static audits, and reviewability of the source slice
  * `ci-repair`: the failing check or pipeline condition and the rerun evidence for that repair
  * `audit-completion`: the audit finding, source or documentation correction, and evidence that the finding is closed
  * `blocker-note-completion`: the tracker, issue, MR/PR, or handoff note accurately recording a blocker and next owner
  * `publication`: rendered artifact, pipeline, generated listing, redirect, and served-route proof for public documentation or blog claims
  * `live-proof`: real affected system, provider, device, UI, service, telemetry, call/audio, or safe target proof
  * `merge-readiness`, `issue-close-readiness`, `release-readiness`, and `deployment-readiness`: aggregate scopes that require every narrower proof, review, watcher, authority, and target-state gate named by the done state

* if the author gives a vague `ready` claim
  * infer the narrowest `{{proof_scope}}` actually supported by the supplied proof
  * require the verdict to say `Proven for {{proof_scope}} only` when broader final proof remains

* do not block a valid narrower claim because final live, launch, publication, close, release, or deployment proof is missing outside `{{proof_scope}}`

* do not let narrower proof satisfy a broader claim; source-health proof never implies live proof, issue closure, merge readiness, launch readiness, release readiness, deployment readiness, or final done

* reject green CI, route checks, stale screenshots, unclear issue proof, Draft status, live-resource blockers, traces, transcripts, benchmarks, or browser artifacts when they are blended into one mushy readiness state instead of mapped to the exact proof scope and DBC decision

* treat a CI budget or test invariant failure as a source-health proof-path failure, not as live proof and not as a missing live-resource blocker

* when `{{proof_scope}}` includes `live-proof` or any final-readiness aggregate, require proof from the real affected system: screenshots, UI snapshots, traces, metrics, logs, rendered routes, real service responses, call/audio artifacts, or comparable durable outputs

* if mocked services, fake providers, offline fixtures, canned responses, stubs, or local scaffolds are final proof for behavior that depends on real resources
  * if the real resource can be stood up locally
    * set `{{grade}}` to `Not ready for {{proof_scope}}`
    * add a finding requiring real-resource proof
  * if the real resource cannot be accessed without outside help
    * set `{{grade}}` to `Blocked for {{proof_scope}}`
    * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing real resource`
    * set `{{blocker}}` to the exact missing resource, target, access, or authority

* treat mocks and stubs as development aids or explicitly non-final fallback evidence only; they are never final proof when a real local stack or actual safe target can be used

## Check UI And Product Surface

* if the artifact changes or claims a UI, frontend, dashboard, widget, or other user-visible product surface
  * require a current visual snapshot from the real browser or device target for each changed or claimed feature

* inspect each snapshot and connect it to the feature claim

* reject a single broad screenshot, DOM-only assertion, unique-selector test, uninspected snapshot, stale snapshot, or mock-backed route as per-feature UI proof

* treat every visible button, table, graph, widget, workflow, empty state, breakpoint, CLI command, and target selector as a claim
