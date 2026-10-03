<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Repair CI

* if `{{failing_checks}}` is empty
  * set `{{ci_status}}` to green-or-pending
  * return to the caller
* for each failed check in `{{failing_checks}}`
  * get the failed job log for that check with `gh run view` / `gh api`
  * find the cause of the failure: the diff of this PR, base drift, flake, or infra
* if the failures look like base drift and the branch was synced a short time before
  * read the latest check state again one time before you spawn a fixer
* if the only fix for a failure is a change to the CI workflow definitions
  * do not edit the workflows
  * record the check name in `{{ci_out_of_scope}}`
  * continue with the other failures
* if a failure is in a test, fixture, snapshot, or aggregator config that the PR diff must change
  * treat it as fix work in scope, not as a workflow-definition edit
* if the scope of a failure is not clear
  * if `{{skills_root}}` is empty and `{{skill_root}}` is set
    * set `{{skills_root}}` to the parent of `{{skill_root}}`
  * if `{{skills_root}}` is empty
    * if the directory `{{repo_root}}/skills` exists
      * set `{{skills_root}}` to `{{repo_root}}/skills`
  * run `/mdscript-exec {{skills_root}}/self/SKILL.md`
  * decide from the diff and the failure evidence
* if a failure clearly has no relation to this PR and the branch is still behind
  * run [Sync Branch](sync-branch.mdscript.md#sync-branch) one more time
  * return to the caller
* for each failure in scope, append a `{{pending_fixes}}` entry with these fields:
  * `kind` = `ci`
  * the summary and the evidence
  * `difficulty` from [Classify Difficulty](../reference.md#classify-difficulty)
* keep each failure in scope on this tick, also when other failures are out of scope
* do not move a fix in scope to a later tick
* do not ask the user if you can apply a fix in scope
* if each failed check is out of scope or must have a human authority
  * set `{{blocker}}` to CI failures need human decision: `{{ci_out_of_scope}}`
  * return to the caller
* return to the caller for [Dispatch Fixes](fix-with-subagent.mdscript.md#dispatch-fixes)
