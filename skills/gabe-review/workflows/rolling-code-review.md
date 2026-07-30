<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Review Baseline

* run [Resolve File Task Root](../../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* infer `{{review_key}}` from `{{task_id}}`, tracker key, PR or MR number, or current branch name in that order

* normalize `{{review_key}}` to a stable lowercase path-safe slug

* if `{{review_key}}` is empty
  * set `{{review_key}}` to the normalized source repository basename

* create `{{artifact_dir}}/review-baselines` when it does not exist

* set `{{review_baseline_file}}` to `{{artifact_dir}}/review-baselines/{{review_key}}.mdscript.md`

* resolve `{{source_worktree_root}}` from the canonical Git top-level path for `{{source_repo_root}}`

* resolve `{{source_git_directory}}` from the absolute worktree-specific Git directory for `{{source_repo_root}}`

* resolve `{{source_git_common_directory}}` from the absolute Git common directory for `{{source_repo_root}}`

* set `{{source_repository_identity}}` to `{{source_worktree_root}}|{{source_git_directory}}|{{source_git_common_directory}}`

* run `{{repo_root}}/skills/gabe-review/scripts/review-snapshot` from `{{source_repo_root}}`
  * if it fails, set `{{blocker}}` to the snapshot command and [Snapshot Failed](#snapshot-failed)

* set `{{current_review_tree}}` to the returned tree SHA

* resolve `{{merge_base}}` from `{{merge_target}}` and the current branch head
  * if resolution fails, set `{{blocker}}` to the unresolved merge target and [Merge Base Failed](#merge-base-failed)

* if `{{review_phase}}` is `final-cumulative`
  * set `{{review_mode}}` to `final-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{review_baseline_file}}` does not exist
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* read `{{reviewed_source_repo_root}}`, `{{reviewed_tree}}`, `{{reviewed_merge_target}}`, `{{reviewed_merge_base}}`, and `{{reviewed_repository_identity}}` from `{{review_baseline_file}}`

* if `{{reviewed_source_repo_root}}` is empty or unavailable
  * set `{{baseline_reset_reason}}` to `missing-reviewed-worktree`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* resolve `{{reviewed_source_repo_root}}` to an absolute canonical path

* if `{{reviewed_source_repo_root}}` differs from `{{source_worktree_root}}`
  * set `{{baseline_reset_reason}}` to `source-worktree-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{reviewed_repository_identity}}` differs from `{{source_repository_identity}}`
  * set `{{baseline_reset_reason}}` to `source-repository-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{reviewed_merge_target}}` differs from `{{merge_target}}`
  * set `{{baseline_reset_reason}}` to `merge-target-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{reviewed_merge_base}}` differs from `{{merge_base}}`
  * set `{{baseline_reset_reason}}` to `merge-base-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* run `git rev-parse --verify {{reviewed_tree}}^{tree}` from `{{source_repo_root}}`
  * if it fails, set `{{baseline_reset_reason}}` to `unreachable-reviewed-tree` and [Reset Review Baseline](#reset-review-baseline)

* set `{{review_mode}}` to `repair-delta`

* [Build Review Diff](#build-review-diff)

## Reset Review Baseline

* set `{{review_mode}}` to `initial-cumulative`

* [Build Review Diff](#build-review-diff)

## Snapshot Failed

* stop and report `Blocked for {{proof_scope}}: unable to snapshot the current Git worktree` with `{{blocker}}`

## Merge Base Failed

* stop and report `Blocked for {{proof_scope}}: unable to resolve the cumulative review boundary` with `{{blocker}}`

## Build Review Diff

* if `{{review_mode}}` is `repair-delta`
  * run `git diff {{reviewed_tree}} {{current_review_tree}}` from `{{source_repo_root}}`
    * if it fails, set `{{blocker}}` to the failed rolling diff and [Review Diff Failed](#review-diff-failed)
  * set `{{review_diff_scope}}` to `changes since the last completed review snapshot`

* if `{{review_mode}}` is `initial-cumulative` or `final-cumulative`
  * run `git diff {{merge_base}} {{current_review_tree}}` from `{{source_repo_root}}`
    * if it fails, set `{{blocker}}` to the failed cumulative diff and [Review Diff Failed](#review-diff-failed)
  * set `{{review_diff_scope}}` to `the complete current change against the merge target`

* set `{{review_diff}}` to the command output

* if `{{review_diff}}` is empty
  * set `{{stop_reason}}` to `review-complete`
  * stop and report that no changed source exists for `{{review_diff_scope}}`

* include `{{review_mode}}`, `{{review_diff_scope}}`, `{{merge_target}}`, `{{merge_base}}`, `{{reviewed_tree}}` when set, and `{{current_review_tree}}` in the neutral review packet

* include only the neutral contracts, current task state, unresolved requirements, and adjacent source needed to understand `{{review_diff}}`

* do not include a previous reviewer verdict, finding narrative, or author repair narrative in the blind packet

* return to the calling review workflow

## Review Diff Failed

* stop and report `Blocked for {{proof_scope}}: unable to build {{review_diff_scope}}` with `{{blocker}}`

## Record Completed Review Snapshot

* require the reviewer to return a scoped grade and stop report before advancing the baseline

* instantiate [Review Baseline Template](../assets/review-baseline.mdscript.md) at `{{review_baseline_file}}`

* record `{{project_name}}`, `{{task_id}}`, `{{proof_scope}}`, `{{source_worktree_root}}` as `reviewed_source_repo_root`, `{{source_repository_identity}}` as `reviewed_repository_identity`, `{{review_key}}`, `{{review_round}}`, `{{review_mode}}`, `{{blocking_severities}}`, `{{residual_findings}}`, `{{merge_target}}`, `{{merge_base}}`, `{{current_review_tree}}` as `reviewed_tree`, reviewer identity, `{{required_model}}`, `{{required_reasoning}}`, `{{model_selection_basis}}`, scoped proof decision, and completion time

* under `## Resume`, point to `/mdscript-exec {{repo_root}}/skills/gabe-review/workflows/rolling-code-review.md#resolve-review-baseline`

* if the baseline write fails
  * set `{{blocker}}` to the failed baseline file and write operation
  * [Baseline Write Failed](#baseline-write-failed)

* return to the calling review workflow

## Baseline Write Failed

* do not claim the rolling review state as durable

* stop and report `Blocked for {{proof_scope}}: unable to persist the completed review baseline` with `{{blocker}}`

## Require Final Cumulative Review

* if `{{review_mode}}` is `initial-cumulative` and `{{blocking_findings}}` is empty
  * set `{{final_cumulative_review}}` to `proven`
  * return to the calling review workflow

* if `{{review_mode}}` is `repair-delta` and `{{blocking_findings}}` is empty
  * set `{{review_phase}}` to `final-cumulative`
  * return to the calling workflow to start one fresh final cumulative round

* if `{{review_mode}}` is `final-cumulative` and `{{blocking_findings}}` is empty
  * set `{{final_cumulative_review}}` to `proven`
  * return to the calling review workflow

* return to the calling review workflow
