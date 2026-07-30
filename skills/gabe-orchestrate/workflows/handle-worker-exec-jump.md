<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Handle Worker Exec Jump

* parse the implementer message for `{{exec_jump}}`, `{{event_exec}}`, `{{lane_id}}`, `{{issue_or_mr}}`, `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{proof_decision}}`, `{{event_type}}`, `{{stop_reason}}`, `{{blocker}}`, `{{next_owner}}`, and `{{requested_action}}`

* verify `{{exec_jump}}` targets this orchestrator skill or an orchestrator workflow file before following it

* record `{{exec_jump}}`, `{{event_exec}}`, `{{claim_scope}}`, the proof decision, contract fields, local resource path, proof supplied, proof not claimed, blockers, and the message summary in the lane ledger

* preserve scoped proof decisions exactly; do not convert `Proven for source-health` into issue-close, merge, launch, release, deployment, live-proof, or final readiness

* if `{{event_exec}}` is set
  * execute that exact MDScript event jump before any lower-priority continuation

* if `{{event_type}}` is set but `{{event_exec}}` is missing
  * run [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) to convert the event type into the canonical MDScript event jump

* if a worker reports blocked proof for missing infrastructure but does not report a local resource path attempted or ruled out
  * redirect the worker to `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`
  * do not create a blocker watcher yet

* if `{{exec_jump}}` targets `#create-mr-comment-watcher`
  * run [Create MR Comment Watcher](mr-comment-watcher.md#create-mr-comment-watcher)

* if `{{exec_jump}}` targets `#handle-merge-or-close-decision`
  * run [Handle Merge Or Close Decision](merge-or-close-decision.md#handle-merge-or-close-decision)

* if `{{exec_jump}}` targets `#monitor-implementer-lane`
  * run [Monitor Implementer Lane](monitor-implementer-lane.md#monitor-implementer-lane)

* if the implementer is blocked and needs a blocking issue watched
  * send the implementer `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher` with the blocking issue, unblock condition, and reporting path

* when directing work back to the implementer
  * include an exact jump such as `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#inspect-current-state` or a workflow-file jump instead of prose-only instructions

* if the jump target is unsafe, unknown, or outside this orchestrator's authority
  * set `{{blocker}}` to the exact unsafe or unknown jump target
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for the requested action decision, run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state

* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)
