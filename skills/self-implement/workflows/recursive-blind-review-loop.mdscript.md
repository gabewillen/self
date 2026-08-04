<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Multi-Lane Review

* if `{{self_review_required}}` is empty
  * set `{{self_review_required}}` to `true` only when this lane is about to create or update a pull/merge request, or when merge into the target branch is requested or in scope
  * otherwise set `{{self_review_required}}` to `false`
* if `{{self_review_required}}` is `false`
  * set `{{review_gate}}` to `not-required-until-pr-or-merge`
  * set `{{proof_decision}}` empty for review
  * return to the caller without spawning reviewers
* this implementer (or goal/orchestrator process that owns the lane) runs the self-review **composition** itself
* never spawn a subagent whose job is `/self-review` or `mdscript-exec …/self-review/SKILL.md` as a whole skill
* the only review subagents allowed are **per-lane** blind reviewers that execute one lane MDScript under `self-review/workflows/blind-reviewers/`
* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* if code changed
  * set `{{review_cycle}}` to `recursive-code`
  * run [Resolve Review Baseline](../../self-review/workflows/rolling-code-review.mdscript.md#resolve-review-baseline)
  * set `{{review_object}}` to `{{review_diff}}`
  * set `{{review_object_scope}}` to `{{review_diff_scope}}`
* if no code changed
  * set `{{review_cycle}}` to `single-non-code`
  * set `{{review_mode}}` to `single-non-code`
  * set `{{review_object}}` to the exact current non-code artifact set
  * set `{{review_object_scope}}` to `the exact current non-code change`
* set packet fields for `{{claim_scope}}`, `{{proof_claim}}`, contract preconditions, postconditions, invariants, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, and `{{authority_needed}}`
* include the current file task, unresolved file comments, and lane ledger entries without using a preferred verdict as the frame
* run [Sync File Task Proof State](../../self-common/workflows/file-task-comments.mdscript.md#sync-file-task-proof-state)
* before root-level review of work that created child-orchestrator lanes, verify every affected child has a parent-visible rollup stop comment, terminal task state, matching goal state, lane-ledger rollup, and cleanup status
* if any child rollup is missing
  * repair the missing child rollup
  * [Use Multi-Lane Review](#use-multi-lane-review)
* if any child-orchestrator task still says an implementer is active while the child is counted as `proven`
  * repair that stale durable state
  * [Use Multi-Lane Review](#use-multi-lane-review)
* do not lead reviewers with a preferred verdict, implementation narrative, or another reviewer's findings
* run [Require GitLab Review Visibility](review-gitlab-visibility.mdscript.md#require-gitlab-review-visibility)
* make grades, findings, questions, answers, fix responses, evidence links, cleanup state, and resolution visible in file comments before counting the review gate
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
* set `{{review_skill_root}}` to `{{repo_root}}/skills/self-review` when that path exists, otherwise `~/.agents/skills/self-review`
* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `reviewer` before spawning lane reviewers
* confirm every lane reviewer from earlier rounds is closed, deleted, or archived
* if any prior lane reviewer is still open
  * set `{{blocker}}` to the open reviewer id and missing cleanup action
  * close or delete each open prior lane reviewer
  * if a prior lane reviewer cannot be closed
    * set `{{stop_reason}}` to `tool-failed`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* write or refresh the neutral review packet for this round from `{{review_object}}` and supporting neutral sources
* run [Select Review Lanes](../../self-review/workflows/select-review-lanes.mdscript.md#select-review-lanes)
* record `{{blind_lanes}}`, `{{lane_entrypoints}}`, and `{{lane_selection_reasons}}` in the packet and a parent-visible `review_round=start` file comment
* set `{{review_signoff_dir}}` to the current review artifact directory under the file-task project home or `{{run_dir}}` when this is a goal run
* create `{{review_signoff_dir}}` when missing
* delete every existing `signoff-reviewer-*.mdscript.md` under `{{review_signoff_dir}}` for this round
* if subagent tooling is unavailable
  * run [Run File Task Reviewer Fallback](review-fallback-file-task.mdscript.md#run-file-task-reviewer-fallback)
  * [Collect Review Round Results](#collect-review-round-results)
* [Spawn Lane Reviewers](#spawn-lane-reviewers)

## Spawn Lane Reviewers

* spawn **every lane in `{{blind_lanes}}` as a readonly blind subagent in one turn** (parallel)
* for each lane id in `{{blind_lanes}}`
  * resolve `{{lane_entry}}` from `{{lane_entrypoints}}.<lane>`
  * if `{{lane_entry}}` is missing
    * set `{{blocker}}` to `missing entrypoint for lane <lane>`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
  * spawn one readonly subagent that runs only `mdscript-exec {{lane_entry}}`
  * do not give that subagent the full `self-review` skill as its role or ask it to spawn further subagents
* give each lane subagent only: neutral packet path, authorized paths, `{{proof_scope}}` or `{{claim_scope}}`, `{{blocking_severities}}`, `{{conversation_id}}`, `{{review_signoff_dir}}`, `{{review_skill_root}}`, and its own lane entrypoint
* forbid each lane subagent from reading other lanes' sign-offs or prompts before writing its own
* set each lane subagent model to the selected reviewer model and effort
* do not reuse a lane reviewer identity or context from an earlier round
* record each `{{review_subagent_id}}`, lane id, prompt summary, round number, model, and effort
* add a file comment with the round number, lane ids, subagent ids, and packet references before waiting
* if any selected lane has no active subagent
  * set `{{blocker}}` to the missing lane reviewer
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* wait for every spawned lane to finish
* run [Collect Review Round Results](#collect-review-round-results)

## Collect Review Round Results

* read every `signoff-reviewer-<lane>.mdscript.md` under `{{review_signoff_dir}}` for lanes in `{{blind_lanes}}`
* run [Aggregate Triple Signoffs](../../self-review/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs) in **this** process (not a nested review subagent)
* set `{{blocking_findings}}` and `{{residual_findings}}` from the aggregate against `{{blocking_severities}}`
* set `{{grade}}` and `{{proof_decision}}` from the aggregate
* record residual findings without carrying them into another round as blocking
* if a lane includes an exact implementer remediation jump under `{{granted_permissions}}`
  * record it as `{{review_remediation_jump}}`
* make the grade, findings, questions, and evidence visible in file comments before counting the gate
* run [Require GitLab Review Visibility](review-gitlab-visibility.mdscript.md#require-gitlab-review-visibility)
* if `{{review_cycle}}` is `recursive-code`
  * run [Record Completed Review Snapshot](../../self-review/workflows/rolling-code-review.mdscript.md#record-completed-review-snapshot)
* run [Close Review Subagents](#close-review-subagents)

## Close Review Subagents

* after each lane has handed off its sign-off, close or delete that lane subagent immediately
* before closing a lane reviewer, confirm its parent-visible stop report or sign-off exists under the project comments or `{{review_signoff_dir}}`
* if either stop report or sign-off is missing
  * set `{{blocker}}` to the missing lane stop report or sign-off
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* close each id in `{{review_subagent_ids}}`
* if a lane reviewer cannot be closed
  * set `{{blocker}}` to the reviewer id and failed cleanup command
  * set `{{stop_reason}}` to `tool-failed`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* add a file comment with `cleanup_status` for every exact lane reviewer author or subagent id
* do not start repair or a new round while any lane reviewer from this round is still open
* run [Decide Review Loop](#decide-review-loop)

## Decide Review Loop

* run [Decide Review Loop](decide-review-loop.mdscript.md#decide-review-loop)
