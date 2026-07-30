<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Maintain Lane Ledger

* keep durable lane state outside chat memory

* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)

* record each lane with `{{lane_id}}`, `{{thread_id}}`, `{{thread_title}}`, `{{owner_role}}`, `{{parent_agent}}`, `{{parent_reporting_path}}`, `{{gitlab_sudo_alias}}`, `{{repository_or_system}}`, `{{issue_or_mr}}`, `{{referenced_tickets}}`, `{{agent_identities}}`, `{{phase}}`, `{{event_exec}}`, `{{event_type}}`, `{{event_deadline}}`, `{{stop_reason}}`, `{{last_stop_report}}`, `{{claim_scope}}`, contract preconditions, postconditions, invariants, proof path, local resource path, proof decision, proof supplied, proof not claimed, `{{next_proof}}`, `{{blocker}}`, `{{next_check_time}}`, `{{goal_id}}`, `{{goal_mdscript}}`, `{{context_snapshot}}`, `{{mdscript_reentry}}`, `{{return_script}}`, `{{return_resume_command}}`, `{{pending_exec_jump}}`, `{{reporting_path}}`, `{{cleanup_status}}`, and `{{cleanup_blocker}}`

* append the same lane state to `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with [Maintain File Lane Ledger](file-task-comments.md#maintain-file-lane-ledger)

* record child orchestrators by Codex thread id and title, never by subagent id

* for epics, milestones, projects, portfolios, programs, parent tracker items, release trains, or any scope with subtickets, record the parent lane as a child-orchestrator lane and let that child own its subticket ledger

* for active orchestrator-owned management and watcher state, write or refresh `{{goal_mdscript}}` and record the next `/mdscript-exec {{goal_mdscript}}#resume-goal` re-entry unless the lane is terminal, explicitly paused, or handed off to another owner

* for implementer-owned MR/PR monitor goals, record the goal MDScript, next resume/check state, and either the active-goal owner or the automation id with five-minute watcher expectation while CI, checks, reviews, or unresolved discussions are pending

* after compaction, resume, handoff, or long interruption
  * refresh lane state from task, comment, plan, goal, and instruction MDScripts under `~/.agents/projects/{{project_name}}/`, the lane ledger, live threads, trackers, and PRs/MRs before steering workers or reporting proof decisions

* if any active lane has unknown owner, parent agent, state, blocker, next proof, local resource path for a resource-dependent claim, next check, goal id, goal MDScript for a monitored or resumable lane, re-entry point, or reporting path
  * audit lanes before creating new lanes or claiming scoped proof decisions

* if any terminal, paused, obsolete, blocked, interrupted, goal-terminal, or closed lane lacks `{{last_stop_report}}`
  * treat the lane ledger as incomplete
  * require a parent-visible stop report before archiving, closing, deleting, or treating the lane as cleanly handed off

* if any terminal or superseded lane has a created `{{thread_id}}` and lacks `{{cleanup_status}}`
  * treat the lane ledger as incomplete
  * run [Cleanup Created Threads](thread-cleanup.md#cleanup-created-threads) or record an exact cleanup blocker before claiming final status
