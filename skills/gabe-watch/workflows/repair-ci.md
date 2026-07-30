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
* if a failure is clearly unrelated to this PR and the branch is still behind
  * run [Sync Branch](sync-branch.md#sync-branch) once more
  * return to the caller after sync so the next tick can re-evaluate
* build `{{pending_fixes}}` entries for in-scope failures with:
  * `kind` = `ci`
  * `summary` = failing check + root-cause hypothesis
  * `evidence` = log excerpt path or command
  * `difficulty` from [Classify Difficulty](../reference.md#classify-difficulty)
* if every failing check is out of scope or needs human authority
  * set `{{blocker}}` to CI failures need human decision: `{{ci_out_of_scope}}`
  * return to the caller
* return to the caller so [Dispatch Fixes](fix-with-subagent.md#dispatch-fixes) can spawn repair agents
