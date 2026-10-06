<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Multi-Lane Review

* if `{{self_review_required}}` is empty, run [Decide Self Review](../../self-common/workflows/self-review-consent.mdscript.md#decide-self-review)
* if `{{self_review_required}}` is `false`, do not spawn reviewers, and return to the caller
* compose the review in this process, and spawn only one blind subagent for each lane, never the full `/self-review`
* set `{{merge_target}}` from the PR base, the MR target, or the default branch, or `main`
* run [Resolve Review Baseline](../../self-review/workflows/rolling-code-review.mdscript.md#resolve-review-baseline)
* if the changed paths in `{{review_diff}}` include code, set `{{review_cycle}}` to `recursive-code`
* otherwise set `{{review_cycle}}` to `single-non-code`
* run [Sync File Task Proof State](../../self-common/workflows/file-task-comments.mdscript.md#sync-file-task-proof-state)
* write the neutral packet:
  * the review object, the claim scope, the contract, and the proof path
  * `{{proof_supplied}}`, `{{proof_not_claimed}}`, the blockers, the task, and the open comments
  * do not frame it with a preferred verdict, a narrative, or another reviewer's findings
* [Start Review Round](#start-review-round)

## Start Review Round

* add `1` to `{{review_round}}`
* set `{{blocking_severities}}`: round 1 or non-code `all findings`, round 2 `P1,P2`, round 3 and later `P1`
* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `reviewer`
* close each lane reviewer from an earlier round
  * if you cannot, set `{{stop_reason}}` to `tool-failed`, and run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* run [Select Review Lanes](../../self-review/workflows/select-review-lanes.mdscript.md#select-review-lanes)
* set `{{review_signoff_dir}}` to the review directory under `{{run_dir}}` for a goal run, or under the project home
* for each lane, run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path) with `{{artifact_reserve_only}}` set to `true`
  * set `{{lane_signoff_paths}}.<lane>` to the minted path
* add a parent-visible `review_round=start` comment with the round, lanes, reasons, and packet
* if subagent tools exist
  * spawn every lane in one turn as a readonly subagent that runs only `mdscript-exec <lane entry>`, with the selected model
  * give each lane only the packet, the authorized paths, the claim scope, `{{blocking_severities}}`, `{{review_round}}`, and its own `{{signoff_path}}`
  * tell each lane not to read other lanes before it writes its sign-off, and not to spawn subagents
  * never use a reviewer from an earlier round again
* if no subagent tools exist, in a project control-plane workflow only
  * create one reviewer file task for each lane, and run each lane MDScript in this process
  * do not claim public merge readiness from this fallback
* [Collect Review Round Results](#collect-review-round-results)

## Collect Review Round Results

* read each lane sign-off, and reject a sign-off from a different round
* run [Aggregate Triple Signoffs](../../self-review/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs) in this process
* set `{{blocking_findings}}` to the findings at `{{blocking_severities}}`, and `{{residual_findings}}` to the rest
* keep residuals visible, and do not carry them into the next round as blocking
* record a remediation jump from a lane only if it targets self-implement and fits `{{granted_permissions}}`
* make each grade, finding, question, answer, and fix visible in file comments
* for a GitLab issue or MR, make them visible there too
  * reviewers write through `-reviewer` aliases, and you write through the `-implementor` alias
  * resolve a thread only after a fix, a withdrawal, or an accepted close
* for `recursive-code`, run [Record Completed Review Snapshot](../../self-review/workflows/rolling-code-review.mdscript.md#record-completed-review-snapshot)
* [Close Review Subagents](#close-review-subagents)

## Close Review Subagents

* make sure that each lane wrote its sign-off, then close it
* if a lane did not, or a close fails, set `{{blocker}}` to it, and run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* add a comment with `cleanup_status` for each exact reviewer id
* do not start a repair or a new round while a reviewer of this round is open
* [Decide Review Loop](#decide-review-loop)

## Decide Review Loop

* if the aggregate names a missing precondition, resource, authority, or source truth
  * set `{{review_gate}}` to `Blocked for {{claim_scope}}`, and run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* if `{{review_cycle}}` is `single-non-code`
  * fix each real issue, and run the direct validation again
  * do not start another review round
  * set `{{review_gate}}`, and run [Prepare MR Or PR](prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)
* if `{{blocking_findings}}` is not empty
  * fix or disprove each one, or follow the recorded remediation jump
  * run the tests and the proof again, then [Start Review Round](#start-review-round)
* run [Require Final Cumulative Review](../../self-review/workflows/rolling-code-review.mdscript.md#require-final-cumulative-review)
  * if it is not `proven`, [Start Review Round](#start-review-round)
* set `{{review_gate}}` to `Proven for {{claim_scope}}`
* run [Prepare MR Or PR](prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)
