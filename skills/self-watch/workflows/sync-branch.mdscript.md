<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Sync Branch

* run `git -C {{repo_root}} status -sb`
* if the working tree has local edits that are not related to this PR
  * set `{{blocker}}` to dirty working tree blocks safe sync
  * return to the caller
* checkout `{{head_ref}}` in `{{repo_root}}`
* fetch `origin/{{base_ref}}` and `origin/{{head_ref}}`
* run `git -C {{repo_root}} rev-list --left-right --count origin/{{base_ref}}...HEAD`
* if the branch is not behind `origin/{{base_ref}}`
  * set `{{sync_status}}` to up-to-date
  * return to the caller
* merge `origin/{{base_ref}}` into `{{head_ref}}` and keep the intent of the PR
* if the merge has conflicts
  * try a careful conflict resolution that keeps the two intents when they agree
  * if the intents do not agree or the resolution is not clear
    * stop the merge
    * set `{{blocker}}` to merge conflict needs human judgment
    * return to the caller
* run the smallest related check for the sync in the repo (lint or targeted tests, if they are clear)
* if the check fails after the sync
  * add a hard CI-style fix for the sync regression to `{{pending_fixes}}`
  * do not push yet
  * return to the caller
* push `{{head_ref}}` with a normal fast-forward push or a merge commit push
* never force-push, unless the user gave an explicit grant for it for this watch
* set `{{sync_status}}` to synced
* get `{{head_sha}}` again
* return to the caller
