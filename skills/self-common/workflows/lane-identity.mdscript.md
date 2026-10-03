<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Assign Lane Identity

* find these values from the current lane and delegation:
  * `{{lane_id}}`, `{{thread_id}}`, `{{thread_title}}`, and `{{gitlab_sudo_alias}}`
  * `{{tracker}}`, `{{issue_or_mr}}`, `{{goal_id}}`, and `{{goal_mdscript}}`
* if the GitLab sudo alias helps to show which role-owned thread does the work
  * use the alias as the lane key that humans see
* do not use the alias in place of the actual Codex thread id
* store `{{thread_id}}` and `{{gitlab_sudo_alias}}` in the lane ledger
* if an orchestrator creates or renames a Codex thread
  * [Title Codex Thread](#title-codex-thread)
* if a new thread is created
  * record the returned thread id exactly as the thread-management tool reports it
  * keep the thread title easy for humans to read
  * if the thread is for a tracker ticket, start the thread title with the ticket key
* if the work is for Shipyard
  * use the ticket key prefix for the worker title and the branch names
  * do not invent a ticket key
  * if no ticket key exists, stop and report that you must find or create a tracker item first
* return to the caller

## Title Codex Thread

* set `{{role}}` to `orchestrator`, `implementer`, or `reviewer`
* set `{{issue}}` to the tracker key, issue id, MR/PR id, incident id, or `no-issue`
* set `{{description}}` to a short phrase for this lane that humans can read
* set `{{thread_title}}` to `<role>: [<issue>] <description>` with those values
* return to [Assign Lane Identity](#assign-lane-identity)
