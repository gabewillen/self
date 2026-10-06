<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report To Orchestrator

* if `{{event_exec}}` or an event type is set, run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts) first
* put the result first: the claim, what changed, the proof path and its outcome, and the residual risk
* add each skipped item as `skipped: <item>, add when <trigger>`, and each `ponytail:` comment that you added
* add the PR, the current and target heads, the tickets, the contract, the tests, `{{proof_supplied}}`, and `{{proof_not_claimed}}`
* add the next owner, the next action, and each orchestrator jump, for example `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#monitor-implementer-lane`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress), set the log `status` to match `{{stop_reason}}`, and name its re-entry
* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) before a chat or tracker report
* report to `{{parent_reporting_path}}` with `Active`, `Changed`, `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}`, or `Done`
* never present a narrow proven claim as live proof or as merge, close, release, or deployment readiness
* if `{{blocker}}` is set
  * for missing infrastructure, name the local resource path that you tried and why it fails
  * report `Blocked for {{claim_scope}}: {{blocker}}`
  * if you need a decision, run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `report-to-orchestrator`
* do not claim done until the PR merges, its owner closes it, or the orchestrator accepts the terminal state
