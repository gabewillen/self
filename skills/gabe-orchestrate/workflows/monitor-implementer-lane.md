<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Monitor Implementer Lane

* read worker state before steering
* resolve `{{goal_mdscript}}` from the active orchestrator or implementer goal path when present
* for watcher wakeups and urgent state changes, run [Hot Path Event Handling](hot-path-event-handling.md#hot-path-event-handling) first
* avoid interrupting coherent active work unless there is a blocker, material drift, stale evidence, permission risk, missing watcher, or agent-addressed handoff
* [Verify Implementer Monitor Requirements](#verify-implementer-monitor-requirements)

## Verify Implementer Monitor Requirements

* if the implementer created or owns an MR/PR
  * verify the implementer created or maintains a monitoring goal MDScript until merge or explicit close
  * if the implementer monitor goal is missing
    * send the implementer `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`
    * stop after directing the implementer to create the monitor goal
* verify implementer reports include MR/PR link, referenced tickets, agent identities, current head, check state, default-branch merge blocker state, `{{claim_scope}}`, contract fields, proof path, local resource path, proof supplied, proof not claimed, next proof, and scoped status
* if required report fields are missing
  * set `{{blocker}}` to the missing implementer report field
  * [Steer Implementer Lane](#steer-implementer-lane)
* [Dispatch Implementer Monitor Events](#dispatch-implementer-monitor-events)

## Dispatch Implementer Monitor Events

* run [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) when a worker, watcher, child orchestrator, MR/PR, or ledger state implies `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
* if `{{event_exec}}` is set
  * execute the exact event jump before lower-priority monitoring work
* if `{{event_exec}}` targets disposition-ready
  * run [Handle Merge Or Close Decision](merge-or-close-decision.md#handle-merge-or-close-decision)
  * if root denies disposition, record the exact authority, policy, or proof reason and stop
* if `{{event_exec}}` targets target-drift
  * interrupt lower-priority waiting
  * send the implementer to refresh onto the current target within one watcher cycle or report the exact blocker
  * stop after the interrupt handoff
* if `{{event_exec}}` targets handoff-unacked
  * escalate to the parent/root instead of waiting silently
  * stop after escalation
* if `{{event_exec}}` targets stale-mr
  * require the owner to report blocker path, dirty state, conflict, missing authority, failed command, or thread failure before accepting another old-head proof report
  * stop after the stale-mr handoff
* [Classify Implementer Monitor State](#classify-implementer-monitor-state)

## Classify Implementer Monitor State

* treat CI/CD and check failures as monitored state until the requested next action is default-branch merge
* do not mark the lane blocked solely by CI/check state while implementation, review, proof, or non-default integration work can continue
* when this orchestrator owns management state for active worker or child-orchestrator lanes
  * write or refresh the orchestrator goal MDScript while any lane is active, blocked, waiting, or carrying an open handoff
  * resolve `{{goal_mdscript}}` from the refreshed orchestrator goal path
* if an implementer message includes a `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/` jump
  * run [Handle Worker Exec Jump](handle-worker-exec-jump.md#handle-worker-exec-jump)
* if an implementer gives this orchestrator an MR/PR link
  * run [Create MR Comment Watcher](mr-comment-watcher.md#create-mr-comment-watcher)
* if a worker reports a scoped proven state
  * [Handle Implementer Proven Report](#handle-implementer-proven-report)
* if the worker is blocked
  * [Handle Implementer Blocked Report](#handle-implementer-blocked-report)
* [Steer Implementer Lane](#steer-implementer-lane)

## Handle Implementer Proven Report

* check worker-provided evidence, permission boundary, implementer-owned review record, watcher state, and residual risk for the claimed scope
* preserve the scope in the lane ledger and status report
* do not bounce a valid `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` handoff solely because broader proof remains outside the claim
* do not convert a narrow proven verdict into merge readiness, issue-close readiness, launch readiness, release readiness, deployment readiness, live proof, or final done
* run [Confirm Implementer Completion Gates](completion-gates.md#confirm-implementer-completion-gates)
* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)

## Handle Implementer Blocked Report

* verify the block names the exact missing DBC precondition, resource, safe target, credential, hardware, network path, source truth, or authority
* if the blocker is missing infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or target access
  * verify the worker reported the repo-local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path attempted or ruled out
  * if the local resource path report is missing
    * set `{{blocker}}` to `missing local resource path on infrastructure block`
    * send the worker back to `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`
    * stop after redirecting the worker
* if an available local resource path was skipped
  * send the worker back to `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`
  * stop after redirecting the worker
* confirm the implementer created or requested a blocker watcher goal
* if the blocker needs monitored goal state and no blocker watcher exists
  * send the implementer `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher`
  * stop after directing the blocker watcher
* if authority or judgment is needed from Agent, the user, or a repository owner
  * run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this workflow and `{{return_resume_heading}}` set to `monitor-implementer-lane`
  * prepare the smallest decision-ready question for the authority decision
  * stop after the prompt is prepared
* [Steer Implementer Lane](#steer-implementer-lane)

## Steer Implementer Lane

* include an exact implementer continuation jump such as `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#inspect-current-state`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/recursive-blind-review-loop.md#use-multi-lane-review`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`, or `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher`
* update the lane ledger with the steering action and next owner
* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)
