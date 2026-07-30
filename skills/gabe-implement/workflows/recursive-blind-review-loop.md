<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Gabe Review

* run [Resolve File Task Root](../../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* if code changed
  * use `{{repo_root}}/skills/gabe-review/SKILL.md` as the review lens
  * set `{{review_cycle}}` to `recursive-code`
  * run [Resolve Review Baseline](../../gabe-review/workflows/rolling-code-review.md#resolve-review-baseline)
  * prepare a neutral review packet from `{{review_diff}}`, plus supporting code, contracts, schemas, tests, docs, routes, and artifacts needed to judge the diff
  * set `{{review_object}}` to `{{review_diff}}`
  * set `{{review_object_scope}}` to `{{review_diff_scope}}`

* if no code changed
  * use `{{repo_root}}/skills/gabe-review/SKILL.md` as the review lens
  * set `{{review_cycle}}` to `single-non-code`
  * set `{{review_mode}}` to `single-non-code`
  * prepare a neutral review packet from the exact current non-code artifacts, including MDScripts and documentation, contracts, and direct validation evidence
  * set `{{review_object}}` to the exact current non-code artifact set
  * set `{{review_object_scope}}` to `the exact current non-code change`

* include `{{claim_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, and `{{authority_needed}}` in the review packet

* include the current file task, unresolved file comments, and lane ledger entries in the neutral packet without using the author's preferred verdict as framing

* before building the neutral packet, run [Sync File Task Proof State](../../gabe-common/workflows/file-task-comments.md#sync-file-task-proof-state)

* before root-level review of work that created child-orchestrator lanes, verify that every affected child orchestrator has a parent-visible rollup stop comment, terminal task state, matching goal state, lane-ledger rollup entry, and cleanup status; repair missing child rollups before starting reviewers

* if any child-orchestrator task still says an implementer is active, awaited, or unrolled while the child is counted as `proven`, treat that as stale durable state and repair it before starting reviewers

* do not ask reviewers for vague readiness; ask whether the DBC decision is `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}` after the local resource path is absent or exhausted, or repair-required `Not ready for {{claim_scope}}`

* do not lead reviewers with your preferred verdict, implementation narrative, or another reviewer's findings unless reconciling visible disagreement

* if code changed
  * [Start Review Round](#start-review-round)

* if no code changed
  * [Start Review Round](#start-review-round)

* if the work has a GitLab issue or MR
  * make reviewer grades, findings, questions, answers, fix responses, evidence links, and resolution visible there
  * require reviewers to use `gitlab-sudo-alias` with an alias ending in `-reviewer` before authoring their own sanitized GitLab issue, review, or comment records
  * resolve threads only after concerns are fixed, withdrawn, or explicitly accepted as closed

* in all cases, make the reviewer grade, findings, questions, answers, fix responses, evidence links, cleanup state, and resolution visible in file comments before counting the review gate

* run [Prepare MR Or PR](prepare-mr-or-pr.md#prepare-mr-or-pr)

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

* run [Select Configured Model And Reasoning](../../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `reviewer` before spawning reviewers

* before spawning reviewers, confirm every reviewer from earlier rounds is closed, deleted, or archived

* if any prior reviewer subagent is still open
  * set `{{blocker}}` to the open reviewer id and missing cleanup action
  * [Close Review Subagents](#close-review-subagents)

* do not start a new review round while any reviewer, reviewer thread, helper thread, or subagent from a prior round is open without a cleanup blocker or explicit transfer record

* spawn one brand-new blind review subagent for this round with `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and the recorded `{{model_selection_basis}}`

* when subagent tooling is unavailable in a project control-plane workflow
  * create one reviewer file task for this round with a distinct task id, author, and parent set to the implementer task
  * add a file comment on the implementer task that records `subagent_tooling: unavailable`, the neutral packet artifact, reviewer task ids, and the fallback boundary
  * run one fresh reviewer pass from `/mdscript-exec {{repo_root}}/skills/gabe-review/SKILL.md#identify-review-scope`
  * the reviewer pass must write its own reviewer file comment with `role: reviewer`, a distinct `author`, `claim_scope`, `proof_decision`, evidence, questions, and stop report
  * do not use this fallback to claim public MR/PR merge-readiness when the repository or tracker requires live blind subagents; use it only for project control-plane source-health proof when no subagent surface exists

* do not reuse a reviewer, reviewer thread, reviewer identity, or reviewer context from any earlier round

* give each reviewer only the neutral review packet, `{{review_round}}`, and `{{blocking_severities}}`, and require `/mdscript-exec {{repo_root}}/skills/gabe-review/SKILL.md#identify-review-scope`

* require each reviewer to grade the DBC proof decision for `{{claim_scope}}` against `{{review_object}}` and `{{review_object_scope}}`, contract preconditions, postconditions, invariants, proof path, local resource path, evidence, permissions, attribution, watcher state, and review gates

* record each `{{review_subagent_id}}`, reviewer identity, prompt summary, round number, configured model, and configured reasoning effort

* add a file comment with the round number, reviewer identities, prompt summary, and neutral packet artifact references before reviewers start

* if one fresh reviewer is not active for the round
  * set `{{blocker}}` to the missing fresh reviewer
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* [Collect Review Round Results](#collect-review-round-results)

## Collect Review Round Results

* collect each reviewer's severity-ranked findings, scoped grade, questions, requested evidence, and any implementer remediation jump

* partition current findings into `{{blocking_findings}}` matching `{{blocking_severities}}` and `{{residual_findings}}` below the current threshold

* record `{{residual_findings}}` without carrying them into another review round

* require each reviewer to write or return a file-comment-ready verdict with `task_id`, `role: reviewer`, `proof_decision`, `claim_scope`, evidence, questions, and stop report

* answer reviewer questions only to clarify that reviewer's own findings, evidence, or grade

* do not give one reviewer another reviewer's findings unless explicitly reconciling visible disagreement after the initial blind verdicts

* require every reviewer to hand off a final scoped grade before cleanup

* require every reviewer handoff to include `{{stop_reason}}` and to be visible to this implementer before the reviewer stops

* if a reviewer includes an exact `/mdscript-exec {{repo_root}}/skills/gabe-implement/` remediation jump
  * verify the jump targets this skill or an implementer workflow file and fits `{{granted_permissions}}`
  * record it as `{{review_remediation_jump}}`

* if the work has a GitLab issue or MR
  * make the reviewer grade, findings, questions, answers, fix responses, evidence links, and resolution visible there before counting the review gate
  * confirm the implementer wrote implementer issue, review, and comment records through the `-implementor` alias and each reviewer wrote reviewer records through the `-reviewer` alias

* confirm the reviewer grade has a corresponding file comment before counting the review gate

* if `{{review_cycle}}` is `recursive-code`
  * run [Record Completed Review Snapshot](../../gabe-review/workflows/rolling-code-review.md#record-completed-review-snapshot)

* [Close Review Subagents](#close-review-subagents)

## Close Review Subagents

* after each reviewer has handed off its grade and answered any questions about its own review, close or delete that reviewer subagent immediately

* before closing or deleting a reviewer, confirm the reviewer's parent-visible stop report exists in the review record, GitLab discussion when applicable, or implementer lane report

* before closing or deleting a reviewer, confirm the reviewer's parent-visible stop report exists under `~/.agents/projects/{{project_name}}/comments`

* use `multi_agent_v1.close_agent` when available; otherwise use the current surface's equivalent close, delete, or archive control

* close each subagent id in `{{review_subagent_ids}}`, including completed reviewers that still count toward concurrency

* for reviewer chat threads created through thread-management tools, archive or close the thread after the reviewer stop report is visible; if archiving is unavailable, record the exact tool gap and new owner in the cleanup comment

* do not start a repair loop, a new review round, or a proof-decision claim while any reviewer from the completed round is still open

* if a reviewer cannot be closed or deleted
  * set `{{blocker}}` to the reviewer id and failed cleanup command
  * set `{{stop_reason}}` to `tool-failed`
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* record reviewer cleanup status in the review record and lane report

* add a file comment with reviewer cleanup status before starting repair or a new round

* include `cleanup_status` for every exact reviewer file-comment `author` and every reviewer thread id or subagent id in that file comment

* use the exact reviewer author strings from the reviewer file comments in `cleanup_status`; do not replace them with round labels such as `reviewer A`, `reviewer C`, or `both reviewers`

* [Decide Review Loop](#decide-review-loop)

## Decide Review Loop

* if `{{review_cycle}}` is `single-non-code` and the reviewer found a real issue or returned `Not ready for {{claim_scope}}`
  * fix or reconcile the issue
  * rerun direct validation, render, pipeline, route, or black-box proof required by `{{claim_scope}}`
  * set `{{review_gate}}` to `single fresh review completed; findings repaired with direct proof`
  * run [Prepare MR Or PR](prepare-mr-or-pr.md#prepare-mr-or-pr)

* if `{{review_cycle}}` is `single-non-code` and the reviewer found no issue
  * set `{{review_gate}}` to `Proven for {{claim_scope}}`
  * run [Prepare MR Or PR](prepare-mr-or-pr.md#prepare-mr-or-pr)

* if `{{review_cycle}}` is `recursive-code` and `{{blocking_findings}}` is not empty
  * set `{{review_phase}}` to `repair`
  * fix or reconcile every finding in `{{blocking_findings}}`
  * if `{{review_remediation_jump}}` is set
    * continue from that MDScript heading
  * refresh tests, proof, and review packet evidence
  * [Start Review Round](#start-review-round)

* if `{{review_cycle}}` is `recursive-code`, the reviewer is closed or deleted, and `{{blocking_findings}}` is empty
  * run [Require Final Cumulative Review](../../gabe-review/workflows/rolling-code-review.md#require-final-cumulative-review)
  * if `{{final_cumulative_review}}` is not `proven`
    * [Start Review Round](#start-review-round)
  * set `{{review_gate}}` to `Proven for {{claim_scope}}`
  * run [Prepare MR Or PR](prepare-mr-or-pr.md#prepare-mr-or-pr)

* if the reviewer is closed and its non-proven grade names a missing precondition, resource, access, authority, safe target, or source truth
  * set `{{review_gate}}` to `Blocked for {{claim_scope}}`
  * set `{{blocker}}` to the exact missing review prerequisite
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)
