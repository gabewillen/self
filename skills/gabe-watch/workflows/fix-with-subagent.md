<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Dispatch Fixes

* if `{{pending_fixes}}` is empty
  * return to the caller
* group non-overlapping easy fixes into parallel waves; keep overlapping hard fixes serial
* for each fix item in the current wave
  * if `difficulty` is `easy`
    * set `{{fix_model}}` to `{{easy_model}}` (`composer-2.5-fast`)
  * if `difficulty` is `hard`
    * set `{{fix_model}}` to `{{hard_model}}` (`cursor-grok-4.5-high-fast`)
  * [Spawn Fixer](#spawn-fixer)
* wait for the wave to finish
* run [Apply And Verify](#apply-and-verify)
* run [Resolve Threads](#resolve-threads)
* clear completed items from `{{pending_fixes}}`
* if `{{pending_fixes}}` still has items
  * [Dispatch Fixes](#dispatch-fixes)
* return to the caller

## Spawn Fixer

* spawn one readonly-unless-editing `generalPurpose` Task subagent with `model="{{fix_model}}"` and `run_in_background=true`
* give the subagent only:
  * `{{repo_root}}`
  * `{{pr_url}}` and `{{head_ref}}`
  * the single fix summary, path, thread id or CI check name
  * instruction to make the minimal scoped change
  * instruction to run the smallest relevant verification command
  * instruction to return diff summary, commands run, and whether the original finding is fixed or invalid
* do not give the subagent other threads' conclusions
* record the subagent id in `{{fixer_ids}}`
* return to the caller wave

## Apply And Verify

* integrate returned edits on `{{head_ref}}`
* if two fixers touched the same files incompatibly
  * keep the harder-model result when one was hard, otherwise re-dispatch a single hard-model fixer for the conflicted paths
* run the smallest relevant tests or lint for the touched paths
* if verification fails
  * append a hard `{{pending_fixes}}` item describing the regression
  * return to the caller
* commit the verified fix without asking — arming the watch is the standing grant to commit, push, reply, resolve, and rerun on `{{head_ref}}`; use a concise message focused on why
* push `{{head_ref}}` without force
* return to the caller

## Resolve Threads

* for each review fix that landed and verified
  * reply on the thread with what changed (commit SHA or summary) when a reply helps reviewers
  * mark the GitHub review thread resolved with `gh api graphql` (`resolveReviewThread`) or the equivalent REST flow
* for CI fixes
  * re-watch the check until it leaves the failed state or the next tick picks it up
* do not resolve threads that were classified `disagree`, `question`, or `out_of_scope`
* return to the caller
