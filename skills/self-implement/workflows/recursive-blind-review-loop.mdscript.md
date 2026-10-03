<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Multi-Lane Review

* if `{{self_review_required}}` is empty
  * run [Decide Self Review](../../self-common/workflows/self-review-consent.mdscript.md#decide-self-review)
* if `{{self_review_required}}` is `false`
  * set `{{proof_decision}}` to empty for the review
  * do not spawn reviewers
  * return to the caller
* run the self-review **composition** in this implementer, or in the goal/orchestrator process that owns the lane
* never spawn a subagent whose job is `/self-review` or `mdscript-exec …/self-review/SKILL.md` as a whole skill
* allow only **per-lane** blind reviewers as review subagents
* make each review subagent execute one lane MDScript under `self-review/workflows/blind-reviewers/`
* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* if the reviewed work is a change in a Git worktree
  * set `{{merge_target}}` from the PR base, MR target, or default branch
  * if you cannot find the merge target, set `{{merge_target}}` to `main`
  * run [Resolve Review Baseline](../../self-review/workflows/rolling-code-review.mdscript.md#resolve-review-baseline)
  * decide `code changed` from the changed-path list in `{{review_diff}}`
  * do not decide it from the task narrative or from memory of the edits of this lane
* if code changed
  * set `{{review_cycle}}` to `recursive-code`
  * set `{{review_object}}` to `{{review_diff}}`
  * set `{{review_object_scope}}` to `{{review_diff_scope}}`
* if no code changed
  * set `{{review_cycle}}` to `single-non-code`
  * set `{{review_mode}}` to `single-non-code`
  * set `{{review_object}}` to the exact current non-code artifact set
  * set `{{review_object_scope}}` to `the exact current non-code change`
* set packet fields for `{{claim_scope}}`, `{{proof_claim}}`, contract preconditions, postconditions, invariants, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, and `{{authority_needed}}`
* include the current file task, unresolved file comments, and lane ledger entries
* do not use a preferred verdict as the frame
* run [Sync File Task Proof State](../../self-common/workflows/file-task-comments.mdscript.md#sync-file-task-proof-state)
* if the work created child-orchestrator lanes
  * before the root-level review, make sure each affected child has a parent-visible rollup stop comment and a terminal task state
  * make sure that each affected child has a lane-ledger rollup, a cleanup status, and a goal state that matches
* if a child rollup is absent
  * repair that child rollup
  * [Use Multi-Lane Review](#use-multi-lane-review)
* if a child-orchestrator task still says that an implementer is active, and the child status is `proven`
  * repair that stale durable state
  * [Use Multi-Lane Review](#use-multi-lane-review)
* do not lead reviewers with a preferred verdict, an implementation narrative, or the findings of a different reviewer
* run [Require GitLab Review Visibility](review-gitlab-visibility.mdscript.md#require-gitlab-review-visibility)
* before you count the review gate, make these items visible in file comments:
  * the grades, findings, questions, answers, and fix responses
  * the evidence links, cleanup state, and resolution
* run [Start Review Round](#start-review-round)

## Start Review Round

* increment `{{review_round}}`
* if `{{review_cycle}}` is `recursive-code` and `{{review_round}}` is `1`
  * set `{{blocking_severities}}` to `all findings`
* if `{{review_cycle}}` is `recursive-code` and `{{review_round}}` is `2`
  * set `{{blocking_severities}}` to `P1,P2`
* if `{{review_cycle}}` is `recursive-code` and `{{review_round}}` is `3` or greater
  * set `{{blocking_severities}}` to `P1`
* if `{{review_cycle}}` is `single-non-code`
  * set `{{blocking_severities}}` to `all findings`
* set `{{review_subagent_ids}}` to empty
* if `{{skills_root}}` is empty and `{{repo_root}}/skills` exists
  * set `{{skills_root}}` to `{{repo_root}}/skills`
* if `{{skills_root}}` is empty and `{{implement_skill_root}}` is set
  * set `{{skills_root}}` to the parent of `{{implement_skill_root}}`
* if `{{skills_root}}/self-review` exists
  * set `{{review_skill_root}}` to `{{skills_root}}/self-review`
* if `{{review_skill_root}}` is empty
  * set `{{blocker}}` to `self-review skill root missing; cannot compose multi-lane review`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* before you spawn lane reviewers, run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `reviewer`
* make sure that each lane reviewer from earlier rounds is closed, deleted, or archived
* if a lane reviewer from an earlier round is still open
  * set `{{blocker}}` to the open reviewer id and the cleanup action that is absent
  * close or delete each open lane reviewer from an earlier round
  * if you cannot close a lane reviewer from an earlier round
    * set `{{stop_reason}}` to `tool-failed`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* write or refresh the neutral review packet for this round from `{{review_object}}` and other neutral sources that support it
* run [Select Review Lanes](../../self-review/workflows/select-review-lanes.mdscript.md#select-review-lanes)
* record `{{blind_lanes}}`, `{{lane_entrypoints}}`, and `{{lane_selection_reasons}}` in the packet and a parent-visible `review_round=start` file comment
* if this is a goal run
  * set `{{review_signoff_dir}}` to the current review artifact directory under `{{run_dir}}`
* if this is not a goal run
  * set `{{review_signoff_dir}}` to the current review artifact directory under the file-task project home
* if `{{review_signoff_dir}}` does not exist
  * create `{{review_signoff_dir}}`
* keep each sign-off that is already under `{{review_signoff_dir}}`
* mint new lexicographic names for each lane in this round
* set `{{artifact_dir}}` to `{{review_signoff_dir}}` for the artifacts of this round
* for each lane id in `{{blind_lanes}}`
  * set `{{artifact_kind}}` to `<lane>-signoff`
  * set `{{artifact_subject}}` to `{{claim_scope}}`
  * set `{{artifact_ordinal}}` to `{{review_round}}`
  * set `{{artifact_reserve_only}}` to `true`
  * run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path)
  * set `{{lane_signoff_paths}}.<lane>` to `{{mdscript_artifact}}`
  * keep a different key for each lane, so that the loop does not use one path for all lanes
  * the file at that path does not exist until that lane writes it
* if the subagent tools are not available
  * run [Run File Task Reviewer Fallback](review-fallback-file-task.mdscript.md#run-file-task-reviewer-fallback)
  * [Collect Review Round Results](#collect-review-round-results)
* [Spawn Lane Reviewers](#spawn-lane-reviewers)

## Spawn Lane Reviewers

* spawn **every lane in `{{blind_lanes}}` as a readonly blind subagent in one turn** (parallel)
* for each lane id in `{{blind_lanes}}`
  * resolve `{{lane_entry}}` from `{{lane_entrypoints}}.<lane>`
  * if `{{lane_entry}}` is empty
    * set `{{blocker}}` to `missing entrypoint for lane <lane>`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
  * spawn one readonly subagent that runs only `mdscript-exec {{lane_entry}}`
  * do not give that subagent the full `self-review` skill as its role
  * do not tell that subagent to spawn more subagents
* give each lane subagent only these items:
  * the neutral packet path, the authorized paths, and `{{proof_scope}}` or `{{claim_scope}}`
  * `{{blocking_severities}}`, `{{conversation_id}}`, `{{review_signoff_dir}}`, and `{{review_skill_root}}`
  * its own `{{lane_signoff_paths}}.<lane>` as `{{signoff_path}}` for this round
  * `{{review_round}}` and its own lane entrypoint
* tell each lane subagent not to read the sign-offs or prompts of other lanes before it writes its own sign-off
* set the model of each lane subagent to the selected reviewer model and effort
* do not use a lane reviewer identity or context from an earlier round again
* record each `{{review_subagent_id}}`, lane id, prompt summary, round number, model, and effort
* before you wait, add a file comment with the round number, lane ids, subagent ids, and packet references
* if a selected lane has no active subagent
  * set `{{blocker}}` to the lane reviewer that is absent
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* wait for each spawned lane to finish
* run [Collect Review Round Results](#collect-review-round-results)

## Collect Review Round Results

* read `{{lane_signoff_paths}}.<lane>` for each lane in `{{blind_lanes}}`
* reject each sign-off whose `review_round` is not this round
* run [Aggregate Triple Signoffs](../../self-review/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs) in **this** process (not a nested review subagent)
* set `{{blocking_findings}}` and `{{residual_findings}}` from the aggregate against `{{blocking_severities}}`
* set `{{grade}}` and `{{proof_decision}}` from the aggregate
* record the residual findings
* do not carry the residual findings into a different round as blocking findings
* if a lane gives an exact implementer remediation jump under `{{granted_permissions}}`
  * record it as `{{review_remediation_jump}}`
* before you count the gate, make the grade, findings, questions, and evidence visible in file comments
* run [Require GitLab Review Visibility](review-gitlab-visibility.mdscript.md#require-gitlab-review-visibility)
* if `{{review_cycle}}` is `recursive-code`
  * run [Record Completed Review Snapshot](../../self-review/workflows/rolling-code-review.mdscript.md#record-completed-review-snapshot)
* run [Close Review Subagents](#close-review-subagents)

## Close Review Subagents

* after each lane hands off its sign-off, close or delete that lane subagent immediately
* before you close a lane reviewer, make sure that its parent-visible stop report or sign-off exists
* look for it under the project comments or `{{review_signoff_dir}}`
* if the stop report or the sign-off is absent
  * set `{{blocker}}` to the lane stop report or sign-off that is absent
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* close each id in `{{review_subagent_ids}}`
* if you cannot close a lane reviewer
  * set `{{blocker}}` to the reviewer id and the failed cleanup command
  * set `{{stop_reason}}` to `tool-failed`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* add a file comment with `cleanup_status` for each exact lane reviewer author or subagent id
* while a lane reviewer from this round is still open
  * do not start a repair or a new round
* run [Decide Review Loop](#decide-review-loop)

## Decide Review Loop

* run [Decide Review Loop](decide-review-loop.mdscript.md#decide-review-loop)
