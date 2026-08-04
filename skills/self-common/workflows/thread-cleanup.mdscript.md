<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Cleanup Created Threads

* treat every chat thread, child-orchestrator thread, worker thread, reviewer subagent, or reviewer thread created by this lane as owned cleanup state
* record each created thread or subagent in `{{ledger_file}}` or `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with `thread_id`, exact reviewer or worker `author` when applicable, `owner_role`, `parent_agent`, `parent_reporting_path`, `phase`, `stop_reason`, `last_stop_report`, and `cleanup_status`
* list every created child chat that is terminal or superseded
* before a lane stops as `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, `watcher-terminal`, or `review-complete`, close, archive, delete, or mark transferred each listed terminal or superseded child chat
* prefer `multi_agent_v1.close_agent` for subagents and completed review workers
* prefer the active thread-management tool's archive or close operation for durable Codex chat threads
* avoid deleting user-visible or evidence-bearing threads unless the user explicitly granted deletion authority
* if a created thread remains open because work is still active, transferred, waiting on authority, or intentionally durable
  * record the new owner, next check, goal MDScript, and parent reporting path
  * do not claim cleanup complete for that thread
* if a created thread is superseded by a newer lane
  * [Supersede Created Thread](#supersede-created-thread)
* when cleaning up reviewers, put one exact reviewer file-comment `author` and one exact `thread_id` or subagent id per reviewer in the literal `cleanup_status=...` field
* separate reviewer cleanup entries with semicolons
* reject labels such as `reviewer A`, `round 2`, `both reviewers closed`, placeholder ids, shared ids, or one id for multiple reviewers
* for live reviewer subagents or reviewer threads, match the cleanup id to the id recorded in the current parent-visible `review_round=start` comment
  * if the id was first invented in the cleanup comment, stop and report the missing start-comment id
* if cleanup tooling fails or is unavailable
  * [Record Cleanup Blocker](#record-cleanup-blocker)
* do not claim a satisfied review gate, child-lane completion, final source-health, disposition readiness, or clean handoff while any created terminal or superseded chat thread is still open without an explicit blocker and parent-visible cleanup report
* return to the caller

## Supersede Created Thread

* write a parent-visible stop report for the old lane
* mark the old goal and task as `obsolete` or `superseded`
* archive or close the old thread when tooling permits
  * if archive or close fails, [Record Cleanup Blocker](#record-cleanup-blocker)
* record the replacement thread id or file task id in the lane ledger
* return to [Cleanup Created Threads](#cleanup-created-threads)

## Record Cleanup Blocker

* write a parent-visible cleanup blocker with the exact thread id, intended cleanup action, failed command or missing tool, fallback owner, and next check
* append the cleanup blocker to the lane ledger
* stop and report `Blocked for {{claim_scope}}` with the cleanup blocker
