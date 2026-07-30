<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage Review Comments

* set `{{pending_fixes}}` to an empty list when unset
* load unresolved review threads from `{{unresolved_threads}}`
* load PR conversation comments from `{{pr_comments}}`
* load review bodies from `{{review_bodies}}`
* triage all three surfaces every tick: inline threads, PR-level comments, and review bodies
* treat a request made in the conversation as actionable even when it is not an inline thread
* for each conversation comment or review body newer than the last tick
  * if it asks for a change inside `{{watch_grant}}`
    * append it to `{{pending_fixes}}` with `kind` = `conversation` and the requesting author
  * if it asks a question this watch can answer from current evidence
    * reply in the same conversation
  * if it names work outside `{{watch_grant}}`
    * record it for the tick report without acting
* if there are no unresolved threads and no actionable conversation comments
  * return to the caller
* for each unresolved thread
  * read only the thread id, path, line, and comment bodies needed to act
  * skip bots that already marked the thread resolved
  * classify the thread as `valid_fix`, `disagree`, `question`, `nit`, `duplicate`, or `out_of_scope`
* for `disagree` or ambiguous Bugbot/auto-review findings
  * validate against current code before acting
  * if the finding is wrong or unsure
    * reply on the thread with a short evidence-based explanation
    * do not mark resolved unless the platform requires an explicit resolve after a documented decline and the user granted that behavior
    * continue to the next thread
* if a thread's classification is unclear, run `/mdscript-exec ~/.agents/skills/gabe/SKILL.md` and decide from current code and PR evidence rather than escalating to the user
* for `question` threads that need genuine human product judgment
  * reply with the blocking question
  * leave unresolved
  * continue
* for `valid_fix` and actionable `nit` threads
  * append a `{{pending_fixes}}` item with:
    * `kind` = `review`
    * `thread_id`
    * `path`
    * `summary` = requested change
    * `difficulty` from [Classify Difficulty](../reference.md#classify-difficulty)
* dedupe pending fixes that share the same path and intent
* return to the caller
