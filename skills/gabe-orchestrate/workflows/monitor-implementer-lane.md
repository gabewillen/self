<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Monitor Implementer Lane

* read worker state before steering

* for watcher wakeups and urgent state changes, apply [Hot Path Event Handling](../SKILL.md#hot-path-event-handling) first; use linked workflow detail only after the table identifies the next owner action

* avoid interrupting coherent active work unless there is a blocker, material drift, stale evidence, permission risk, missing watcher, or agent-addressed handoff

* require implementers that create or own an MR/PR to create or maintain their own monitoring goal MDScript until merge or explicit close

* require implementer monitor resumes to include a goal MDScript re-entry such as `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`

* require implementers to report MR/PR link, referenced tickets, agent identities, current head, check state, default-branch merge blocker state, `{{claim_scope}}`, contract preconditions, postconditions, invariants, proof path, local resource path, proof supplied, proof not claimed, next proof, and scoped proven, watching, repair-required, or blocked status

* run [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) when a worker, watcher, child orchestrator, MR/PR, or ledger state implies `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`; require `{{event_exec}}` and execute the exact event jump

* if `{{event_exec}}` is `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`
  * run [Handle Merge Or Close Decision](merge-or-close-decision.md#handle-merge-or-close-decision) or record the root's explicit denial with the exact authority, policy, or proof reason

* if `{{event_exec}}` is `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`
  * interrupt lower-priority waiting and send the implementer to refresh onto the current target within one watcher cycle or report the exact blocker

* if `{{event_exec}}` is `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked`
  * escalate to the parent/root instead of waiting silently

* if `{{event_exec}}` is `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`
  * require the owner to report blocker path, dirty state, conflict, missing authority, failed command, or thread failure before accepting another old-head proof report

* treat CI/CD and check failures as monitored state until the requested next action is default-branch merge

* do not mark the lane blocked solely by CI/check state while implementation, review, proof, or non-default integration work can continue

* when this orchestrator owns management state for active worker or child-orchestrator lanes, write or refresh the orchestrator goal MDScript while any lane is active, blocked, waiting, or carrying an open handoff

* if an implementer message includes a `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/` jump
  * run [Handle Worker Exec Jump](handle-worker-exec-jump.md#handle-worker-exec-jump)

* if an implementer gives this orchestrator an MR/PR link
  * run [Create MR Comment Watcher](mr-comment-watcher.md#create-mr-comment-watcher)

* if a worker reports a scoped proven state
  * check worker-provided evidence, permission boundary, implementer-owned review record, watcher state, and residual risk for the claimed scope before any allowed next action
  * preserve the scope in the lane ledger and status report
  * do not bounce a valid `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` handoff solely because final live proof, publication, close, merge, launch, release, or deployment proof remains blocked outside the claim
  * do not convert a narrow proven verdict into merge readiness, issue-close readiness, launch readiness, release readiness, deployment readiness, live proof, or final done

* if the worker is blocked
  * require the block to name the exact missing DBC precondition, resource, safe target, credential, hardware, network path, source truth, or authority
  * if the blocker is missing infrastructure, service setup, provider setup, runtime resources, storage, browser, media, or target access, require the worker to report the repo-local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path attempted or ruled out
  * if an available local resource path was skipped, send the worker back to `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof` instead of accepting the lane as blocked
  * confirm the implementer created or requested a blocker watcher goal
  * send the implementer `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher` if the blocker needs monitored goal state
  * before asking Gabe, the user, a repository owner, or another authority surface for input, run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this workflow and `{{return_resume_heading}}` set to `monitor-implementer-lane`
  * prepare the smallest decision-ready question for Gabe or the repository owner when authority or judgment is needed

* when steering a lane back to the worker
  * include an exact implementer continuation jump such as `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#inspect-current-state`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/recursive-blind-review-loop.md#use-gabe-review`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`, or `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher`
