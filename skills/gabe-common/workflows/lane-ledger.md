<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Maintain Lane Ledger

* keep durable lane state outside chat memory
* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)
* read [lane-ledger fields](../references/lane-ledger-fields.md)
* record each lane with the expanded durable lane record fields from that reference
* append the same lane state to `{{ledger_file}}` with [Maintain File Lane Ledger](file-task-comments.md#maintain-file-lane-ledger)
  * if the append fails, stop and report the exact path and error
* record child orchestrators by Codex thread id and title, never by subagent id
* for epics, milestones, projects, portfolios, programs, parent tracker items, release trains, or any scope with subtickets, record the parent lane as a child-orchestrator lane
* let that child-orchestrator lane own its subticket ledger
* for active orchestrator-owned management and watcher state, write or refresh `{{goal_mdscript}}`
* record the next `/mdscript-exec {{goal_mdscript}}#resume-goal` re-entry unless the lane is terminal, explicitly paused, or handed off to another owner
* for implementer-owned MR/PR monitor goals, record the goal MDScript, next resume/check state, and either the active-goal owner or the automation id with five-minute watcher expectation while CI, checks, reviews, or unresolved discussions are pending
* after compaction, resume, handoff, or long interruption
  * [Rebuild Lane State](#rebuild-lane-state)
* if any active lane has unknown owner, parent agent, state, blocker, next proof, local resource path for a resource-dependent claim, next check, goal id, goal MDScript for a monitored or resumable lane, re-entry point, or reporting path
  * audit lanes before creating new lanes or claiming scoped proof decisions
  * stop and report the incomplete lane ids
* if any terminal, paused, obsolete, blocked, interrupted, goal-terminal, or closed lane lacks `{{last_stop_report}}`
  * treat the lane ledger as incomplete
  * require a parent-visible stop report before archiving, closing, deleting, or treating the lane as cleanly handed off
  * stop
* if any terminal or superseded lane has a created `{{thread_id}}` and lacks `{{cleanup_status}}`
  * run [Cleanup Created Threads](thread-cleanup.md#cleanup-created-threads)
  * if cleanup still cannot finish
    * record an exact cleanup blocker before claiming final status
    * stop
  * stop
* return to the caller

## Rebuild Lane State

* refresh lane state from task, comment, plan, goal, and instruction MDScripts under `{{file_task_root}}`
* refresh live threads, trackers, and PRs/MRs
* rebuild the current owner, next action, and proof decision before steering workers or reporting proof decisions
* if rebuild sources are missing
  * stop and report the exact missing task, comment, goal, or ledger path
* return to [Maintain Lane Ledger](#maintain-lane-ledger)
