<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Commit Atomically

* read `git status --porcelain`, `git diff`, and `git diff --staged`
* group the dirty paths into one group for each logical change (LOCAL-GIT-001)
* for each group:
  * stage only its paths or hunks, never `git add -A`, `git add .`, or `git commit -a` over a mixed tree
  * make sure that `git diff --staged` holds that change and nothing else
  * run the check that governs it on the tree that this commit makes, and repair the change if it fails
  * commit with a subject that states the change and a body that says why
  * do not write `wip`, `fixup`, `oops`, or process narration in a message that you will push
* make sure that nothing stays uncommitted or half-staged
* squash checkpoint commits before the push, and never rewrite commits on a shared branch
* return to the caller
