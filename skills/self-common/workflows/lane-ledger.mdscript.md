<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Maintain Lane Ledger

* keep durable lane state outside chat memory
* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* read [lane-ledger fields](../references/lane-ledger-fields.md)
* record each lane with all the durable lane record fields from that reference
* append the same lane state to `{{ledger_file}}` with [Maintain File Lane Ledger](file-task-comments.mdscript.md#maintain-file-lane-ledger)
  * if the append fails, stop and report the exact path and error
* record child orchestrators by Codex thread id and title
* do not record child orchestrators by subagent id
* if the scope has subtickets, record the parent lane as a child-orchestrator lane
  * these scopes include epics, milestones, projects, portfolios, and programs
  * these scopes also include parent tracker items and release trains
* let that child-orchestrator lane own its subticket ledger
* for active watcher and management state that an orchestrator owns, write `{{goal_mdscript}}` or write it again
* record the next `/mdscript-exec {{goal_mdscript}}#resume-goal` re-entry
  * do not record it if the lane is terminal, explicitly paused, or handed off to a different owner
* for an MR/PR monitor goal that an implementer owns, record these items:
  * the goal MDScript and the next resume or check state
  * the active-goal owner, or the automation id with a five-minute watcher expectation
  * keep these items while CI, checks, reviews, or discussions that are not resolved stay pending
* after compaction, resume, handoff, or a long interruption
  * [Rebuild Lane State](#rebuild-lane-state)
* examine each active lane for these values:
  * the owner, the parent agent, the state, the blocker, the next proof, and the next check
  * the local resource path for a claim that depends on a resource
  * the goal id, and the goal MDScript for a monitored or resumable lane
  * the re-entry point and the reporting path
* if an active lane does not have one of these values
  * audit the lanes before you create new lanes or claim scoped proof decisions
  * stop and report the incomplete lane ids
* if a terminal, paused, obsolete, blocked, interrupted, goal-terminal, or closed lane does not have `{{last_stop_report}}`
  * mark the lane ledger as incomplete
  * get a stop report that the parent can see before you archive, close, or delete the lane
  * do not mark the lane as cleanly handed off before that stop report exists
  * stop
* if a terminal or superseded lane has a created `{{thread_id}}` and does not have `{{cleanup_status}}`
  * run [Cleanup Created Threads](thread-cleanup.mdscript.md#cleanup-created-threads)
  * if the cleanup cannot finish
    * record an exact cleanup blocker before you claim a final status
    * stop
  * stop
* return to the caller

## Rebuild Lane State

* read the lane state again from the task, comment, plan, goal, and instruction MDScripts under `{{file_task_root}}`
* read the live threads, trackers, and PRs/MRs again
* find the current owner, the next action, and the proof decision again
* do this rebuild before you steer workers or report proof decisions
* if a rebuild source is not there
  * stop and report the exact task, comment, goal, or ledger path that is not there
* return to [Maintain Lane Ledger](#maintain-lane-ledger)
