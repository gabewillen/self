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

* run [Sync File Task Proof State](../../gabe-common/workflows/file-task-comments.md#sync-file-task-proof-state)

* before root-level review of work that created child-orchestrator lanes, verify that every affected child orchestrator has a parent-visible rollup stop comment, terminal task state, matching goal state, lane-ledger rollup entry, and cleanup status

* if any child rollup is missing
  * repair the missing child rollup
  * [Use Gabe Review](#use-gabe-review)

* if any child-orchestrator task still says an implementer is active, awaited, or unrolled while the child is counted as `proven`
  * repair that stale durable state
  * [Use Gabe Review](#use-gabe-review)

* ask reviewers whether the DBC decision is `Proven for {{claim_scope}}`, `Blocked for {{claim_scope}}` after the local resource path is absent or exhausted, or repair-required `Not ready for {{claim_scope}}`

* do not lead reviewers with your preferred verdict, implementation narrative, or another reviewer's findings unless reconciling visible disagreement

* run [Require GitLab Review Visibility](review-gitlab-visibility.md#require-gitlab-review-visibility)

* make the reviewer grade, findings, questions, answers, fix responses, evidence links, cleanup state, and resolution visible in file comments before counting the review gate

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

* run [Select Configured Model And Reasoning](../../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `reviewer` before spawning reviewers

* confirm every reviewer from earlier rounds is closed, deleted, or archived

* if any prior reviewer subagent is still open
  * set `{{blocker}}` to the open reviewer id and missing cleanup action
  * close or delete each open prior reviewer subagent with the surface close control
  * if a prior reviewer cannot be closed or deleted
    * set `{{stop_reason}}` to `tool-failed`
    * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)
  * if any prior reviewer is still open after cleanup
    * set `{{stop_reason}}` to `tool-failed`
    * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* do not start a new review round while any reviewer, reviewer thread, helper thread, or subagent from a prior round is open without a cleanup blocker or explicit transfer record

* if subagent tooling is available
  * spawn one brand-new blind review subagent for this round with `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and the recorded `{{model_selection_basis}}`

* if subagent tooling is unavailable in a project control-plane workflow
  * run [Run File Task Reviewer Fallback](review-fallback-file-task.md#run-file-task-reviewer-fallback)

* do not reuse a reviewer, reviewer thread, reviewer identity, or reviewer context from any earlier round

* give each reviewer only the neutral review packet, `{{review_round}}`, and `{{blocking_severities}}`

* require each reviewer to start with `/mdscript-exec {{repo_root}}/skills/gabe-review/SKILL.md#identify-review-scope`

* require each reviewer to grade the DBC proof decision for `{{claim_scope}}` against `{{review_object}}` and `{{review_object_scope}}`, contract preconditions, postconditions, invariants, proof path, local resource path, evidence, permissions, attribution, watcher state, and review gates

* record each `{{review_subagent_id}}`, reviewer identity, prompt summary, round number, configured model, and configured reasoning effort

* add a file comment with the round number, reviewer identities, prompt summary, and neutral packet artifact references before reviewers start

* if one fresh reviewer is not active for the round
  * set `{{blocker}}` to the missing fresh reviewer
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* run [Collect Review Round Results](#collect-review-round-results)

## Collect Review Round Results

* run [Collect Review Round Results](collect-review-round-results.md#collect-review-round-results)

## Close Review Subagents

* after each reviewer has handed off its grade and answered any questions about its own review, close or delete that reviewer subagent immediately

* before closing or deleting a reviewer, confirm the reviewer's parent-visible stop report exists in the review record, GitLab discussion when applicable, or implementer lane report

* before closing or deleting a reviewer, confirm the reviewer's parent-visible stop report exists under `~/.agents/projects/{{project_name}}/comments`

* if either parent-visible stop report is missing
  * set `{{blocker}}` to the missing reviewer stop report
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* use `multi_agent_v1.close_agent` when available; otherwise use the current surface's equivalent close, delete, or archive control

* close each subagent id in `{{review_subagent_ids}}`, including completed reviewers that still count toward concurrency

* for reviewer chat threads created through thread-management tools, archive or close the thread after the reviewer stop report is visible

* if thread archiving is unavailable
  * record the exact tool gap and new owner in the cleanup comment

* do not start a repair loop, a new review round, or a proof-decision claim while any reviewer from the completed round is still open

* if a reviewer cannot be closed or deleted
  * set `{{blocker}}` to the reviewer id and failed cleanup command
  * set `{{stop_reason}}` to `tool-failed`
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* record reviewer cleanup status in the review record and lane report

* add a file comment with reviewer cleanup status before starting repair or a new round

* include `cleanup_status` for every exact reviewer file-comment `author` and every reviewer thread id or subagent id in that file comment

* use the exact reviewer author strings from the reviewer file comments in `cleanup_status`; do not replace them with round labels such as `reviewer A`, `reviewer C`, or `both reviewers`

* run [Decide Review Loop](#decide-review-loop)

## Decide Review Loop

* run [Decide Review Loop](decide-review-loop.md#decide-review-loop)
