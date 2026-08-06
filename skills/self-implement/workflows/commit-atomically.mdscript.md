<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Commit Atomically

* run `git status --porcelain` to list every dirty path in the working tree
* run `git diff` and `git diff --staged` to read the actual content of those changes
* group the dirty paths into one list per logical change under LOCAL-GIT-001
* set `{{commit_groups}}` to that list of logical changes
* set `{{commit_group}}` to the first group in `{{commit_groups}}` that is not yet committed
* if `{{commit_group}}` is empty
  * return to the caller with nothing left to commit
* [Stage One Logical Change](#stage-one-logical-change)

## Stage One Logical Change

* stage only the paths or hunks that belong to `{{commit_group}}`
* do not stage with `git add -A`, `git add .`, or `git commit -a` while any dirty path outside `{{commit_group}}` remains
* run `git diff --staged` to confirm the staged diff contains that logical change and nothing else
* if the staged diff carries formatting sweeps, drive-by refactors, dependency bumps, or unrelated fixes
  * unstage the paths or hunks that do not belong to `{{commit_group}}`
  * [Stage One Logical Change](#stage-one-logical-change)
* [Verify Commit Stands Alone](#verify-commit-stands-alone)

## Verify Commit Stands Alone

* identify the build, test, or check command that governs `{{commit_group}}`
* set `{{commit_check}}` to that command
* if `{{commit_check}}` is empty
  * record that no check governs this change on the file task
  * [Write Commit Message](#write-commit-message)
* run `{{commit_check}}` against the tree this commit would produce
* if `{{commit_check}}` fails
  * repair the change so the commit stands alone
  * [Stage One Logical Change](#stage-one-logical-change)
* [Write Commit Message](#write-commit-message)

## Write Commit Message

* write a subject that states the one logical change in `{{commit_group}}`
* write a body that states why the change was made and what it affects
* do not write `wip`, `fixup`, `oops`, `address review`, or `fix typo` as the message of a commit that will be pushed
* do not narrate the process, the agent, the session, or the order of edits in the message
* run `git commit` with that message
* [Commit Remaining Groups](#commit-remaining-groups)

## Commit Remaining Groups

* remove the committed group from `{{commit_groups}}`
* if `{{commit_groups}}` still holds an uncommitted group
  * set `{{commit_group}}` to the next group in `{{commit_groups}}`
  * [Stage One Logical Change](#stage-one-logical-change)
* run `git status --porcelain` to confirm no logical change was left uncommitted or half-staged
* if a checkpoint commit that will be pushed remains in the unpushed range
  * squash or amend it into the commit it belongs to before pushing
* do not rewrite commits that are already pushed to a shared branch
* return to the caller with the commits created
