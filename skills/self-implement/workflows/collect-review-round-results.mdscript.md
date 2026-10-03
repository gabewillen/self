<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Collect Review Round Results

* collect the severity-ranked findings, scoped grade, questions, and requested evidence of each reviewer
* collect the implementer remediation jump of each reviewer, if the reviewer gives one

* put each current finding that matches `{{blocking_severities}}` into `{{blocking_findings}}`
* put each current finding below the current threshold into `{{residual_findings}}`

* record `{{residual_findings}}`
* do not carry `{{residual_findings}}` into a different review round

* tell each reviewer to write or return a verdict that is ready for a file comment
* make sure that each verdict has `task_id`, `role: reviewer`, `proof_decision`, `claim_scope`, evidence, questions, and a stop report

* answer reviewer questions only to make the findings, evidence, or grade of that reviewer clear

* if you do not explicitly reconcile a visible disagreement after the first blind verdicts
  * do not give the findings of one reviewer to a different reviewer

* tell each reviewer to hand off a final scoped grade before cleanup

* tell each reviewer to put `{{stop_reason}}` in the handoff
* make sure that this implementer can see each reviewer handoff before that reviewer stops

* if a reviewer gives an exact `/mdscript-exec {{skills_root}}/self-implement/` remediation jump
  * make sure that the jump targets this skill or an implementer workflow file
  * make sure that the jump fits `{{granted_permissions}}`
  * record it as `{{review_remediation_jump}}`

* run [Require GitLab Review Visibility](review-gitlab-visibility.mdscript.md#require-gitlab-review-visibility)

* before you count the review gate, make sure that the reviewer grade has a related file comment

* if the reviewer grade file comment is absent
  * set `{{blocker}}` to the reviewer grade file comment that is absent
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* if `{{review_cycle}}` is `recursive-code`
  * run [Record Completed Review Snapshot](../../self-review/workflows/rolling-code-review.mdscript.md#record-completed-review-snapshot)

* run [Close Review Subagents](recursive-blind-review-loop.mdscript.md#close-review-subagents)
