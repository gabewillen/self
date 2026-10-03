---
name: self-orchestrate
description: "ALWAYS use this skill unless you are a subagent. Prioritize work, and give each write or edit task to an implement worker. Own goals/tasks/comments/lane ledgers and the intake of DBC proof decisions. Manage handoffs and hot-path events. Decide publication and post-merge closure. Keep stop reports and goal re-entry current."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Operating Context

* use this skill as the default role for each agent that is not a subagent, with or without a parent
* if a parent agent spawned this agent for a write task, an edit task, or one blind review lane
  * report that subagents use implement (or one blind-lane MDScript), not orchestrate
  * stop
* if this agent is a parentless main agent
  * act as the root orchestrator
  * do not report to a parent

* if `{{skills_root}}` is empty
  * if the parent skills directory of this skill exists
    * set `{{skills_root}}` to that directory
* run [Load Operating Context](../self-common/workflows/load-operating-context.mdscript.md#load-operating-context)

* if the current user message is a durable **user** correction about how agents must write, edit, review, route, or coordinate
  * set `{{correction_source}}` to a quote of the user's words only
  * run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)

* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `orchestrator`
* run [Resolve File Task Root](../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* if a task file already exists for this lane
  * run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet)
* run [Resolve Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#resolve-goal-mdscript)
* if a goal already exists
  * set `{{goal_mdscript}}` to the active lane goal path
* before you claim that a created chat, child, worker, or reviewer thread is terminal, superseded, or cleanly handed off
  * run [Cleanup Created Threads](../self-common/workflows/thread-cleanup.mdscript.md#cleanup-created-threads)
* if this orchestrator is a child orchestrator
  * find `{{parent_agent}}` and `{{parent_reporting_path}}`
  * before you stop for any reason
    * report back to the parent

* [Establish Authority Boundary](#establish-authority-boundary)

## Establish Authority Boundary

* act from the installed operating model, not as the user
* do not invent the user's approval, private intent, memory, customer context, authority, or direct quotes
* record what steers the work: the user, this skill, a worker, a reviewer, a goal, or explicit external automation
* if this orchestrator role writes a GitLab issue, review, or comment
  * run [Resolve GitLab Sudo Alias](../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `orchestrator`
  * before each public GitLab write
    * run [Use GitLab Sudo Alias Before Public Write](../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)

* before you delegate, take in proof, report a stop, or make a final decision
  * run [Ensure File Task](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task)
  * run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) for the visible coordination record
  * if ordered work or a resumable plan is necessary
    * run [Ensure File Plan](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-plan)
  * if you add or change durable project instructions
    * run [Ensure File Instruction](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-instruction)

* if this is a project control-plane workflow and no durable thread tools are available
  * run [Use Single Process Fallback](../self-common/workflows/file-task-comments.mdscript.md#use-single-process-fallback)
  * write the role-switch file comment
  * continue into the child-orchestrator or implementer role
  * do not stop at delegation

* before you create, change, or claim an orchestrator-owned monitor, watcher, resumed coordination loop, or child-lane heartbeat
  * run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
  * set `{{goal_mdscript}}` to the written goal path
  * if the lane is long, multi-workstream, or goal-backed
    * after the goal exists, write a parent-visible `context-limit` checkpoint comment
    * write a separate `compaction-resume` file comment
    * write the two comments before the next long phase or child fanout
    * make sure that the lane can rebuild state from task files, comments, goals, and the lane ledger before it acts

* keep these authorities separate: triage, local edit, public mutation, push, CI rerun/fix, merge, close, release, deployment, publication, live-proof waiver

* if a necessary authority is missing
  * set `{{blocker}}` to the exact missing permission
  * [Stop At Boundary](#stop-at-boundary)

* [Classify Work](#classify-work)

## Classify Work

* run [Classify Work](workflows/classify-work.mdscript.md#classify-work)

## Execute Coordinator Work

* run [Execute Coordinator Work](workflows/execute-coordinator-work.mdscript.md#execute-coordinator-work)

## Create Implementer Lane

* run [Create Implementer Lane](workflows/create-implementer-lane.mdscript.md#create-implementer-lane)

## Create Child Orchestrator

* run [Create Child Orchestrator Thread](workflows/create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)

## Maintain Lane Ledger

* run [Maintain Lane Ledger](../self-common/workflows/lane-ledger.mdscript.md#maintain-lane-ledger)

* run [Maintain File Lane Ledger](../self-common/workflows/file-task-comments.mdscript.md#maintain-file-lane-ledger)

## Handle Thread Events

* run [Handle Thread Event Contracts](../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)

* if a lane reports or implies `{{event_exec}}`
  * execute that exact MDScript jump before lower-priority monitor work
  * record the jump before lower-priority monitor work

## Hot Path Event Handling

* run [Hot Path Event Handling](workflows/hot-path-event-handling.mdscript.md#hot-path-event-handling)

## Create Task Local MDScript

* if an agent will monitor or resume a lane, or the lane will move to a different agent
  * after the first context read for the lane
    * create a lane-local goal MDScript, or tell the lane owner to create it

* if the coordination is not a monitored lane, for example a decision, a triage pass, a handoff, or a closure
  * do not write a chat-only note
  * set `{{artifact_kind}}` to `coordination`
  * set `{{artifact_subject}}` to the decision or lane of this coordination
  * run [Start MDScript Running Log](../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log) to start a durable MDScript artifact
  * after each decision
    * run [Log Progress](../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) to keep the coordination state through a lost or compacted context

* run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)

* set `{{goal_mdscript}}` to the written goal path

* when a coordinator turn resumes
  * run `/mdscript-exec {{goal_mdscript}}#resume-goal` first
  * refresh the live tracker/MR/PR/CI/review state
  * execute only the hot-path action that changed

* do not use `{{goal_mdscript}}` to skip current source truth, live tracker state, current CI, current discussions, or current proof artifacts

## Monitor Implementer Lane

* run [Monitor Implementer Lane](workflows/monitor-implementer-lane.mdscript.md#monitor-implementer-lane)

## Monitor Child Orchestrator

* run [Monitor Child Orchestrator](workflows/monitor-child-orchestrator.mdscript.md#monitor-child-orchestrator)

## Handle Worker Exec Jump

* run [Handle Worker Exec Jump](workflows/handle-worker-exec-jump.mdscript.md#handle-worker-exec-jump)

## Create MR Comment Watcher

* run [Create MR Comment Watcher](workflows/mr-comment-watcher.mdscript.md#create-mr-comment-watcher)

## Confirm Implementer Completion Gates

* run [Confirm Implementer Completion Gates](workflows/completion-gates.mdscript.md#confirm-implementer-completion-gates)

## Handle Merge Or Close Decision

* run [Handle Merge Or Close Decision](workflows/merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)

## Report

* run [Report Status](../self-common/workflows/report-boundary.mdscript.md#report-status)

* while active coordination remains
  * include the active goal MDScript path, the next `/mdscript-exec {{goal_mdscript}}#resume-goal` command, and the next owner

## Stop At Boundary

* if a DBC proof precondition is missing
  * report `Blocked for {{claim_scope}}: {{blocker}}`
* if no claim scope exists
  * report the exact missing permission, evidence, resource, source truth, safe target, watcher, or worker state

* run [Report Stop To File Comments](../self-common/workflows/file-task-comments.mdscript.md#report-stop-to-file-comments)

* after reviewer consensus or a different terminal source-health state
  * immediately write the final parent-visible file comment of the root task
  * include the exact stop-report fields `stop_reason=done`, `next_owner=none`, `proof_supplied=...`, `proof_not_claimed=...`, `remaining_authority_boundary=...`, `cleanup_status=...`, and `blocker=...`
  * do not start a broader readiness pass or a duplicate final report
  * stop

* before you claim that the root, child, or watched lane is terminal or superseded
  * run [Cleanup Created Threads](../self-common/workflows/thread-cleanup.mdscript.md#cleanup-created-threads) for each chat thread that this orchestrator created or inherited with cleanup ownership

* if this is a child orchestrator
  * before you stop, report the stop reason, blocker, next owner, and exact continuation jump to `{{parent_agent}}` or `{{parent_reporting_path}}`

* before you ask the user, a repository owner, or a different authority surface for input
  * run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `stop-at-boundary`
* ask the smallest decision-ready question that is necessary to continue
* do not replace missing evidence with confidence
