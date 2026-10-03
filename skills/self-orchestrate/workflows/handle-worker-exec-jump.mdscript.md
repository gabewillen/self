<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Worker Exec Jump

* parse the implementer message for these values:
  * `{{exec_jump}}`, `{{event_exec}}`, `{{lane_id}}`, `{{issue_or_mr}}`, and `{{claim_scope}}`
  * `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, and `{{contract_invariants}}`
  * `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and `{{proof_decision}}`
  * `{{event_type}}`, `{{stop_reason}}`, `{{blocker}}`, `{{next_owner}}`, and `{{requested_action}}`
* before you follow `{{exec_jump}}`, make sure that it targets this orchestrator skill or an orchestrator workflow file
* if `{{exec_jump}}` is unsafe, unknown, or outside the authority of this orchestrator
  * set `{{blocker}}` to the exact unsafe or unknown jump target
  * [Stop On Unsafe Jump](#stop-on-unsafe-jump)
* [Record Jump And Proof Scope](#record-jump-and-proof-scope)

## Record Jump And Proof Scope

* record these items in the lane ledger:
  * `{{exec_jump}}`, `{{event_exec}}`, `{{claim_scope}}`, the proof decision, and the contract fields
  * the local resource path, the `proof_supplied` and `proof_not_claimed` values, the blockers, and the message summary
* keep the scoped proof decisions exactly as they are
* do not convert `Proven for source-health` into issue-close, merge, launch, release, deployment, live-proof, or final readiness
* [Dispatch Event Before Jump](#dispatch-event-before-jump)

## Dispatch Event Before Jump

* if `{{event_exec}}` is set
  * before lower-priority continuation, execute that exact MDScript event jump
* if `{{event_type}}` is set but `{{event_exec}}` is missing
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
* if a worker reports blocked proof for missing infrastructure
  * if the report does not name a local resource path that the worker tried or ruled out
    * redirect the worker to `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
    * do not create a blocker watcher yet
    * after the redirect, stop
* [Route Known Jump Targets](#route-known-jump-targets)

## Route Known Jump Targets

* if `{{exec_jump}}` targets `#create-mr-comment-watcher`
  * run [Create MR Comment Watcher](mr-comment-watcher.mdscript.md#create-mr-comment-watcher)
  * after the watcher route returns, stop
* if `{{exec_jump}}` targets `#handle-merge-or-close-decision`
  * run [Handle Merge Or Close Decision](merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)
  * after the disposition route returns, stop
* if `{{exec_jump}}` targets `#monitor-implementer-lane`
  * run [Monitor Implementer Lane](monitor-implementer-lane.mdscript.md#monitor-implementer-lane)
  * after the monitor route returns, stop
* if the implementer is blocked and a blocker issue needs a watcher
  * send the implementer `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher` with the blocker issue, unblock condition, and reporting path
  * after you direct the blocker watcher, stop
* when you send work back to the implementer
  * include an exact jump, such as `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#inspect-current-state` or a workflow-file jump
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Stop On Unsafe Jump

* if the caller will ask the user, a repository owner, or a different authority surface for the requested action decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the stop-boundary state of the caller
* report `Blocked for {{claim_scope}}: {{blocker}}`
* stop
