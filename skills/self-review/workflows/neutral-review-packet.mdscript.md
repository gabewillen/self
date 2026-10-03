<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Build Neutral Review Packet

* if `{{merge_target}}` is unknown
  * set `{{merge_target}}` from the PR base, the MR target, or the default branch
  * if no more specific target exists, set `{{merge_target}}` to `main`
* if the reviewed object is a change in a Git worktree — code, docs, MDScript, config, PR, MR, or branch readiness
  * [Resolve Code Review Baseline](#resolve-code-review-baseline)
* [Assemble Neutral Sources](#assemble-neutral-sources)

## Resolve Code Review Baseline

* run [Resolve Review Baseline](rolling-code-review.mdscript.md#resolve-review-baseline)
* set the primary review object to `{{review_diff}}` for `{{review_diff_scope}}`
* use the `{{review_diff}}` path list to find if code changed
* do not use the request narrative to find if code changed
* find the artifact classes and the lane set from the diff
* [Assemble Neutral Sources](#assemble-neutral-sources)

## Assemble Neutral Sources

* read [Packet Assembly Policy](../references/packet-assembly-policy.md)
* set `{{supporting_paths}}` to neutral code paths, contracts, schemas, tests, docs, artifacts, routes, and ownership surfaces that explain the diff
* set `{{neutral_sources}}` to the current task file, the applicable unresolved comments, and the lane ledger entries
* if the review does not reconcile a visible disagreement
  * exclude previous reviewer verdicts from the blind-review frame
  * exclude the preferred verdict, the intended fix narrative, and the curated explanation of the author from the initial frame
  * exclude the findings of other reviewers from the initial frame
* [Set Review Mode](#set-review-mode)

## Set Review Mode

* if code changed
  * set `{{recursive_review}}` to `true`
* if code changed and this is an initial review
  * set `{{review_cycle}}` to `cumulative`
* if code changed and this is a repair review
  * set `{{review_cycle}}` to `rolling-delta`
* if code changed and this is a terminal readiness gate
  * set `{{review_cycle}}` to `fresh-cumulative-blind`
* if code changed and `{{review_round}}` is `1`
  * set `{{blocking_severities}}` to `all findings`
* if code changed and `{{review_round}}` is `2`
  * set `{{blocking_severities}}` to `P1,P2`
* if code changed and `{{review_round}}` is `3` or greater
  * set `{{blocking_severities}}` to `P1`
* if the change is MDScript, instruction, documentation, plan, task, comment, publication, or other non-code work
  * set `{{recursive_review}}` to `false`
* if the change is MDScript, instruction, documentation, plan, task, comment, publication, or other non-code work
  * set `{{review_mode}}` to `single-non-code`
* give an explicit severity to each finding, also to a finding below `{{blocking_severities}}`
* set `{{residual_findings}}` to the findings below the threshold
* [Run Packet Checks](#run-packet-checks)

## Run Packet Checks

* run [Check Goal And Contract](../checks/goal-and-contract.mdscript.md#check-goal-and-contract)
* run [Check Evidence Boundary](../checks/evidence-boundary.mdscript.md#check-evidence-boundary)
* run [Check UI And Product Surface](../checks/evidence-boundary.mdscript.md#check-ui-and-product-surface)
* run [Check Ownership And Permission](../checks/ownership-permission.mdscript.md#check-ownership-and-permission)
* run [Check Review And Watcher Gates](../checks/review-watcher-gates.mdscript.md#check-review-and-watcher-gates)
* run [Check Coordinator Control](../checks/coordinator-control.mdscript.md#check-coordinator-control)
* run [Check Publication Hygiene](../checks/publication-hygiene.mdscript.md#check-publication-hygiene)
* [Apply Domain Gates](#apply-domain-gates)

## Apply Domain Gates

* read [Domain Gate Policy](../references/domain-gate-policy.md)
* classify the artifact into every applicable domain class from that policy
* for each applicable domain class
  * examine the artifact and the given proof against the `require` rules and the `reject` rules of that class
  * for each unmet `require` rule or violated `reject` rule
    * add a finding with a severity, an evidence pointer, and a consequence
* [Select Packet Lanes](#select-packet-lanes)

## Select Packet Lanes

* run [Select Review Lanes](select-review-lanes.mdscript.md#select-review-lanes)
* record selected `{{blind_lanes}}`, `{{lane_selection_reasons}}`, and `{{hsm_in_scope}}` in the packet
* if `{{hsm_in_scope}}` is `true` and this is a non-terminal single-pass or rolling repair review
  * [Run Inline HSM Lens](#run-inline-hsm-lens)
* if this is a non-terminal intermediate pass and selected `eng-*` lanes apply
  * read each selected engineering rules file under `references/engineering-rules/` as a lead-reviewer lens only
  * add each clear MUST or MUST NOT violation to the findings of this round with its rule id
  * do not use the inline eng lens as a blind lane sign-off
* [Route Terminal Or Intermediate](#route-terminal-or-intermediate)

## Run Inline HSM Lens

* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to this skill's absolute directory
* run `/mdscript-exec {{review_skill_root}}/hsm/hsm.mdscript.md#triage` with `{{review_scope}}` from the in-scope paths
* add the HSM `stands` findings to the findings of this round with their rule ids and severities
* mark the inline HSM pass as a lead-reviewer lens only
* do not mark the inline HSM pass as the blind HSM lane
* [Route Terminal Or Intermediate](#route-terminal-or-intermediate)

## Route Terminal Or Intermediate

* if this review is a terminal readiness, goal-completion, merge-readiness, live-proof, or release-readiness gate
  * [Run Terminal Multi Lane Blind](#run-terminal-multi-lane-blind)
* if the caller requested triple blind or multi-lane blind
  * [Run Terminal Multi Lane Blind](#run-terminal-multi-lane-blind)
* if this is a non-terminal intermediate rolling repair pass and the caller did not request multi-lane blind
  * record that the final cumulative readiness gate must still run [Triple Adversarial Blind Review](triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review) with selected lanes
  * run [Determine Grade](../SKILL.md#determine-grade)
  * stop
* run [Determine Grade](../SKILL.md#determine-grade)
* stop

## Run Terminal Multi Lane Blind

* run [Triple Adversarial Blind Review](triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review)
* if a spawned lane does not have `signed_off: true` or has non-empty `p_findings`
  * add the findings of all lanes to `{{blocking_findings}}`
  * run [Determine Grade](../SKILL.md#determine-grade)
  * stop
* if each spawned lane has `signed_off: true` and empty `p_findings`
  * set `{{grade}}` to `Proven for {{proof_scope}}`
* run [Determine Grade](../SKILL.md#determine-grade)
* stop
