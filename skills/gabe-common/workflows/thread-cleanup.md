<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Cleanup Created Threads

* treat every chat thread, child-orchestrator thread, worker thread, reviewer subagent, or reviewer thread created by this lane as owned cleanup state

* record each created thread or subagent in `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with `thread_id`, exact reviewer or worker `author` when applicable, `owner_role`, `parent_agent`, `parent_reporting_path`, `phase`, `stop_reason`, `last_stop_report`, and `cleanup_status`

* before a lane stops as `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, `watcher-terminal`, or `review-complete`, close, archive, delete, or mark transferred all child chats it created that are terminal or superseded

* use the least destructive cleanup action available:
  * use `multi_agent_v1.close_agent` for subagents and completed review workers
  * use the active thread-management tool's archive or close operation for durable Codex chat threads
  * avoid deleting user-visible or evidence-bearing threads unless the user explicitly granted deletion authority

* if a created thread remains open because work is still active, transferred, waiting on authority, or intentionally durable, record the new owner, next check, goal MDScript, and parent reporting path before stopping

* if a created thread is superseded by a newer lane, write a parent-visible stop report for the old lane, mark the old goal/task as `obsolete` or `superseded`, archive or close the old thread when tooling permits, and record the replacement thread id or file task id

* do not claim a satisfied review gate, child-lane completion, final source-health, disposition readiness, or clean handoff while any created terminal or superseded chat thread is still open without an explicit blocker and parent-visible cleanup report

* when cleaning up reviewers, put one exact reviewer file-comment `author` and one exact `thread_id` or subagent id per reviewer in the literal `cleanup_status=...` field; separate reviewer cleanup entries with semicolons; labels such as `reviewer A`, `round 2`, `both reviewers closed`, placeholder ids, shared ids, or one id for multiple reviewers are not enough

* for live reviewer subagents or reviewer threads, the cleanup id must match the id recorded in the current parent-visible `review_round=start` comment; an id first invented in the cleanup comment is not enough proof

* if cleanup tooling fails or is unavailable, write a parent-visible cleanup blocker with the exact thread id, intended cleanup action, failed command or missing tool, fallback owner, and next check
