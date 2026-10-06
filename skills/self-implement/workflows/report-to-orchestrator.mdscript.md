<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report To Orchestrator

* report count-first and evidence-first

* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)

* set the final result to the contract, what changed, the proof path and its outcome, and the residual risk
* add each item that you skipped as `skipped: <item>, add when <trigger>`, and each `ponytail:` comment that you added
* add the next executable step for the next owner to the final result
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the final result
* set the running log's front matter `status` to `done`, `blocked`, or `handed-off` to match `{{stop_reason}}`
* name `{{mdscript_artifact}}` and its `/mdscript-exec` re-entry in the report

* before this implementer stops for any reason, report to `{{parent_agent}}` or `{{parent_reporting_path}}`

* before you report through chat or an external tracker, add a parent-visible file comment

* if you stop
  * include `{{stop_reason}}`, the next owner, the next action, and each exact orchestrator continuation jump
  * if `{{event_exec}}` and `{{event_type}}` apply, include them

* use `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`

* include these items in the report:
  * the objective, branch, issue/MR/PR, referenced tickets, and agent identities for the MR/PR comment watch
  * the current head, target head, `{{event_exec}}`, `{{event_type}}`, `{{stop_reason}}`, `{{claim_scope}}`, and `{{proof_claim}}`
  * `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, and the tests
  * `{{proof_supplied}}`, `{{proof_not_claimed}}`, and the real-resource proof, if you claim it
  * the review grade state, goal MDScript state, open blocker, residual risk, and exact authority that you need

* include each exact continuation jump that the orchestrator must execute, for example:
  * `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#create-mr-comment-watcher`
  * `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#handle-worker-exec-jump`
  * `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#monitor-implementer-lane`
  * `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#handle-merge-or-close-decision`

* if `{{event_exec}}` is set
  * before you report or stop, execute that exact MDScript event jump
  * include `{{event_exec}}` and the necessary response in the report
  * include the event response in the file comment

* if `{{event_type}}` is `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR` and `{{event_exec}}` is empty
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
  * include the converted event execution and the necessary response in the report
  * include the converted event execution in the file comment

* if `{{blocker}}` is set
  * [Report Blocked State](#report-blocked-state)

* if you report a scoped proven state
  * [Report Proven State](#report-proven-state)

* do not claim done until one of these events occurs:
  * the MR/PR merges
  * the authorized owner explicitly closes the MR/PR
  * the orchestrator accepts the terminal state of the lane in a file comment or an equivalent external tracker record

## Report Blocked State

* if the blocker is absent infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or a safe target
  * include the local resource path that you tried
  * include why that path cannot satisfy the precondition

* report `Blocked for {{claim_scope}}: {{blocker}}`

* before you ask the user, a repository owner, or a different authority surface for input
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this workflow and `{{return_resume_heading}}` set to `report-to-orchestrator`

* ask the smallest decision-ready question
* bind the answer to `{{authority_decision}}`
  * resume at [Report To Orchestrator](#report-to-orchestrator)

## Report Proven State

* state the scoped claim that is proven and the proof path that passed
* state the proof that you do not claim, and if the goal stays active or terminal
* state the exact merge, close, release, deploy, launch, or live-proof authority that remains

* do not present `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` as live proof
* do not present these results as final readiness, merge readiness, issue-close readiness, launch readiness, release readiness, or deployment readiness
