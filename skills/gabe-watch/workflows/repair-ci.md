<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Repair CI

* if `{{failing_checks}}` is empty
  * set `{{ci_status}}` to green-or-pending
  * return to the caller
* for each failing check in `{{failing_checks}}`
  * fetch the failed job log with `gh run view` / `gh api` for that check
  * classify whether the failure is caused by this PR's diff, base drift, flake, or infra
* if failures look like base drift and the branch was just synced
  * re-read the latest check state once before spawning a fixer
* if a failure requires changing CI workflow definitions only to make the check pass
  * do not edit workflows
  * record the check name in `{{ci_out_of_scope}}`
  * continue with other failures
* if a failure is a test, fixture, snapshot, or aggregator config the PR diff must update
  * treat it as in-scope fix work, not as a workflow-definition edit
* if scope is unclear for a failure
  * run `/mdscript-exec ~/.agents/skills/gabe/SKILL.md`
  * decide from the diff and the failure evidence
* if a failure is clearly unrelated to this PR and the branch is still behind
  * run [Sync Branch](sync-branch.md#sync-branch) once more
  * return to the caller
* append `{{pending_fixes}}` entries for each in-scope failure with `kind` = `ci`, summary, evidence, and `difficulty` from [Classify Difficulty](../reference.md#classify-difficulty)
* keep every in-scope failure on this tick even when other failures are out of scope
* do not defer an in-scope fix to a later tick
* do not ask whether to apply an in-scope fix
* if every failing check is out of scope or needs human authority
  * set `{{blocker}}` to CI failures need human decision: `{{ci_out_of_scope}}`
  * return to the caller
* return to the caller for [Dispatch Fixes](fix-with-subagent.md#dispatch-fixes)
