<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Collect Review Round Results

* collect each reviewer's severity-ranked findings, scoped grade, questions, requested evidence, and any implementer remediation jump

* partition current findings into `{{blocking_findings}}` matching `{{blocking_severities}}` and `{{residual_findings}}` below the current threshold

* record `{{residual_findings}}` without carrying them into another review round

* require each reviewer to write or return a file-comment-ready verdict with `task_id`, `role: reviewer`, `proof_decision`, `claim_scope`, evidence, questions, and stop report

* answer reviewer questions only to clarify that reviewer's own findings, evidence, or grade

* do not give one reviewer another reviewer's findings unless explicitly reconciling visible disagreement after the initial blind verdicts

* require every reviewer to hand off a final scoped grade before cleanup

* require every reviewer handoff to include `{{stop_reason}}` and to be visible to this implementer before the reviewer stops

* if a reviewer includes an exact `/mdscript-exec {{repo_root}}/skills/gabe-implement/` remediation jump
  * verify the jump targets this skill or an implementer workflow file and fits `{{granted_permissions}}`
  * record it as `{{review_remediation_jump}}`

* run [Require GitLab Review Visibility](review-gitlab-visibility.md#require-gitlab-review-visibility)

* confirm the reviewer grade has a corresponding file comment before counting the review gate

* if the reviewer grade file comment is missing
  * set `{{blocker}}` to the missing reviewer grade file comment
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* if `{{review_cycle}}` is `recursive-code`
  * run [Record Completed Review Snapshot](../../gabe-review/workflows/rolling-code-review.md#record-completed-review-snapshot)

* run [Close Review Subagents](recursive-blind-review-loop.md#close-review-subagents)
