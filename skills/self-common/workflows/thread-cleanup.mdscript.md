<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Cleanup Created Threads

* mark each thread or subagent that this lane created as owned cleanup state
  * this includes chat threads, child-orchestrator threads, worker threads, reviewer subagents, and reviewer threads
* record each created thread or subagent in `{{ledger_file}}` or `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with these fields:
  * `thread_id`, and the exact reviewer or worker `author` if it applies
  * `owner_role`, `parent_agent`, `parent_reporting_path`, and `phase`
  * `stop_reason`, `last_stop_report`, and `cleanup_status`
* list each created child chat that is terminal or superseded
* before a lane stops with one of these reasons, close, archive, delete, or mark as transferred each listed child chat:
  * `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`
  * `authority-boundary`, `context-limit`, `watcher-terminal`, or `review-complete`
* for subagents and completed review workers, prefer `multi_agent_v1.close_agent`
* for durable Codex chat threads, prefer the archive or close operation of the active thread-management tool
* do not delete threads that the user can see or that hold evidence
  * this rule does not apply if the user explicitly gave the authority to delete
* if a created thread stays open because its work is active, transferred, waits on authority, or is durable on purpose
  * record the new owner, the next check, the goal MDScript, and the parent reporting path
  * do not claim that cleanup is complete for that thread
* if a newer lane supersedes a created thread
  * [Supersede Created Thread](#supersede-created-thread)
* for reviewer cleanup, write one entry for each reviewer in the literal `cleanup_status=...` field
  * each entry has one exact reviewer file-comment `author`
  * each entry has one exact `thread_id` or subagent id
* use semicolons between the reviewer cleanup entries
* reject labels such as `reviewer A`, `round 2`, or `both reviewers closed`
* reject placeholder ids, shared ids, and one id for more than one reviewer
* for live reviewer subagents or reviewer threads, examine the current `review_round=start` comment that the parent can see
  * make sure that the cleanup id agrees with the id in that comment
  * if the id occurs first in the cleanup comment, stop and report that the start-comment id is not there
* if the cleanup tool fails or is not available
  * [Record Cleanup Blocker](#record-cleanup-blocker)
* examine the created terminal or superseded chat threads for an open thread
  * an open thread with an explicit blocker and a cleanup report that the parent can see does not count
* while an open thread exists, do not claim these results:
  * a satisfied review gate or a child-lane completion
  * final source-health, disposition readiness, or a clean handoff
* return to the caller

## Supersede Created Thread

* write a stop report for the old lane that the parent can see
* mark the old goal and task as `obsolete` or `superseded`
* if the tool permits it, archive or close the old thread
  * if the archive or close operation fails, [Record Cleanup Blocker](#record-cleanup-blocker)
* record the replacement thread id or file task id in the lane ledger
* return to [Cleanup Created Threads](#cleanup-created-threads)

## Record Cleanup Blocker

* write a cleanup blocker that the parent can see, with these items:
  * the exact thread id and the intended cleanup action
  * the failed command or the tool that is not there
  * the fallback owner and the next check
* append the cleanup blocker to the lane ledger
* stop and report `Blocked for {{claim_scope}}` with the cleanup blocker
