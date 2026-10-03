<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Dispatch Fixes

* if `{{pending_fixes}}` is empty
  * return to the caller
* put easy fixes that do not overlap into parallel waves
* keep hard fixes that overlap in series
* for each fix item in the current wave
  * if `difficulty` is `easy`
    * set `{{fix_model}}` to `{{easy_model}}` and `{{fix_effort}}` to `{{easy_effort}}`
  * if `difficulty` is `hard`
    * set `{{fix_model}}` to `{{hard_model}}` and `{{fix_effort}}` to `{{hard_effort}}`
  * [Spawn Fixer](#spawn-fixer)
* wait until the wave is complete
* run [Apply And Verify](#apply-and-verify)
* run [Resolve Threads](#resolve-threads)
* remove the completed items from `{{pending_fixes}}`
* if `{{pending_fixes}}` still has items
  * [Dispatch Fixes](#dispatch-fixes)
* return to the caller

## Spawn Fixer

* spawn one readonly-unless-editing `generalPurpose` Task subagent with `model="{{fix_model}}"`, the effort level `{{fix_effort}}`, and `run_in_background=true`
* give the subagent only these items:
  * `{{repo_root}}`
  * `{{pr_url}}` and `{{head_ref}}`
  * the summary, path, thread id, or CI check name of the single fix
  * an instruction to make the smallest change in scope
  * an instruction to run the smallest related check command
  * an instruction to return a diff summary and the commands that it ran
  * an instruction to tell if the original finding is fixed or not valid
* do not give the subagent the conclusions of other threads
* record the subagent id in `{{fixer_ids}}`
* return to the caller wave

## Apply And Verify

* apply the returned edits to `{{head_ref}}`
* if two fixers changed the same files and the changes do not agree
  * if one fixer was hard
    * keep the result of the harder model
  * if no fixer was hard
    * dispatch one new hard-model fixer for the paths in conflict
* run the smallest related tests or lint for the changed paths
* if the check fails
  * append a hard `{{pending_fixes}}` item that tells about the regression
  * return to the caller
* commit the fix that passed the check, and do not ask the user
* the armed watch is the standing grant to commit, push, reply, resolve, and rerun on `{{head_ref}}`
* write a short commit message that tells why
* push `{{head_ref}}` without force
* return to the caller

## Resolve Threads

* for each review fix that landed and passed the check
  * if a reply helps the reviewers
    * reply on the thread with the change (the commit SHA or a summary)
  * mark the GitHub review thread resolved with `gh api graphql` (`resolveReviewThread`) or the equivalent REST flow
* for CI fixes
  * watch the check again until it is not in the failed state or until the next tick gets it
* do not resolve threads that have the class `disagree`, `question`, or `out_of_scope`
* return to the caller
