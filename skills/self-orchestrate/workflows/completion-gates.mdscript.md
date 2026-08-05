<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Confirm Implementer Completion Gates

* do not perform code reviews from this orchestrator
* do not spawn blind reviewers from this orchestrator
* do not spawn a `self-review` skill worker or hand `/self-review` to a subagent
* the implementer owns review composition and per-lane blind fanout; this orchestrator only verifies the resulting sign-offs and acceptance report
* read the implementer stop report, review record, proof artifacts, and lane ledger for this lane
* set `{{claim_scope}}` from the implementer acceptance report when present
* if the implementer acceptance report is missing
  * set `{{blocker}}` to `missing implementer acceptance report`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Acceptance Report Fields](#verify-acceptance-report-fields)

## Verify Acceptance Report Fields

* verify the report names typed `{{claim_scope}}`
* verify the report names contract preconditions, postconditions, and invariants
* verify the report names proof path, proof supplied, and proof not claimed
* if any required field is missing
  * set `{{blocker}}` to the missing acceptance field name
  * [Reject Completion Gate](#reject-completion-gate)
* if resources are in scope and local resource path is missing from the report
  * set `{{blocker}}` to `missing local resource path in acceptance report`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Claim Scope Boundaries](#verify-claim-scope-boundaries)

## Verify Claim Scope Boundaries

* if `{{claim_scope}}` is `source-health`, `ci-repair`, `audit-completion`, or `blocker-note-completion`
  * accept that narrow scope as a valid completion gate when it matches the assigned claim
  * [Verify No Scope Laundering](#verify-no-scope-laundering)
* if merge or closure is the assigned claim
  * [Verify Disposition Ready Aggregate](#verify-disposition-ready-aggregate)
* do not require final live proof, publication, issue closure, merge, launch, release, or deployment proof for a narrower assigned claim
* [Verify Review Gate For Change Type](#verify-review-gate-for-change-type)

## Verify Disposition Ready Aggregate

* verify the MR/PR is on the current integration target
* verify exact-head CI is green
* verify one fresh current-target `Proven` review exists
* verify no unresolved discussions remain
* if any disposition precondition fails
  * set `{{blocker}}` to the failed disposition precondition
  * [Reject Completion Gate](#reject-completion-gate)
* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
* run [Handle Merge Or Close Decision](merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)
* if disposition is denied by root
  * record the root's explicit denial with the exact authority, policy, or proof reason
  * stop after recording the denial
* [Accept Completion Gate](#accept-completion-gate)

## Verify No Scope Laundering

* if the report treats a narrow proven verdict as merge readiness, issue-close readiness, launch readiness, release readiness, deployment readiness, live proof, or final done
  * set `{{blocker}}` to `scope laundering of narrow proven verdict`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Review Gate For Change Type](#verify-review-gate-for-change-type)

## Verify Review Gate For Change Type

* set `{{self_review_required}}` to `true` only when the lane is creating or updating a pull/merge request, or merge into the target branch is requested or in scope
* otherwise set `{{self_review_required}}` to `false`
* if `{{self_review_required}}` is `false`
  * accept `review_gate=not-required-until-pr-or-merge` as a passing review gate for non-PR completion
  * do not require multi-lane self-review sign-offs for local implementation-only completion
  * continue to the next completion check
* if `{{self_review_required}}` is `true`
  * if the change is MDScript-only, documentation-only, or instruction-only
  * [Verify Non Code Review Gate](#verify-non-code-review-gate)
* [Verify Code Review Gate](#verify-code-review-gate)

## Verify Code Review Gate

* verify the implementer owns focused tests, relevant broader tests, and real-resource artifact proof for the claimed scope
* verify the implementer owns self-review composition in-process and spawned per-lane blind reviewers (not a nested full `self-review` skill subagent)
* verify every selected lane had a fresh blind reviewer for the round with no lane-reviewer reuse across rounds
* verify every round-1 finding was fixed or disproven
* if the review is round 2
  * verify only P1 and P2 findings were fixed or disproven
* if the review is round 3 or later
  * verify only P1 findings were fixed or disproven
* verify below-threshold findings remain visible as residuals without another pass
* if any code review gate check fails
  * set `{{blocker}}` to the failed code review gate check
  * [Reject Completion Gate](#reject-completion-gate)
* if GitLab issue or MR review is in scope
  * [Verify GitLab Review Visibility](#verify-gitlab-review-visibility)
* [Verify Blocked Report Quality](#verify-blocked-report-quality)

## Verify Non Code Review Gate

* verify exactly one fresh review completed
* verify direct checks, render or pipeline, and served-route proof when publication is part of the claim
* if a recursive review loop was started for non-code work
  * set `{{blocker}}` to `recursive review loop used for non-code change`
  * [Reject Completion Gate](#reject-completion-gate)
* if the single fresh review or direct validation is missing
  * set `{{blocker}}` to `missing single-fresh non-code review or direct validation`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Blocked Report Quality](#verify-blocked-report-quality)

## Verify GitLab Review Visibility

* verify reviewer grade, findings, questions, answers, fix responses, evidence links, and resolution are visible in GitLab
* verify resolvable threads are resolved only after concerns are fixed, withdrawn, or accepted closed
* verify reviewer identities authored their own sanitized GitLab notes through `gitlab-sudo-alias` with `-reviewer` aliases when leased reviewer identities are available
* if any GitLab visibility check fails
  * set `{{blocker}}` to the failed GitLab review visibility check
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Blocked Report Quality](#verify-blocked-report-quality)

## Verify Blocked Report Quality

* if the report is not a blocked report
  * [Accept Completion Gate](#accept-completion-gate)
* verify `Blocked for {{claim_scope}}` names the exact missing precondition, resource, safe target, credential, hardware, network path, source truth, or authority
* if the blocker is missing infrastructure and the implementer skipped an available local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path
  * set `{{blocker}}` to `skipped available local resource path`
  * [Reject Completion Gate](#reject-completion-gate)
* if the report blends stale screenshots, unclear issue proof, failing CI invariants, CI budget overages, contract mismatches, Draft status, and live-resource blockers into one middle state
  * set `{{blocker}}` to `blended middle-state proof report`
  * [Reject Completion Gate](#reject-completion-gate)
* [Accept Completion Gate](#accept-completion-gate)

## Accept Completion Gate

* record the accepted `{{claim_scope}}`, proof supplied, proof not claimed, and residual risk in the lane ledger
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Reject Completion Gate

* record `{{blocker}}` and the failed gate in the lane ledger
* send the implementer the exact remediation jump for the failed gate when one exists
* if authority or judgment is required from the user or a repository owner
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state
* stop and report `Blocked for {{claim_scope}}: {{blocker}}` when no repair jump is available
