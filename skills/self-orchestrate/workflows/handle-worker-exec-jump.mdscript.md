<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Worker Exec Jump

* parse the implementer message for `{{exec_jump}}`, `{{event_exec}}`, `{{lane_id}}`, `{{issue_or_mr}}`, `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{proof_decision}}`, `{{event_type}}`, `{{stop_reason}}`, `{{blocker}}`, `{{next_owner}}`, and `{{requested_action}}`
* verify `{{exec_jump}}` targets this orchestrator skill or an orchestrator workflow file before following it
* if `{{exec_jump}}` is unsafe, unknown, or outside this orchestrator's authority
  * set `{{blocker}}` to the exact unsafe or unknown jump target
  * [Stop On Unsafe Jump](#stop-on-unsafe-jump)
* [Record Jump And Proof Scope](#record-jump-and-proof-scope)

## Record Jump And Proof Scope

* record `{{exec_jump}}`, `{{event_exec}}`, `{{claim_scope}}`, the proof decision, contract fields, local resource path, proof supplied, proof not claimed, blockers, and the message summary in the lane ledger
* preserve scoped proof decisions exactly
* do not convert `Proven for source-health` into issue-close, merge, launch, release, deployment, live-proof, or final readiness
* [Dispatch Event Before Jump](#dispatch-event-before-jump)

## Dispatch Event Before Jump

* if `{{event_exec}}` is set
  * execute that exact MDScript event jump before any lower-priority continuation
* if `{{event_type}}` is set but `{{event_exec}}` is missing
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
* if a worker reports blocked proof for missing infrastructure but does not report a local resource path attempted or ruled out
  * redirect the worker to `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
  * do not create a blocker watcher yet
  * stop after the redirect
* [Route Known Jump Targets](#route-known-jump-targets)

## Route Known Jump Targets

* if `{{exec_jump}}` targets `#create-mr-comment-watcher`
  * run [Create MR Comment Watcher](mr-comment-watcher.mdscript.md#create-mr-comment-watcher)
  * stop after the watcher route returns
* if `{{exec_jump}}` targets `#handle-merge-or-close-decision`
  * run [Handle Merge Or Close Decision](merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)
  * stop after the disposition route returns
* if `{{exec_jump}}` targets `#monitor-implementer-lane`
  * run [Monitor Implementer Lane](monitor-implementer-lane.mdscript.md#monitor-implementer-lane)
  * stop after the monitor route returns
* if the implementer is blocked and needs a blocking issue watched
  * send the implementer `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher` with the blocking issue, unblock condition, and reporting path
  * stop after directing the blocker watcher
* when directing work back to the implementer
  * include an exact jump such as `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#inspect-current-state` or a workflow-file jump
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Stop On Unsafe Jump

* if the caller will ask the user, a repository owner, or another authority surface for the requested action decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state
* stop and report `Blocked for {{claim_scope}}: {{blocker}}`
