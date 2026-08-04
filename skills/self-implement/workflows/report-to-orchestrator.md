<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report To Orchestrator

* report count-first and evidence-first

* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Log Progress](../../self-common/workflows/mdscript-artifact.md#log-progress) with the final result: the contract, what changed, the proof path and its outcome, the residual risk, and the next executable step for whoever continues
* set the running log's front matter `status` to `done`, `blocked`, or `handed-off` to match `{{stop_reason}}`
* name `{{mdscript_artifact}}` and its `/mdscript-exec` re-entry in the report

* report to `{{parent_agent}}` or `{{parent_reporting_path}}` before this implementer stops for any reason

* add a parent-visible file comment before reporting through chat or an external tracker

* when stopping, include `{{stop_reason}}`, `{{event_exec}}` and `{{event_type}}` when applicable, next owner, next action, and any exact orchestrator continuation jump

* use `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`

* include objective, branch, issue/MR/PR, referenced tickets, agent identities for MR/PR comment watching, current head, target head, `{{event_exec}}`, `{{event_type}}`, `{{stop_reason}}`, `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, tests, `{{proof_supplied}}`, `{{proof_not_claimed}}`, real-resource proof when claimed, review grade state, goal MDScript state, remaining blocker, residual risk, and exact authority needed

* include any exact orchestrator continuation jump the orchestrator should execute, such as `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/mr-comment-watcher.md#create-mr-comment-watcher`, `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/handle-worker-exec-jump.md#handle-worker-exec-jump`, `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/monitor-implementer-lane.md#monitor-implementer-lane`, or `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision`

* if `{{event_exec}}` is set
  * execute that exact MDScript event jump before reporting or stopping
  * include `{{event_exec}}` and required response in the report
  * include the event response in the file comment

* if `{{event_type}}` is `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR` and `{{event_exec}}` is missing
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.md#handle-thread-event-contracts)
  * include the converted event execution and required response in the report
  * include the converted event execution in the file comment

* if `{{blocker}}` is set
  * [Report Blocked State](#report-blocked-state)

* if reporting a scoped proven state
  * [Report Proven State](#report-proven-state)

* do not claim done until the MR/PR is merged, explicitly closed by the authorized owner, or the orchestrator accepts the lane's terminal state in a file comment or equivalent external tracker record

## Report Blocked State

* if the blocker is missing infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or a safe target
  * include the local resource path attempted and why it cannot satisfy the precondition

* report `Blocked for {{claim_scope}}: {{blocker}}`

* before asking the user, a repository owner, or another authority surface for input
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this workflow and `{{return_resume_heading}}` set to `report-to-orchestrator`

* ask the smallest decision-ready question and bind the answer to `{{authority_decision}}`
  * resume at [Report To Orchestrator](#report-to-orchestrator)

## Report Proven State

* state what scoped claim is proven, what proof path passed, what proof is not claimed, what goal remains active or terminal, and what exact merge, close, release, deploy, launch, or live-proof authority remains

* do not present `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` as final readiness, merge readiness, issue-close readiness, launch readiness, release readiness, deployment readiness, or live proof
