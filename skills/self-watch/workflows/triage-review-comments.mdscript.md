<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage Review Comments

* if `{{pending_fixes}}` is not set
  * set `{{pending_fixes}}` to an empty list
* load the unresolved review threads from `{{unresolved_threads}}`
* load the PR conversation comments from `{{pr_comments}}`
* load the review bodies from `{{review_bodies}}`
* in each tick, sort all three surfaces: inline threads, PR-level comments, and review bodies
* treat a request in the conversation as actionable, also when it is not an inline thread
* for each conversation comment or review body that is newer than the last tick
  * if it asks for a change inside `{{watch_grant}}`
    * append it to `{{pending_fixes}}` with `kind` = `conversation` and the author of the request
  * if it asks a question that this watch can answer from the current evidence
    * reply in the same conversation
  * if it names work outside `{{watch_grant}}`
    * record it for the tick report and do not act on it
* if there are no unresolved threads and no actionable conversation comments
  * return to the caller
* for each unresolved thread
  * read only the thread id, path, line, and comment bodies that are necessary for the action
  * skip bots that already marked the thread resolved
  * put the thread in one class: `valid_fix`, `disagree`, `question`, `nit`, `duplicate`, or `out_of_scope`
* for `disagree` findings, or unclear Bugbot/auto-review findings
  * before you act, compare the finding with the current code
  * if the finding is wrong or you are not sure
    * reply on the thread with a short explanation that is based on evidence
    * do not mark the thread resolved, unless these two conditions are true:
      * the platform must have an explicit resolve after a documented decline
      * the user granted that behavior
    * continue to the next thread
* if the class of a thread is not clear
  * if `{{skills_root}}` is empty and `{{skill_root}}` is set
    * set `{{skills_root}}` to the parent of `{{skill_root}}`
  * if `{{skills_root}}` is empty
    * if the directory `{{repo_root}}/skills` exists
      * set `{{skills_root}}` to `{{repo_root}}/skills`
  * run `/mdscript-exec {{skills_root}}/self/SKILL.md`
  * decide from the current code and the PR evidence, and do not send the decision to the user
* for `question` threads that must have a real human product judgment
  * reply with the question that blocks the work
  * do not resolve the thread
  * continue
* for `valid_fix` threads and actionable `nit` threads
  * append a `{{pending_fixes}}` item with:
    * `kind` = `review`
    * `thread_id`
    * `path`
    * `summary` = the requested change
    * `difficulty` from [Classify Difficulty](../reference.md#classify-difficulty)
* remove the duplicate items in `{{pending_fixes}}` that have the same path and intent
* return to the caller
