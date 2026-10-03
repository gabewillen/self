<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Decide Review Loop

* if `{{review_cycle}}` is `single-non-code` and the lane aggregate returned a real issue or `Not ready for {{claim_scope}}`
  * [Repair Single Non Code Findings](#repair-single-non-code-findings)

* if `{{review_cycle}}` is `single-non-code` and the lane aggregate found no blocking issue
  * set `{{review_gate}}` to `Proven for {{claim_scope}}`
  * run [Prepare MR Or PR](prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)

* if `{{review_cycle}}` is `recursive-code` and `{{blocking_findings}}` is not empty
  * set `{{review_phase}}` to `repair`
  * [Repair Blocking Findings](#repair-blocking-findings)

* if `{{review_cycle}}` is `recursive-code`, every lane reviewer is closed or deleted, and `{{blocking_findings}}` is empty
  * [Require Final Cumulative Proven](#require-final-cumulative-proven)

* if the aggregate grade is non-proven and names an absent precondition, resource, access, authority, safe target, or source truth
  * set `{{review_gate}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to the exact review prerequisite that is absent
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

## Repair Single Non Code Findings

* fix or reconcile each real issue that the single non-code review returned

* rerun the direct validation, render, pipeline, route, or black-box proof that `{{claim_scope}}` must have

* if the necessary direct proof fails after the repair
  * set `{{blocker}}` to the failed direct proof
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* set `{{review_gate}}` to `single fresh review completed; findings repaired with direct proof`

* run [Prepare MR Or PR](prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)

## Repair Blocking Findings

* fix or reconcile every finding in `{{blocking_findings}}`

* if `{{review_remediation_jump}}` is set and does not fit `{{granted_permissions}}`
  * set `{{blocker}}` to the unauthorized remediation jump
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* if `{{review_remediation_jump}}` is set and fits `{{granted_permissions}}`
  * continue from that MDScript heading as the next implementer action
  * stop this decide path until that jump goes back into [Start Review Round](recursive-blind-review-loop.mdscript.md#start-review-round)

* refresh tests for the repaired change

* refresh proof artifacts for `{{claim_scope}}`

* refresh the neutral review packet evidence

* run [Start Review Round](recursive-blind-review-loop.mdscript.md#start-review-round)

## Require Final Cumulative Proven

* run [Require Final Cumulative Review](../../self-review/workflows/rolling-code-review.mdscript.md#require-final-cumulative-review)

* if `{{final_cumulative_review}}` is not `proven`
  * run [Start Review Round](recursive-blind-review-loop.mdscript.md#start-review-round)

* set `{{review_gate}}` to `Proven for {{claim_scope}}`

* run [Prepare MR Or PR](prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)
