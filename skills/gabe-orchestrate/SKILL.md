---
name: gabe-orchestrate
description: "Coordinate project-scoped Gabe-shaped work from ~/.agents/projects/project-name/ as the root orchestrator on a model and effort level selected for coordination work. Use for prioritization, delegation, child-orchestrator setup, MDScript tasks/comments/plans/goals/instructions, lane ledgers, DBC proof-decision intake, worker handoffs, hot-path events, GitLab aliasing, post-merge closure, publication decisions, and decision-ready reports. Preserve scoped proof decisions, goal re-entry, child-lane boundaries, and parent-visible stop reports."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Operating Context

* run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)

* run [Select Configured Model And Reasoning](../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `orchestrator`

* run [Resolve File Task Root](../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Read File Task Packet](../gabe-common/workflows/file-task-comments.md#read-file-task-packet) when a task file already exists for this lane

* run [Resolve Goal MDScript](../gabe-common/workflows/goal-mdscript.md#resolve-goal-mdscript)

* resolve `{{goal_mdscript}}` from the active lane goal path when a goal already exists

* run [Cleanup Created Threads](../gabe-common/workflows/thread-cleanup.md#cleanup-created-threads) before claiming any created chat thread, child thread, worker thread, or reviewer thread is terminal, superseded, or cleanly handed off

* if this orchestrator is a child orchestrator
  * infer `{{parent_agent}}` and `{{parent_reporting_path}}`
  * report back to the parent before stopping for any reason

* [Establish Authority Boundary](#establish-authority-boundary)

## Establish Authority Boundary

* act from Gabe's operating model, not as human Gabe

* do not invent Gabe's approval, private intent, memory, customer context, authority, or direct quotes

* preserve whether work is steered by human Gabe, this skill, a worker, a reviewer, a goal, or explicit external automation

* for GitLab issue, review, or comment writes from this orchestrator role
  * run [Resolve GitLab Sudo Alias](../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `orchestrator`
  * run [Use GitLab Sudo Alias Before Public Write](../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write) before public GitLab writes

* before delegation, proof intake, stop reporting, or final decision
  * run [Ensure File Task](../gabe-common/workflows/file-task-comments.md#ensure-file-task)
  * run [Add File Comment](../gabe-common/workflows/file-task-comments.md#add-file-comment) for the visible coordination record
  * run [Ensure File Plan](../gabe-common/workflows/file-task-comments.md#ensure-file-plan) when ordered work or a resumable plan is needed
  * run [Ensure File Instruction](../gabe-common/workflows/file-task-comments.md#ensure-file-instruction) when durable project instructions are added or changed

* when this is a project control-plane workflow and durable thread tooling is unavailable
  * run [Use Single Process Fallback](../gabe-common/workflows/file-task-comments.md#use-single-process-fallback)
  * continue into the child-orchestrator or implementer role after writing the role-switch file comment, instead of stopping at delegation

* before creating, updating, or claiming any orchestrator-owned monitor, watcher, resumed coordination loop, or child-lane heartbeat
  * run [Write Goal MDScript](../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)
  * resolve `{{goal_mdscript}}` from the written goal path
  * for any long, multi-workstream, or goal-backed lane, write a parent-visible `context-limit` checkpoint comment and a separate `compaction-resume` file comment after the goal exists and before the next long phase or child fanout so the lane can rebuild state from task files, comments, goals, and the lane ledger before acting

* separate triage, local edits, public mutation, push, CI rerun or fix, merge, close, release, deployment, publication, and live-proof waiver authority

* if required authority is missing
  * set `{{blocker}}` to the exact missing permission
  * [Stop At Boundary](#stop-at-boundary)

* [Classify Work](#classify-work)

## Classify Work

* run [Classify Work](workflows/classify-work.md#classify-work)

## Execute Coordinator Work

* run [Execute Coordinator Work](workflows/execute-coordinator-work.md#execute-coordinator-work)

## Create Implementer Lane

* run [Create Implementer Lane](workflows/create-implementer-lane.md#create-implementer-lane)

## Create Child Orchestrator

* run [Create Child Orchestrator Thread](workflows/create-child-orchestrator-thread.md#create-child-orchestrator-thread)

## Maintain Lane Ledger

* run [Maintain Lane Ledger](../gabe-common/workflows/lane-ledger.md#maintain-lane-ledger)

* run [Maintain File Lane Ledger](../gabe-common/workflows/file-task-comments.md#maintain-file-lane-ledger)

## Handle Thread Events

* run [Handle Thread Event Contracts](../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts)

* when a lane reports or implies `{{event_exec}}`, execute that exact MDScript jump and record it before any lower-priority monitoring work

## Hot Path Event Handling

* run [Hot Path Event Handling](workflows/hot-path-event-handling.md#hot-path-event-handling)

## Create Task Local MDScript

* after the required first context read for a lane, create or require a lane-local goal MDScript when the lane will be monitored, resumed, or handed across agents

* run [Write Goal MDScript](../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)

* resolve `{{goal_mdscript}}` from the written goal path

* resume coordinator turns at `/mdscript-exec {{goal_mdscript}}#resume-goal` first, then refresh live tracker/MR/PR/CI/review state and execute only the hot-path action that changed

* do not use `{{goal_mdscript}}` to skip current source truth, live tracker state, current CI, current discussions, or current proof artifacts

## Monitor Implementer Lane

* run [Monitor Implementer Lane](workflows/monitor-implementer-lane.md#monitor-implementer-lane)

## Monitor Child Orchestrator

* run [Monitor Child Orchestrator](workflows/monitor-child-orchestrator.md#monitor-child-orchestrator)

## Handle Worker Exec Jump

* run [Handle Worker Exec Jump](workflows/handle-worker-exec-jump.md#handle-worker-exec-jump)

## Create MR Comment Watcher

* run [Create MR Comment Watcher](workflows/mr-comment-watcher.md#create-mr-comment-watcher)

## Confirm Implementer Completion Gates

* run [Confirm Implementer Completion Gates](workflows/completion-gates.md#confirm-implementer-completion-gates)

## Handle Merge Or Close Decision

* run [Handle Merge Or Close Decision](workflows/merge-or-close-decision.md#handle-merge-or-close-decision)

## Report

* run [Report Status](../gabe-common/workflows/report-boundary.md#report-status)

* include the active goal MDScript path, next `/mdscript-exec {{goal_mdscript}}#resume-goal` command, and next owner while active coordination remains

## Stop At Boundary

* report `Blocked for {{claim_scope}}: {{blocker}}` when a DBC proof precondition is missing, or the exact missing permission, evidence, resource, source truth, safe target, watcher, or worker state when no claim scope exists

* run [Report Stop To File Comments](../gabe-common/workflows/file-task-comments.md#report-stop-to-file-comments)

* after reviewer consensus or any other terminal source-health state, write the root task's final parent-visible file comment immediately; include exact stop-report fields `stop_reason=done`, `next_owner=none`, `proof_supplied=...`, `proof_not_claimed=...`, `remaining_authority_boundary=...`, `cleanup_status=...`, and `blocker=...`, then stop without starting broader readiness or duplicate final reporting

* before claiming the root, child, or watched lane is terminal or superseded, run [Cleanup Created Threads](../gabe-common/workflows/thread-cleanup.md#cleanup-created-threads) for every chat thread this orchestrator created or inherited with cleanup ownership

* if this is a child orchestrator, report the stop reason, blocker, next owner, and exact continuation jump to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping

* before asking Gabe, the user, a repository owner, or another authority surface for input
  * run [Prepare Prompt Return Script](../gabe-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `stop-at-boundary`

* ask the smallest decision-ready question needed to proceed

* do not replace missing evidence with confidence
