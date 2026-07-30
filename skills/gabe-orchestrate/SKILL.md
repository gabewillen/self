---
name: gabe-orchestrate
description: "Coordinate project-scoped Gabe-shaped work from ~/.agents/projects/project-name/ as the root orchestrator on gpt-5.6 Sol with medium reasoning. Use for prioritization, delegation, child-orchestrator setup, MDScript tasks/comments/plans/goals/instructions, lane ledgers, DBC proof-decision intake, worker handoffs, hot-path events, GitLab aliasing, post-merge closure, publication decisions, and decision-ready reports. Preserve scoped proof decisions, goal re-entry, child-lane boundaries, and parent-visible stop reports."
---

<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Load Operating Context

* run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)

* run [Select Configured Model And Reasoning](../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `orchestrator`

* run [Resolve File Task Root](../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Read File Task Packet](../gabe-common/workflows/file-task-comments.md#read-file-task-packet) when a task file already exists for this lane

* run [Resolve Goal MDScript](../gabe-common/workflows/goal-mdscript.md#resolve-goal-mdscript)

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
  * for any long, multi-workstream, or goal-backed lane, write a parent-visible `context-limit` checkpoint comment and a separate `compaction-resume` file comment after the goal exists and before the next long phase or child fanout so the lane can rebuild state from task files, comments, goals, and the lane ledger before acting

* separate triage, local edits, public mutation, push, CI rerun or fix, merge, close, release, deployment, publication, and live-proof waiver authority

* if required authority is missing
  * set `{{blocker}}` to the exact missing permission
  * [Stop At Boundary](#stop-at-boundary)

* [Classify Work](#classify-work)

## Classify Work

* infer `{{objective}}`, `{{affected_system}}`, `{{tracker}}`, `{{repository}}`, `{{scope_shape}}`, `{{subtickets}}`, `{{done_state}}`, `{{claim_scope}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{missing_precondition}}`, `{{authority_needed}}`, `{{proof_needed}}`, `{{file_task_id}}`, `{{file_comment_path}}`, and `{{reporting_path}}`

* refresh the current source of truth before delegating or deciding

* when `~/.agents/projects/{{project_name}}/tasks` exists
  * treat task, comment, plan, goal, and instruction MDScripts plus `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` as the first source of truth for lane state
  * mirror to external trackers only after the file comment has been written
  * run [Classify File Workstream Fanout](../gabe-common/workflows/file-task-comments.md#classify-file-workstream-fanout) before choosing a direct implementer lane
  * run [Write Goal MDScript](../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript) before child-lane fanout or monitor ownership
  * add or refresh the parent-visible context checkpoint and resume comments before long child-lane fanout when resumed coordination may be needed

* if work is tied to Shipyard
  * use the ticket key prefix for worker title and branch names
  * do not invent a ticket key

* if this is a project control-plane workflow and the task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * create child-orchestrator file tasks for those workstreams before any direct root implementer
  * create or refresh one MDScript goal under `~/.agents/projects/{{project_name}}/goals` for the root orchestrator and each child orchestrator before any child implementer starts
  * each child orchestrator may create one bounded implementer task for its own scope
  * after the child task files and parent handoff comments exist, continue locally with single-process fallback when durable worker thread tooling is unavailable

* if the work is an epic, milestone, project, portfolio, program, parent tracker item, release train, or any scope with subtickets, child issues, child MRs, or independently owned objectives
  * [Create Child Orchestrator](#create-child-orchestrator)

* if the work is narrow non-code coordination, writing, triage, instruction, publication, or decision work that can be completed safely in the root
  * [Execute Coordinator Work](#execute-coordinator-work)

* if the work is one bounded execution lane with one primary repository, ticket, MR/PR, implementation objective, or verification boundary
  * [Create Implementer Lane](#create-implementer-lane)

* if the work spans multiple repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives that need their own lane ledger
  * [Create Child Orchestrator](#create-child-orchestrator)

* if another direct lane would put this orchestrator above five active direct lanes
  * [Create Child Orchestrator](#create-child-orchestrator)

* in a project control-plane workflow, once required child orchestrator and implementer task files exist, execute locally authorized implementer work through [Use Single Process Fallback](../gabe-common/workflows/file-task-comments.md#use-single-process-fallback) rather than waiting for unavailable workers

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

* use this table for goal resumes, worker stop reports, child-orchestrator reports, MR/PR state changes, CI terminal state, and reviewer verdict intake before reloading longer workflow detail

* refresh live MR/PR, tracker, CI, discussion, reviewer, and lane-ledger state on every goal resume; do not refresh Agent Adventures context on every resume when a current goal MDScript already captures the lane context

* if the lane has `{{goal_mdscript}}`, execute `/mdscript-exec {{goal_mdscript}}#resume-goal` first; reread Agent Adventures only when the goal script is missing, stale, contradicted by a new human correction, or the lane scope/project changes

* after any hot-path state change, add a file comment on the affected task before updating chat or external trackers

| Signal | Exact trigger | Immediate action | Required `event_exec` | Goal update | Ledger update | Stop/report condition |
| --- | --- | --- | --- | --- | --- | --- |
| `TARGET_DRIFT` | MR/PR base, tested target, or recorded target head differs from the current integration target | Interrupt old-target proof; send owner to refresh/rebase/merge target within one goal cycle or report exact blocker | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift` | Update `{{goal_mdscript}}` with old target, current target, owner, deadline, and blocker if any | Record `event_exec`, old target, current target, current head, owner, deadline, and blocker if any | Report event to parent/root before stopping; if refresh cannot proceed, report `Blocked for {{claim_scope}}` with exact blocker |
| `STALE_MR` | No head movement after explicit target-consume, rebase, merge-target refresh, or source-refresh instruction | Stop accepting repeated old-head proof; require owner to report blocker path, dirty state, conflict, failed command, missing authority, or thread failure | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr` | Keep the goal active at interrupt cadence until new head or exact blocker appears | Record `event_exec`, requested refresh, last observed head, expected target head, attempts, owner, and blocker | Report to parent/root before stopping or waiting; do not downgrade to routine polling |
| `HANDOFF_UNACKED` | Priority instruction has no acknowledgment, output, or blocker after one goal cycle | Escalate to parent/root; reissue with deadline, reassign owner, or record explicit wait reason | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked` | Update the goal with ack/output/blocker deadline and escalation path | Record `event_exec`, instruction, owner, last contact, deadline, escalation path, and next owner | Child reports escalation to parent before stopping; parent denies, reassigns, or sets deadline |
| `DISPOSITION_READY` | Current target, exact-head CI green, one fresh current-target `Proven` review, and no unresolved discussions | Start merge/closure/disposition workflow immediately or record explicit root denial | `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready` | Mark routine proof polling complete in the goal; track only disposition outcome, denial, or new drift | Record `event_exec`, head, CI id, reviewer id/grade, discussion state, disposition owner, and authority | Report to root/parent; do not stop until disposition starts or root denial is recorded |
| CI terminal green/fail | Exact-head CI/check suite reaches terminal success or failure | Green: re-evaluate reviews and discussions for `DISPOSITION_READY`; fail: classify source-health/CI-repair and send owner to repair unless only default-branch merge is blocked | None by itself; use `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready` only when all disposition preconditions also hold | Record pipeline/check id, exact head, failed job names, retry/rerun availability, and next check time | Record `ci_state`, exact head, proof scope affected, repair owner, and default-branch merge blocker state | Report changed state if it enables disposition, blocks assigned claim, needs authority, or changes next owner |
| Reviewer `Proven`/`Not ready` | Fresh reviewer grade arrives for the current target and exact head | `Proven`: preserve scoped verdict; check whether aggregate state creates `DISPOSITION_READY`; `Not ready`: send implementer exact remediation or keep GitLab thread unresolved | None by itself; use `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready` only when aggregate gates are complete | Watch remediation acknowledgment within one watcher cycle; watch for new reviewer grade after repair | Record reviewer id/alias, grade, proof scope, head, target, findings, questions, and GitLab note/thread ids | Reviewer reports to spawning parent before stopping; orchestrator reports aggregate state change to parent/root |

## Create Task Local MDScript

* after the required first context read for a lane, create or require a lane-local goal MDScript when the lane will be monitored, resumed, or handed across agents

* run [Write Goal MDScript](../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)

* resumed coordinator turns should target `{{goal_mdscript}}#resume-goal` first, then refresh live tracker/MR/PR/CI/review state and execute only the hot-path action that changed

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

## Publish Durable Context

* run [Publish Durable Context](../gabe-common/workflows/publish-durable-context.md#publish-durable-context)

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
