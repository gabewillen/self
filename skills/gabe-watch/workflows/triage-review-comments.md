<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage Review Comments

* set `{{pending_fixes}}` to an empty list when unset
* load unresolved review threads from `{{unresolved_threads}}`
* if there are no unresolved threads
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
* for `question` threads that need human product judgment
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
