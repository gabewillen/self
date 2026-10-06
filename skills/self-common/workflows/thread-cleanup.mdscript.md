<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Cleanup Created Threads

* record each thread or subagent that this lane created in `{{ledger_file}}`
  * record `thread_id`, `author`, `owner_role`, `parent_reporting_path`, `phase`, `stop_reason`, and `cleanup_status`
* before the lane stops, close or archive each created thread that is terminal or superseded
  * close a subagent with the host close tool
  * do not delete a thread that the user can see or that holds evidence, unless the user allows it
* for a superseded thread, write its stop report, mark its goal and task `superseded`, and record the replacement id
* for a thread that stays open on purpose, record its new owner, next check, and goal
  * do not call its cleanup complete
* for reviewers, write `cleanup_status=` with one entry for each reviewer, separated by semicolons
  * each entry has the exact `author` and the exact thread or subagent id from the `review_round=start` comment
  * reject labels such as `reviewer A` and shared or placeholder ids
* if the close tool fails or is missing
  * write a parent-visible blocker with the thread id, the action, the failure, and the fallback owner
  * append it to the lane ledger
  * stop and report `Blocked for {{claim_scope}}`
* while a created thread stays open without a blocker, do not claim these:
  * a passed review gate, a complete child lane, or a clean handoff
* return to the caller
