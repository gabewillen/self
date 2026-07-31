# Evidence boundary policy

Hold these rules while checking proof scope and Design by Contract decisions.

## Required contract fields (PR/MR)

- `{{contract_preconditions}}`
- `{{contract_postconditions}}`
- `{{contract_invariants}}`
- `{{proof_path}}`

When any precondition depends on infrastructure, services, providers, targets, hardware, network, storage, media, browser, or runtime resources, also require `{{local_resource_path}}`: the repo-local stack, bootstrap, preflight, dev server, compose profile, fixture target, or safe local resource path that can satisfy or falsify the precondition.

## Terminal proof decisions

| Decision | When |
| --- | --- |
| `Proven for {{proof_scope}}` | Every precondition available, every invariant held, proof path passed with current evidence |
| `Blocked for {{proof_scope}}` | Named precondition, resource, safe target, credential, hardware, network path, or authority missing after any available local resource path checked or exhausted |
| `Not ready for {{proof_scope}}` | Repairable proof failures while preconditions are available (stale screenshots, missing browser artifacts, unclear issue proof, contract/type mismatch, failing CI invariant, evidence mismatch) |

## Do not mislabel

- Do not call a proof path `Blocked` when it failed, went stale, is incomplete, or mismatches the stated contract.
- Do not call a proof path `Blocked` for missing infrastructure when the repository already provides a local stack, bootstrap, preflight, dev server, fixture target, compose file, or safe local resource path.
- Local resource path success is setup or resource proof for the named scope only; it does not imply publishability, production, live-provider, merge, close, launch, release, deployment, or final readiness unless that broader path is also named and passed.

## Typed proof scopes

| Scope | Means |
| --- | --- |
| `source-health` | source diff, contracts, lint, type checks, unit or focused integration checks, static audits, reviewability of the source slice |
| `ci-repair` | the failing check or pipeline condition and the rerun evidence for that repair |
| `audit-completion` | the audit finding, source or documentation correction, and evidence that the finding is closed |
| `blocker-note-completion` | tracker, issue, MR/PR, or handoff note accurately recording a blocker and next owner |
| `publication` | rendered artifact, pipeline, generated listing, redirect, and served-route proof for public documentation claims |
| `live-proof` | real affected system, provider, device, UI, service, telemetry, call/audio, or safe target proof |
| `merge-readiness`, `issue-close-readiness`, `release-readiness`, `deployment-readiness` | aggregate scopes requiring every narrower proof, review, watcher, authority, and target-state gate named by the done state |

## Scope inflation and deflation

- Vague `ready` claims: infer the narrowest `{{proof_scope}}` actually supported; require `Proven for {{proof_scope}} only` when broader final proof remains.
- Do not block a valid narrower claim because final live, launch, publication, close, release, or deployment proof is missing outside `{{proof_scope}}`.
- Do not let narrower proof satisfy a broader claim; source-health never implies live proof, issue closure, merge readiness, launch, release, deployment, or final done.
- Reject green CI, route checks, stale screenshots, unclear issue proof, Draft status, live-resource blockers, traces, transcripts, benchmarks, or browser artifacts when blended into one mushy readiness state instead of mapped to exact proof scope and DBC decision.
- Treat a CI budget or test invariant failure as a source-health proof-path failure, not as live proof and not as a missing live-resource blocker.

## Real-resource and mock rules

When `{{proof_scope}}` includes `live-proof` or any final-readiness aggregate, require proof from the real affected system: screenshots, UI snapshots, traces, metrics, logs, rendered routes, real service responses, call/audio artifacts, or comparable durable outputs.

Mocks, fake providers, offline fixtures, canned responses, stubs, or local scaffolds are never final proof when a real local stack or actual safe target can be used. They are development aids or explicitly non-final fallback evidence only.
