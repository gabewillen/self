<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Child Orchestrator Thread

* create a child orchestrator when the delegated work is coordination work rather than a single bounded implementation lane

* run [Resolve File Task Root](../../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* use child orchestrators for epics, milestones, projects, portfolios, programs, parent tracker items, release trains, or any scope with subtickets, child issues, child MRs, or independently owned objectives

* use child orchestrators when work spans multiple repositories, ticket groups, product boundaries, release trains, incident areas, or independent objectives that need their own lane ledger

* use a child orchestrator when another direct lane would put this orchestrator above five active direct lanes

* in project control-plane workflows, when the parent task names multiple independent workstreams, create one child-orchestrator file task per workstream before any leaf implementer starts

* name child task ids from the parent task id plus the workstream slug, for example `<parent>-<workstream>-orchestrator`, and keep each child task's `parent` set to the parent task id

* each child orchestrator should create or own only the implementer lanes needed for its workstream; do not put unrelated workstreams into a shared child lane just because they share the same repository

* after delegating a subticket-owning scope, this parent orchestrator should orchestrate the child orchestrator, not the child orchestrator's leaf implementers

* search `~/.agents/projects/{{project_name}}/tasks` for an existing live child-orchestrator task for `{{affected_system}}`, repository group, ticket group, release train, incident area, or system boundary

* search for an existing live orchestrator Codex thread for the same boundary when thread tooling is available

* reuse an existing child orchestrator only when its file task already owns that coordination boundary and can keep its lane ledger clean

* create child orchestrators as durable file tasks first, and as durable Codex threads when the surface supports threads; do not use subagents as child orchestrators

* run [Select Configured Model And Reasoning](../../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `orchestrator` before creating, reusing, or handing off a child orchestrator

* do not substitute a multi-agent subagent for a child orchestrator, because child orchestrators need their own file task, MDScript goal, thread title when available, durable lane ledger, and resumable state

* set `{{role_thread_title}}` to `<role>: [<issue>] <description>`, using `orchestrator` for `{{role}}`, the tracker key, ticket group, MR/PR id, incident id, or `portfolio` for `{{issue}}`, and a short human description

* before creating a child orchestrator thread, use the available thread-management surface to list or search existing threads; when a new thread is required and tooling exists, create a new Codex thread in the right project or projectless scope

* before handing off, run [Ensure File Task](../../gabe-common/workflows/file-task-comments.md#ensure-file-task) for the child orchestrator with `type: child-orchestrator`

* before handing off, run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript) for the child orchestrator

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment) on the parent task with the child handoff contract

* create or resume the child orchestrator with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`

* record cleanup ownership for the created child thread in `~/.agents/projects/{{project_name}}/lane-ledger.jsonl`; the creating orchestrator owns archiving, closing, deletion when explicitly allowed, transfer, or cleanup-blocker reporting when that child thread is done or superseded

* if an existing child orchestrator cannot be verified or resumed with `{{required_model}}` and `{{required_reasoning}}` reasoning
  * set `{{blocker}}` to the model or reasoning mismatch
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for a different model, runner, or handoff decision, run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state

* if thread creation tooling is unavailable
  * continue with the child-orchestrator file task as the durable lane
  * record `thread_tooling: unavailable` in the file comment and lane ledger
  * run [Use Single Process Fallback](../../gabe-common/workflows/file-task-comments.md#use-single-process-fallback) when the child lane can be executed locally in the current run

* instruct the child coordinator to use `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/SKILL.md#load-operating-context`

* give the child coordinator systems or repositories, tracker scope, parent issue, file task id, file comment path, subticket inventory, authority boundaries, lane cap, required ledger fields, proof expectations, implementer-owned review expectations, watcher expectations, reporting cadence, parent agent, parent reporting path, escalation path, no-default-branch-merge limits, `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`

* require the child coordinator to report back to this parent before stopping for any reason, including done, blocked, paused, obsolete, interrupted, tool-failed, authority-boundary, context-limit, or watcher-terminal states

* require the child coordinator to create or maintain `{{goal_mdscript}}` after its first context read so child-owned resumes use `/mdscript-exec {{goal_mdscript}}#resume-goal` instead of rereading and narrating the full Gabe, event, watcher, and ledger context on every heartbeat

* require the child coordinator's orchestrator-owned management and watcher state to live in the goal MDScript while any owned lane is active, blocked, waiting, or carrying an open handoff

* require the child coordinator to report active lanes, blocked lanes, ready decisions, goal state, next proof, and exact authority needed

* require the child coordinator to clean up any worker, reviewer, or child chat threads it creates when those threads are terminal or superseded, and to report cleanup status to this parent before stopping

* require the child coordinator to execute and report the matching `{{event_exec}}` to this parent when `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR` conditions occur, using [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts)

* require the child coordinator to own subticket-to-implementer delegation, subticket lane ledgers, and subticket goal setup inside its scope

* keep this parent coordinator's ledger entry and file comments at the child-orchestrator level unless the child explicitly escalates a decision, permission, or proof boundary

* in a project control-plane workflow, do not stop after creating the child task when the child can immediately create its implementer task or execute a bounded local handoff; write the child role-switch comment and continue

* do not create a child orchestrator just to avoid doing a single bounded implementation lane

* update the ledger with [Maintain Lane Ledger](../../gabe-common/workflows/lane-ledger.md#maintain-lane-ledger)
