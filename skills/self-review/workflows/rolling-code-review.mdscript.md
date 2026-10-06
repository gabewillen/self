<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Review Baseline

* set `{{review_key}}` to a path-safe slug of the first that exists:
  * the task id, tracker key, PR number, branch, or repository name
* if `{{project_home}}` is empty, run [Resolve Agent Home](../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{review_baseline_file}}` to `{{project_home}}/artifacts/review-baselines/{{review_key}}.mdscript.md`, and create its directory
* set `{{source_repository_identity}}` to `<worktree top level>|<git dir>|<git common dir>` of `{{source_repo_root}}`
* set `{{current_review_tree}}` to the tree SHA from `{{review_skill_root}}/scripts/review-snapshot`, run in `{{source_repo_root}}`
* set `{{merge_base}}` from `{{merge_target}}` and the branch head
* if the snapshot or the merge base fails, report `Blocked for {{proof_scope}}` with the failed command, and stop
* set `{{review_mode}}` to `repair-delta` only if all of these are true, otherwise `initial-cumulative`:
  * `{{review_phase}}` is not `final-cumulative`, and the baseline file exists
  * its worktree, repository identity, merge target, and merge base equal the current values
  * `git rev-parse --verify <reviewed_tree>^{tree}` passes
* if `{{review_phase}}` is `final-cumulative`, set `{{review_mode}}` to `final-cumulative`
* set `{{review_diff}}` to `git diff <reviewed_tree> {{current_review_tree}}` for `repair-delta`, or `git diff {{merge_base}} {{current_review_tree}}` otherwise
  * if the diff fails, report `Blocked for {{proof_scope}}`, and stop
  * if it is empty, report that nothing changed, set `{{stop_reason}}` to `review-complete`, and stop
* put the mode, the diff scope, the target, the merge base, and the trees in the packet
* add only neutral supporting source to the packet
* return to the caller

## Record Completed Review Snapshot

* after the reviewer returns a scoped grade and a stop report, write `{{review_baseline_file}}` from the [review baseline template](../assets/review-baseline.mdscript.md)
  * record the project, task, scope, key, round, worktree, repository identity, and `reviewed_tree`
  * record the mode, severities, residuals, target, merge base, reviewer, model, effort, and decision
  * end with `/mdscript-exec {{review_skill_root}}/workflows/rolling-code-review.mdscript.md#resolve-review-baseline`
* if the write fails, report `Blocked for {{proof_scope}}`, and do not claim a durable baseline
* return to the caller

## Require Final Cumulative Review

* if `{{blocking_findings}}` is empty and `{{review_mode}}` is `initial-cumulative` or `final-cumulative`, set `{{final_cumulative_review}}` to `proven`
* if `{{blocking_findings}}` is empty and `{{review_mode}}` is `repair-delta`, set `{{review_phase}}` to `final-cumulative` for one fresh final round
* return to the caller
