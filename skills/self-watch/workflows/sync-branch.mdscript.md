<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Sync Branch

* run `git -C {{repo_root}} status -sb`
* if the working tree is dirty with unrelated local edits
  * set `{{blocker}}` to dirty working tree blocks safe sync
  * return to the caller
* checkout `{{head_ref}}` in `{{repo_root}}`
* fetch `origin/{{base_ref}}` and `origin/{{head_ref}}`
* run `git -C {{repo_root}} rev-list --left-right --count origin/{{base_ref}}...HEAD`
* if the branch is not behind `origin/{{base_ref}}`
  * set `{{sync_status}}` to up-to-date
  * return to the caller
* merge `origin/{{base_ref}}` into `{{head_ref}}` preserving the PR intent
* if the merge conflicts
  * attempt an intelligent conflict resolution that keeps both intents when compatible
  * if intents conflict or resolution is ambiguous
    * abort the merge
    * set `{{blocker}}` to merge conflict needs human judgment
    * return to the caller
* run the repo's cheapest relevant verification for the sync (lint or targeted tests when obvious)
* if verification fails after sync
  * set `{{pending_fixes}}` to include a hard CI-style fix for the sync regression
  * do not push yet
  * return to the caller
* push `{{head_ref}}` with a normal fast-forward or merge commit push (never force-push unless the user explicitly granted it for this watch)
* set `{{sync_status}}` to synced
* refresh `{{head_sha}}`
* return to the caller
