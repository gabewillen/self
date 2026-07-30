---
artifact_type: review-baseline
project_name: "{{project_name}}"
task_id: "{{task_id}}"
proof_scope: "{{proof_scope}}"
review_key: "{{review_key}}"
reviewed_source_repo_root: "{{source_worktree_root}}"
reviewed_repository_identity: "{{source_repository_identity}}"
reviewed_tree: "{{current_review_tree}}"
reviewed_merge_target: "{{merge_target}}"
reviewed_merge_base: "{{merge_base}}"
review_round: "{{review_round}}"
review_mode: "{{review_mode}}"
blocking_severities: "{{blocking_severities}}"
reviewer_identity: "{{reviewer_identity}}"
reviewer_model: "{{required_model}}"
reviewer_reasoning: "{{required_reasoning}}"
reviewer_model_selection_basis: "{{model_selection_basis}}"
proof_decision: "{{proof_decision}}"
completed_at: "{{completed_at}}"
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Current Snapshot

* treat `{{source_worktree_root}}` as the exact reviewed source worktree

* treat `{{current_review_tree}}` as the last tree inspected by a completed reviewer

* treat `{{merge_target}}` and `{{merge_base}}` as the cumulative review boundary

## Review Identity

* attribute round `{{review_round}}` to `{{reviewer_identity}}` with decision `{{proof_decision}}`

* bind `{{reviewer_identity}}` to model `{{required_model}}`, reasoning `{{required_reasoning}}`, and basis `{{model_selection_basis}}`

* record `{{blocking_severities}}` as the round threshold and preserve `{{residual_findings}}` as non-blocking findings

## Resume

* set `{{project_name}}` to the recorded `project_name`

* set `{{task_id}}` to the recorded `task_id`

* set `{{proof_scope}}` to the recorded `proof_scope`

* set `{{source_repo_root}}` to `{{source_worktree_root}}`

* set `{{review_key}}` to the recorded `review_key`

* set `{{merge_target}}` to the recorded `reviewed_merge_target`

* execute `/mdscript-exec {{repo_root}}/skills/gabe-review/workflows/rolling-code-review.md#resolve-review-baseline`

## Recovery

* if the reviewed tree, repository identity, merge target, or merge base cannot be verified, execute [Resume](#resume)
