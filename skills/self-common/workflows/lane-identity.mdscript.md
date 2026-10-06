<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Assign Lane Identity

* record the real `{{thread_id}}` from the thread tool, and `{{gitlab_sudo_alias}}` if one exists, in the lane ledger
* the alias can be the key that people see, but it never replaces the thread id
* set `{{thread_title}}` to `<role>: [<ticket, issue, PR, or no-issue>] <short description>`
* for tracker work, start the title and the branch name with the ticket key
* do not invent a ticket key
  * if none exists, stop and report that a tracker item must exist first
* return to the caller
