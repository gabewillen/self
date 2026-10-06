---
name: self-orchestrate
description: "Use this skill for a main agent when the user chose to orchestrate. Coordinate with the fewest lanes, threads, and agents that work (Ponytail). Answer and investigate in this process. Give each code write, edit, or review to an implement worker. Own goals, task files, comments, and the lane ledger. Take in scoped proof decisions, handle thread events, and decide merge, close, and publication only inside the grant."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Operating Context

* if a parent spawned this agent for a write, an edit, or one review lane
  * report that it must use implement, and stop
* if `{{execution_mode}}` is `direct`, report that a direct run uses implement, and stop
* run [Load Operating Context](../self-common/workflows/load-operating-context.mdscript.md#load-operating-context)
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `orchestrator`
* run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet) if a task file exists
* run [Resolve Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#resolve-goal-mdscript)
* if a goal exists for this lane, run `/mdscript-exec {{goal_mdscript}}#resume-goal`
* act for the operating model, not as the user, and record who steers the work
* keep each authority separate: triage, edit, public write, push, CI rerun, merge, close, release, deployment, publication, and proof waiver
* if an authority that you need is missing, set `{{blocker}}` to it, and [Stop At Boundary](#stop-at-boundary)
* [Classify Work](#classify-work)

## Classify Work

* refresh the source of truth, and find the objective, repository, tracker, claim scope, proof path, and done state
* skip a lane, thread, or goal that the work does not need
* if the request writes or edits nothing, answer or investigate in this process, then [Report](#report)
* if the work is narrow non-code coordination, text, triage, or a decision, do it in this process, then [Report](#report)
* if the work is an epic, milestone, project, release train, or has subtickets, [Create Child Orchestrator](#create-child-orchestrator)
* if the task names three or more independent workstreams, run [Classify File Workstream Fanout](../self-common/workflows/file-task-comments.mdscript.md#classify-file-workstream-fanout), then [Create Child Orchestrator](#create-child-orchestrator)
* if one more lane would put this orchestrator above five direct lanes, [Create Child Orchestrator](#create-child-orchestrator)
* for each independent code objective, up to five, [Create Implementer Lane](#create-implementer-lane)
  * start lanes that do not overlap in parallel
* never edit application code or review code in this process

## Create Implementer Lane

* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* use an existing implementer task or thread for the same boundary again, if it keeps its context clean
* otherwise run [Assign Lane Identity](../self-common/workflows/lane-identity.mdscript.md#assign-lane-identity), and create the implementer with the selected model and effort
* run [Ensure File Task](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task) with `type: implementer`
* if an agent will monitor or resume the lane, run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) on the parent task with the handoff:
  * entry: `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#load-worker-context`
  * objective, repository, tracker, task id, comment path, goal path, and done state
  * grants, forbidden actions, claim scope, contract, proof path, expected tests, and the local resource path to try
  * `self_review_requested` only from the user's words, otherwise empty
  * `model`, `reasoning`, `model_selection_basis`, the parent, and the reporting path
  * report before you stop; no execution subdelegation; never delegate the full `/self-review`
* if no worker tools exist and the work is local, bounded, and granted
  * run [Use Single Process Fallback](../self-common/workflows/file-task-comments.mdscript.md#use-single-process-fallback), and continue at the implementer entry in this process
* run [Maintain File Lane Ledger](../self-common/workflows/file-task-comments.mdscript.md#maintain-file-lane-ledger)
* [Report](#report)

## Create Child Orchestrator

* use an existing child for the same boundary again, if one exists
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `orchestrator`
* run [Ensure File Task](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task) with `type: child-orchestrator` and id `<parent>-<workstream>-orchestrator`
* run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript) for the child
* create the child as a durable thread, never a subagent
  * if no thread tool exists, record `thread_tooling: unavailable`, and use the file task as the lane
* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) on the parent task with the handoff:
  * entry: `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#load-operating-context`
  * systems, tracker scope, subtickets, grants, lane cap, proof and review expectations, and report cadence
  * `model`, `reasoning`, `model_selection_basis`, the parent, and the reporting path
  * the child owns its subticket lanes, goals, ledger, events, and thread cleanup, and reports before it stops
* run [Maintain File Lane Ledger](../self-common/workflows/file-task-comments.mdscript.md#maintain-file-lane-ledger)
* [Report](#report)

## Monitor Implementer Lane

* run `/mdscript-exec {{goal_mdscript}}#resume-goal` first, and refresh the live PR, tracker, CI, review, and ledger state
* if a report carries `{{event_exec}}` or an event type, run [Handle Thread Event Contracts](../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts) before other work
* make sure that each delegated lane actually progresses
  * if it is stalled, resume it with the missing step, or do the step here
* do not interrupt coherent work that has no blocker, drift, stale evidence, or risk
* until the next action is a default-branch merge, treat CI failures as lane state, not a block
* if the worker owns a PR without a monitor goal, send it `/mdscript-exec {{skills_root}}/self-implement/workflows/mr-monitor.mdscript.md#create-mr-monitor-goal`
* if the worker reports `Proven for {{claim_scope}}`, [Confirm Implementer Completion Gates](#confirm-implementer-completion-gates)
* if the worker is blocked
  * if it names no local resource path that it tried, send it `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
  * if the block needs a watcher, send it `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher`
  * if the user or an owner must decide, [Stop At Boundary](#stop-at-boundary)
* send each steer with an exact implementer jump, and record it in the ledger
* [Report](#report)

## Monitor Child Orchestrator

* read the child's lane ledger, subtickets, decisions, watcher state, and requested authority
* run [Handle Thread Event Contracts](../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts) for each event that it reports
* before you accept a terminal child, make sure of these:
  * it wrote a parent-visible rollup with the [stop-report fields](../self-common/references/stop-report-fields.md)
  * its task and goal show no active work
  * if not, send it the exact repair, and stop
* answer only the decisions that the child escalates; send leaf reports back through the child
* if the child is stale or over its lane cap, tell it to refresh its ledger or split its scope
* [Report](#report)

## Handle Worker Exec Jump

* parse `{{exec_jump}}`, `{{event_exec}}`, the claim scope, the proof fields, the blocker, and the next owner from the worker message
* if `{{exec_jump}}` is not a heading of this skill, set `{{blocker}}` to it, and [Stop At Boundary](#stop-at-boundary)
* record the jump and the scoped proof decision in the ledger, exactly as the worker wrote it
* run `{{event_exec}}` first if it is set
* run the heading that `{{exec_jump}}` names

## Create MR Comment Watcher

* run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript) for each PR that a worker hands over
  * resume on new comments, review threads, system notes, CI changes, and target drift
  * record the PR, lane, reporting path, agent identities, tickets, and current head in the goal
* use no automation tool unless the user asks for one
* on each resume, refresh the PR state, and act only on what changed:
  * record each new comment in the ledger, and send action requests to the implementer
  * if the comment changes merge or close state, [Handle Merge Or Close Decision](#handle-merge-or-close-decision)
* [Report](#report)

## Confirm Implementer Completion Gates

* do not review code, spawn reviewers, or give `/self-review` to a subagent; the implementer composes review
* reject the report if it does not name these:
  * the claim scope, contract, proof path, `proof_supplied`, and `proof_not_claimed`
  * for resources, the local resource path
* reject a narrow verdict (`source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`) that claims merge, close, release, deployment, live proof, or done
* run [Decide Self Review](../self-common/workflows/self-review-consent.mdscript.md#decide-self-review); if it waits for the user, stop
* if self-review ran on code, make sure of:
  * a fresh blind reviewer for each selected lane and round, composed by the implementer
  * round 1 findings all resolved, round 2 P1 and P2, round 3 and later P1, and residuals kept visible
  * for GitLab, grades, questions, answers, and fixes visible on the MR through `-reviewer` aliases
* if self-review ran on non-code work, make sure that it had exactly one fresh review and direct validation
* reject a blocked report that skipped an available local resource, or blends blocker types
* if a check fails, record it, send the exact repair jump, and stop
* if merge or close is the claim, [Handle Merge Or Close Decision](#handle-merge-or-close-decision)
* record the accepted claim, the proof, and the residual risk in the ledger
* [Report](#report)

## Handle Merge Or Close Decision

* run `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready` for the current head
  * if it fails, stop
* reject a narrow proven verdict that claims broader authority
* merge only a worker PR into a permitted non-default branch, with clean gates and an allowing local rule
* never merge a default, production, or release branch, a human-owned PR, a release, or a deployment without that exact grant
  * if the grant is missing, set `{{blocker}}` to it, and [Stop At Boundary](#stop-at-boundary)
* after a merge, refresh the linked tickets
  * close each ticket that the merge finished, if you may, with a short note through [Use GitLab Sudo Alias Before Public Write](../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
  * record each ticket that stays open and why
* [Report](#report)

## Report

* run [Report Status](../self-common/workflows/report-boundary.mdscript.md#report-status)
* while coordination stays active, name the goal path, the `/mdscript-exec {{goal_mdscript}}#resume-goal` command, and the next owner

## Stop At Boundary

* report `Blocked for {{claim_scope}}: {{blocker}}`, or the exact missing permission, evidence, or resource
* run [Report Stop To File Comments](../self-common/workflows/file-task-comments.mdscript.md#report-stop-to-file-comments)
* run [Cleanup Created Threads](../self-common/workflows/thread-cleanup.mdscript.md#cleanup-created-threads)
* if you need input, run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `stop-at-boundary`
* stop
