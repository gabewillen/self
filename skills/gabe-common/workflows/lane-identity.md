<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Assign Lane Identity

* infer `{{lane_id}}`, `{{thread_id}}`, `{{thread_title}}`, `{{gitlab_sudo_alias}}`, `{{tracker}}`, `{{issue_or_mr}}`, `{{goal_id}}`, and `{{goal_mdscript}}` from the current lane and delegation

* use the GitLab sudo alias as the human-visible lane key when it helps track which role-owned thread is doing the work

* do not use the alias as a substitute for the actual Codex thread id

* store both `{{thread_id}}` and `{{gitlab_sudo_alias}}` in the lane ledger

* when an orchestrator creates or renames a Codex thread
  * set `{{thread_title}}` to `<role>: [<issue>] <description>`
  * use `orchestrator`, `implementer`, or `reviewer` as `{{role}}`
  * use the tracker key, issue id, MR/PR id, incident id, or `no-issue` as `{{issue}}`
  * keep `{{description}}` short, human-readable, and specific to the lane

* if a new thread is created
  * record the returned thread id exactly as the thread-management tool reports it
  * keep the thread title human-readable and, when tied to a tracker ticket, prefixed with the ticket key

* if the work is tied to Shipyard
  * use the ticket key prefix for worker title and branch names
  * do not invent a ticket key
