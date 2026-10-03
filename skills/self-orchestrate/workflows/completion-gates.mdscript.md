<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Confirm Implementer Completion Gates

* do not do code reviews from this orchestrator
* do not spawn blind reviewers from this orchestrator
* do not spawn a `self-review` skill worker
* do not give `/self-review` to a subagent
* let the implementer own the review composition and the per-lane blind fanout
* in this orchestrator, only examine the sign-offs and the acceptance report that the implementer review gives
* read the implementer stop report, review record, proof artifacts, and lane ledger for this lane
* if the implementer acceptance report exists
  * set `{{claim_scope}}` from the implementer acceptance report
* if the implementer acceptance report is missing
  * set `{{blocker}}` to `missing implementer acceptance report`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Acceptance Report Fields](#verify-acceptance-report-fields)

## Verify Acceptance Report Fields

* make sure that the report names the typed `{{claim_scope}}`
* make sure that the report names the contract preconditions, postconditions, and invariants
* make sure that the report names the proof path, the `proof_supplied` value, and the `proof_not_claimed` value
* if a necessary field is missing
  * set `{{blocker}}` to the missing acceptance field name
  * [Reject Completion Gate](#reject-completion-gate)
* if resources are in scope and the report has no local resource path
  * set `{{blocker}}` to `missing local resource path in acceptance report`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Claim Scope Boundaries](#verify-claim-scope-boundaries)

## Verify Claim Scope Boundaries

* if `{{claim_scope}}` is `source-health`, `ci-repair`, `audit-completion`, or `blocker-note-completion`
  * if that narrow scope matches the assigned claim
    * accept it as a valid completion gate
  * [Verify No Scope Laundering](#verify-no-scope-laundering)
* if merge or closure is the assigned claim
  * [Verify Disposition Ready Aggregate](#verify-disposition-ready-aggregate)
* for a narrower assigned claim, do not ask for final live proof, publication, or issue closure
* for a narrower assigned claim, do not ask for merge, launch, release, or deployment proof
* [Verify Review Gate For Change Type](#verify-review-gate-for-change-type)

## Verify Disposition Ready Aggregate

* make sure that the MR/PR is on the current integration target
* make sure that the exact-head CI is green
* make sure that one fresh current-target `Proven` review exists
* make sure that no unresolved discussions remain
* if a disposition precondition fails
  * set `{{blocker}}` to the failed disposition precondition
  * [Reject Completion Gate](#reject-completion-gate)
* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
* run [Handle Merge Or Close Decision](merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)
* if the root denies disposition
  * record the explicit denial of the root with the exact authority, policy, or proof reason
  * after you record the denial, stop
* [Accept Completion Gate](#accept-completion-gate)

## Verify No Scope Laundering

* if the report treats a narrow proven verdict as merge, issue-close, launch, release, or deployment readiness
  * set `{{blocker}}` to `scope laundering of narrow proven verdict`
  * [Reject Completion Gate](#reject-completion-gate)
* if the report treats a narrow proven verdict as live proof or final done
  * set `{{blocker}}` to `scope laundering of narrow proven verdict`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Review Gate For Change Type](#verify-review-gate-for-change-type)

## Verify Review Gate For Change Type

* if the lane creates or changes a pull/merge request
  * set `{{self_review_required}}` to `true`
* if someone requested a merge into the target branch, or the merge is in scope
  * set `{{self_review_required}}` to `true`
* if neither condition applies
  * set `{{self_review_required}}` to `false`
* if `{{self_review_required}}` is `false`
  * accept `review_gate=not-required-until-pr-or-merge` as a valid review gate for non-PR completion
  * for local implementation-only completion, do not ask for multi-lane self-review sign-offs
  * continue to the next completion check
* if `{{self_review_required}}` is `true`
  * if the change is MDScript-only, documentation-only, or instruction-only
  * [Verify Non Code Review Gate](#verify-non-code-review-gate)
* [Verify Code Review Gate](#verify-code-review-gate)

## Verify Code Review Gate

* make sure that the implementer owns focused tests, relevant broader tests, and real-resource artifact proof for the claimed scope
* make sure that the implementer owns the self-review composition in its process
* make sure that the implementer spawned per-lane blind reviewers, not a nested full `self-review` skill subagent
* make sure that each selected lane had a fresh blind reviewer for the round
* make sure that no round used a lane reviewer from an earlier round
* make sure that the implementer fixed or disproved each round-1 finding
* if the review is round 2
  * make sure that the implementer fixed or disproved only the P1 and P2 findings
* if the review is round 3 or later
  * make sure that the implementer fixed or disproved only the P1 findings
* make sure that below-threshold findings stay visible as residuals without another pass
* if a code review gate check fails
  * set `{{blocker}}` to the failed code review gate check
  * [Reject Completion Gate](#reject-completion-gate)
* if GitLab issue or MR review is in scope
  * [Verify GitLab Review Visibility](#verify-gitlab-review-visibility)
* [Verify Blocked Report Quality](#verify-blocked-report-quality)

## Verify Non Code Review Gate

* make sure that exactly one fresh review completed
* if publication is part of the claim
  * make sure that the direct checks, the render or pipeline proof, and the served-route proof exist
* if a recursive review loop started for non-code work
  * set `{{blocker}}` to `recursive review loop used for non-code change`
  * [Reject Completion Gate](#reject-completion-gate)
* if the single fresh review or the direct validation is missing
  * set `{{blocker}}` to `missing single-fresh non-code review or direct validation`
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Blocked Report Quality](#verify-blocked-report-quality)

## Verify GitLab Review Visibility

* make sure that the reviewer grade, findings, questions, answers, fix responses, evidence links, and resolution are visible in GitLab
* make sure that each resolvable thread was resolved only after its concern was fixed, withdrawn, or accepted closed
* if leased reviewer identities are available
  * make sure that the reviewer identities wrote their own sanitized GitLab notes through `gitlab-sudo-alias` with `-reviewer` aliases
* if a GitLab visibility check fails
  * set `{{blocker}}` to the failed GitLab review visibility check
  * [Reject Completion Gate](#reject-completion-gate)
* [Verify Blocked Report Quality](#verify-blocked-report-quality)

## Verify Blocked Report Quality

* if the report is not a blocked report
  * [Accept Completion Gate](#accept-completion-gate)
* make sure that `Blocked for {{claim_scope}}` names the exact missing precondition, resource, safe target, credential, hardware, network path, source truth, or authority
* if the blocker is missing infrastructure
  * if the implementer skipped an available local stack, bootstrap, preflight, dev server, fixture target, or compose profile
    * set `{{blocker}}` to `skipped available local resource path`
    * [Reject Completion Gate](#reject-completion-gate)
  * if the implementer skipped a different safe local resource path that was available
    * set `{{blocker}}` to `skipped available local resource path`
    * [Reject Completion Gate](#reject-completion-gate)
* count stale screenshots, unclear issue proof, failed CI invariants, CI budget overages, and contract mismatches as blocker types
* count Draft status and live-resource blockers as blocker types
* if the report blends these blocker types into one middle state
  * set `{{blocker}}` to `blended middle-state proof report`
  * [Reject Completion Gate](#reject-completion-gate)
* [Accept Completion Gate](#accept-completion-gate)

## Accept Completion Gate

* record the accepted `{{claim_scope}}`, the `proof_supplied` value, the `proof_not_claimed` value, and the residual risk in the lane ledger
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Reject Completion Gate

* record `{{blocker}}` and the failed gate in the lane ledger
* if a remediation jump exists for the failed gate
  * send the implementer the exact remediation jump
* if the user or a repository owner must give authority or judgment
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the stop-boundary state of the caller
* if no repair jump is available
  * report `Blocked for {{claim_scope}}: {{blocker}}`
  * stop
