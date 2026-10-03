<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Monitor Implementer Lane

* before you steer, read the worker state
* if an active orchestrator or implementer goal path exists
  * set `{{goal_mdscript}}` to that goal path
* for watcher wakeups and urgent state changes, run [Hot Path Event Handling](hot-path-event-handling.mdscript.md#hot-path-event-handling) first
* make sure that each delegated background lane actually executes
  * examine its live process, resource, receipt, or output progress against the expected cadence
  * do not think that a lane works only because a wake-up or notification is armed
* if a delegated lane is stalled or idle past its expected cadence
  * resume it with the exact missing step, or take the work over directly in this process
  * do not wait idle for notifications that possibly never fire
* if there is no blocker, material drift, stale evidence, permission risk, missing watcher, or agent-addressed handoff
  * do not interrupt coherent active work
* [Verify Implementer Monitor Requirements](#verify-implementer-monitor-requirements)

## Verify Implementer Monitor Requirements

* if the implementer created or owns an MR/PR
  * make sure that the implementer created or maintains a monitor goal MDScript until merge or explicit close
  * if the implementer monitor goal is missing
    * send the implementer `/mdscript-exec {{skills_root}}/self-implement/workflows/mr-monitor.mdscript.md#create-mr-monitor-goal`
    * after you tell the implementer to create the monitor goal, stop
* make sure that the implementer reports include these fields:
  * the MR/PR link, referenced tickets, agent identities, current head, check state, and default-branch merge blocker state
  * `{{claim_scope}}`, the contract fields, proof path, local resource path, `proof_supplied`, and `proof_not_claimed`
  * the next proof and the scoped status
* if a necessary report field is missing
  * set `{{blocker}}` to the missing implementer report field
  * [Steer Implementer Lane](#steer-implementer-lane)
* [Dispatch Implementer Monitor Events](#dispatch-implementer-monitor-events)

## Dispatch Implementer Monitor Events

* if a worker, watcher, child orchestrator, MR/PR, or ledger state implies `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
* if `{{event_exec}}` is set
  * before lower-priority monitor work, execute the exact event jump
* if `{{event_exec}}` targets disposition-ready
  * run [Handle Merge Or Close Decision](merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)
  * if the root denies disposition
    * record the exact authority, policy, or proof reason
    * stop
* if `{{event_exec}}` targets target-drift
  * interrupt lower-priority waits
  * tell the implementer to refresh onto the current target within one watcher cycle, or to report the exact blocker
  * after the interrupt handoff, stop
* if `{{event_exec}}` targets handoff-unacked
  * escalate to the parent/root
  * do not wait silently
  * after the escalation, stop
* if `{{event_exec}}` targets stale-mr
  * tell the owner to report the blocker path, dirty state, conflict, missing authority, failed command, or thread failure
  * do not accept another old-head proof report before the owner reports this
  * after the stale-mr handoff, stop
* [Classify Implementer Monitor State](#classify-implementer-monitor-state)

## Classify Implementer Monitor State

* until the requested next action is a default-branch merge, treat CI/CD and check failures as monitored state
* if implementation, review, proof, or non-default integration work can continue
  * do not mark the lane blocked only because of the CI/check state
* when this orchestrator owns the management state for active worker or child-orchestrator lanes
  * while a lane is active, blocked, waiting, or has an open handoff, write or refresh the orchestrator goal MDScript
  * set `{{goal_mdscript}}` to the refreshed orchestrator goal path
* if an implementer message includes a `/mdscript-exec {{skills_root}}/self-orchestrate/` jump
  * run [Handle Worker Exec Jump](handle-worker-exec-jump.mdscript.md#handle-worker-exec-jump)
* if an implementer gives this orchestrator an MR/PR link
  * run [Create MR Comment Watcher](mr-comment-watcher.mdscript.md#create-mr-comment-watcher)
* if a worker reports a scoped proven state
  * [Handle Implementer Proven Report](#handle-implementer-proven-report)
* if the worker is blocked
  * [Handle Implementer Blocked Report](#handle-implementer-blocked-report)
* [Steer Implementer Lane](#steer-implementer-lane)

## Handle Implementer Proven Report

* for the claimed scope, examine the worker evidence, permission boundary, implementer-owned review record, watcher state, and residual risk
* keep the scope in the lane ledger and the status report
* if broader proof remains outside the claim
  * do not reject a valid `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` handoff for that reason
* do not convert a narrow proven verdict into merge, issue-close, launch, release, or deployment readiness
* do not convert a narrow proven verdict into live proof or final done
* run [Confirm Implementer Completion Gates](completion-gates.mdscript.md#confirm-implementer-completion-gates)
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Handle Implementer Blocked Report

* make sure that the block names the exact missing item
* accept a DBC precondition, resource, safe target, credential, hardware, network path, source truth, or authority as the item
* if the blocker is missing infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or target access
  * count a repo-local stack, bootstrap, preflight, dev server, fixture target, or compose profile as a local resource path
  * make sure that the worker reported the local resource path that it tried or ruled out
  * if the local resource path report is missing
    * set `{{blocker}}` to `missing local resource path on infrastructure block`
    * send the worker back to `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
    * after you redirect the worker, stop
* if the worker skipped an available local resource path
  * send the worker back to `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
  * after you redirect the worker, stop
* make sure that the implementer created or asked for a blocker watcher goal
* if the blocker needs monitored goal state and no blocker watcher exists
  * send the implementer `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher`
  * after you direct the blocker watcher, stop
* if the user or a repository owner must give authority or judgment
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this workflow and `{{return_resume_heading}}` set to `monitor-implementer-lane`
  * prepare the smallest decision-ready question for the authority decision
  * after the prompt is ready, stop
* [Steer Implementer Lane](#steer-implementer-lane)

## Steer Implementer Lane

* include an exact implementer continuation jump, such as one of these:
  * `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#inspect-current-state`
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/recursive-blind-review-loop.mdscript.md#use-multi-lane-review`
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/mr-monitor.mdscript.md#create-mr-monitor-goal`
  * `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher`
* record the steer action and the next owner in the lane ledger
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)
