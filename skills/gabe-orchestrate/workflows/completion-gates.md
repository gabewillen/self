<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Confirm Implementer Completion Gates

* do not perform code reviews from this orchestrator

* do not spawn blind reviewers or `gabe-review` workers from this orchestrator

* for code work, require the implementer to own focused tests, relevant broader tests, real-resource artifact proof, and the recursive single-reviewer blind-review gate using `gabe-review`

* require every implementer or reviewer acceptance report to name the typed `{{claim_scope}}`, preconditions, postconditions, invariants, proof path, local resource path when resources are involved, proof supplied, and proof not claimed

* accept `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` as valid narrow completion gates when that is the assigned claim

* when merge or closure is the assigned claim, treat current-target exact-head CI green plus one fresh current-target `Proven` review plus no unresolved discussions as `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`; start disposition or record the root's explicit denial

* do not require final live proof, publication proof, issue closure, merge, launch, release, or deployment proof to accept a narrower scoped gate unless the delegation included that broader scope

* do not treat a narrower proven verdict as merge readiness, issue-close readiness, launch readiness, release readiness, deployment readiness, live proof, or final done

* require `Blocked for {{claim_scope}}` to name the exact missing precondition, resource, safe target, credential, hardware, network path, source truth, or authority after the local resource path is absent, unsafe, or exhausted

* reject missing-infrastructure blockers when the implementer skipped an available local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path

* reject stale screenshots, unclear issue proof, failing CI invariants, CI budget overages, contract/type mismatches, Draft status, and live-resource blockers as a blended middle state; route each one to the matching proof scope as proven, blocked, or repair-required

* require the implementer to use one fresh blind reviewer per round and avoid reviewer reuse across rounds

* require every round-1 finding to be fixed or disproven, only P1 and P2 findings to be fixed or disproven in round 2, and only P1 findings to be fixed or disproven in round 3 and later

* require below-threshold findings to remain visible as residuals without triggering another pass

* when GitLab issue or MR review is in scope
  * require the implementer to make the reviewer grade, findings, questions, answers, fix responses, evidence links, and resolution visible in GitLab before counting the review gate
  * require resolvable threads to be resolved only after concerns are fixed, withdrawn, or accepted closed
  * require reviewer identities to author their own sanitized GitLab notes through `gitlab-sudo-alias` with `-reviewer` aliases when leased reviewer identities are available

* for MDScript-only, blog-only, documentation-only, and instruction-only changes
  * require exactly one fresh review and direct checks, render or pipeline, and served-route proof when publication is part of the claim
  * do not require or start a recursive review loop
