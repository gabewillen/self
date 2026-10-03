<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Review Baseline

* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)

* find `{{review_key}}` from `{{task_id}}`, the tracker key, the PR or MR number, or the current branch name, in that order

* change `{{review_key}}` to a stable, lowercase, path-safe slug

* if `{{review_key}}` is empty
  * set `{{review_key}}` to the normalized source repository basename

* if `{{project_home}}` is empty
  * if `{{repo_root}}` or `{{source_repo_root}}` is set
    * run [Resolve Agent Home](../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* if `{{review_baseline_dir}}` is empty and `{{project_home}}` is set
  * set `{{review_baseline_dir}}` to `{{project_home}}/artifacts/review-baselines`
* if `{{review_baseline_dir}}` is empty and `{{artifact_dir}}` is set
  * set `{{review_baseline_dir}}` to `{{artifact_dir}}/review-baselines`
* if `{{review_baseline_dir}}` does not exist
  * create `{{review_baseline_dir}}`
* set `{{review_baseline_file}}` to `{{review_baseline_dir}}/{{review_key}}.mdscript.md`

* set `{{source_worktree_root}}` to the canonical Git top-level path of `{{source_repo_root}}`

* set `{{source_git_directory}}` to the absolute worktree-specific Git directory of `{{source_repo_root}}`

* set `{{source_git_common_directory}}` to the absolute Git common directory of `{{source_repo_root}}`

* set `{{source_repository_identity}}` to `{{source_worktree_root}}|{{source_git_directory}}|{{source_git_common_directory}}`

* if `{{review_skill_root}}` is empty and `{{skills_root}}` is set
  * set `{{review_skill_root}}` to `{{skills_root}}/self-review`
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to this skill's absolute directory
* run `{{review_skill_root}}/scripts/review-snapshot` from `{{source_repo_root}}`
  * if it fails
    * set `{{blocker}}` to the snapshot command
    * [Snapshot Failed](#snapshot-failed)

* set `{{current_review_tree}}` to the returned tree SHA

* find `{{merge_base}}` from `{{merge_target}}` and the current branch head
  * if this fails
    * set `{{blocker}}` to the unresolved merge target
    * [Merge Base Failed](#merge-base-failed)

* if `{{review_phase}}` is `final-cumulative`
  * set `{{review_mode}}` to `final-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{review_baseline_file}}` does not exist
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* read `{{reviewed_source_repo_root}}`, `{{reviewed_tree}}`, `{{reviewed_merge_target}}`, `{{reviewed_merge_base}}`, and `{{reviewed_repository_identity}}` from `{{review_baseline_file}}`

* if `{{reviewed_source_repo_root}}` is empty or is not available
  * set `{{baseline_reset_reason}}` to `missing-reviewed-worktree`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* change `{{reviewed_source_repo_root}}` to an absolute canonical path

* if `{{reviewed_source_repo_root}}` is different from `{{source_worktree_root}}`
  * set `{{baseline_reset_reason}}` to `source-worktree-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{reviewed_repository_identity}}` is different from `{{source_repository_identity}}`
  * set `{{baseline_reset_reason}}` to `source-repository-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{reviewed_merge_target}}` is different from `{{merge_target}}`
  * set `{{baseline_reset_reason}}` to `merge-target-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* if `{{reviewed_merge_base}}` is different from `{{merge_base}}`
  * set `{{baseline_reset_reason}}` to `merge-base-drift`
  * set `{{review_mode}}` to `initial-cumulative`
  * [Build Review Diff](#build-review-diff)

* run `git rev-parse --verify {{reviewed_tree}}^{tree}` from `{{source_repo_root}}`
  * if it fails
    * set `{{baseline_reset_reason}}` to `unreachable-reviewed-tree`
    * [Reset Review Baseline](#reset-review-baseline)

* set `{{review_mode}}` to `repair-delta`

* [Build Review Diff](#build-review-diff)

## Reset Review Baseline

* set `{{review_mode}}` to `initial-cumulative`

* [Build Review Diff](#build-review-diff)

## Snapshot Failed

* report `Blocked for {{proof_scope}}: unable to snapshot the current Git worktree` with `{{blocker}}`
* stop

## Merge Base Failed

* report `Blocked for {{proof_scope}}: unable to resolve the cumulative review boundary` with `{{blocker}}`
* stop

## Build Review Diff

* if `{{review_mode}}` is `repair-delta`
  * run `git diff {{reviewed_tree}} {{current_review_tree}}` from `{{source_repo_root}}`
    * if it fails
      * set `{{blocker}}` to the failed rolling diff
      * [Review Diff Failed](#review-diff-failed)
  * set `{{review_diff_scope}}` to `changes since the last completed review snapshot`

* if `{{review_mode}}` is `initial-cumulative` or `final-cumulative`
  * run `git diff {{merge_base}} {{current_review_tree}}` from `{{source_repo_root}}`
    * if it fails
      * set `{{blocker}}` to the failed cumulative diff
      * [Review Diff Failed](#review-diff-failed)
  * set `{{review_diff_scope}}` to `the complete current change against the merge target`

* set `{{review_diff}}` to the command output

* if `{{review_diff}}` is empty
  * set `{{stop_reason}}` to `review-complete`
  * report that no changed source exists for `{{review_diff_scope}}`
  * stop

* include `{{review_mode}}`, `{{review_diff_scope}}`, `{{merge_target}}`, `{{merge_base}}`, and `{{current_review_tree}}` in the neutral review packet
* if `{{reviewed_tree}}` is set, include `{{reviewed_tree}}` in the neutral review packet

* include only the neutral contracts, current task state, unresolved requirements, and adjacent source that explain `{{review_diff}}`

* do not include a previous reviewer verdict, finding narrative, or author repair narrative in the blind packet

* return to the review workflow that called this workflow

## Review Diff Failed

* report `Blocked for {{proof_scope}}: unable to build {{review_diff_scope}}` with `{{blocker}}`
* stop

## Record Completed Review Snapshot

* make sure that the reviewer returned a scoped grade and a stop report before you advance the baseline

* create `{{review_baseline_file}}` from [Review Baseline Template](../assets/review-baseline.mdscript.md)

* record `{{project_name}}`, `{{task_id}}`, `{{proof_scope}}`, `{{review_key}}`, and `{{review_round}}`
* record `{{source_worktree_root}}` as `reviewed_source_repo_root`
* record `{{source_repository_identity}}` as `reviewed_repository_identity`
* record `{{current_review_tree}}` as `reviewed_tree`
* record `{{review_mode}}`, `{{blocking_severities}}`, `{{residual_findings}}`, `{{merge_target}}`, and `{{merge_base}}`
* record the reviewer identity, `{{required_model}}`, `{{required_reasoning}}`, and `{{model_selection_basis}}`
* record the scoped proof decision and the completion time

* in the `## Resume` section, write `/mdscript-exec {{review_skill_root}}/workflows/rolling-code-review.mdscript.md#resolve-review-baseline`

* if the baseline write fails
  * set `{{blocker}}` to the failed baseline file and write operation
  * [Baseline Write Failed](#baseline-write-failed)

* return to the review workflow that called this workflow

## Baseline Write Failed

* do not say that the rolling review state is durable

* report `Blocked for {{proof_scope}}: unable to persist the completed review baseline` with `{{blocker}}`
* stop

## Require Final Cumulative Review

* if `{{review_mode}}` is `initial-cumulative` and `{{blocking_findings}}` is empty
  * set `{{final_cumulative_review}}` to `proven`
  * return to the review workflow that called this workflow

* if `{{review_mode}}` is `repair-delta` and `{{blocking_findings}}` is empty
  * set `{{review_phase}}` to `final-cumulative`
  * tell the caller to start one fresh final cumulative round
  * return to the workflow that called this workflow

* if `{{review_mode}}` is `final-cumulative` and `{{blocking_findings}}` is empty
  * set `{{final_cumulative_review}}` to `proven`
  * return to the review workflow that called this workflow

* return to the review workflow that called this workflow
