<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Build Neutral Review Packet

* if `{{merge_target}}` is unknown
  * set `{{merge_target}}` from the PR base, MR target, default branch, or `main` only when no more specific target exists
* if the reviewed object is a change in a Git worktree — code, docs, MDScript, config, PR, MR, or branch readiness
  * [Resolve Code Review Baseline](#resolve-code-review-baseline)
* [Assemble Neutral Sources](#assemble-neutral-sources)

## Resolve Code Review Baseline

* run [Resolve Review Baseline](rolling-code-review.mdscript.md#resolve-review-baseline)
* set the primary review object to `{{review_diff}}` for `{{review_diff_scope}}`
* decide whether code changed from the `{{review_diff}}` path list, not from the request narrative, so the artifact classes and lane set come from the diff
* [Assemble Neutral Sources](#assemble-neutral-sources)

## Assemble Neutral Sources

* read [Packet Assembly Policy](../references/packet-assembly-policy.md)
* set `{{supporting_paths}}` to the neutral code paths, contracts, schemas, tests, docs, artifacts, routes, and ownership surfaces needed to understand the diff
* set `{{neutral_sources}}` to the current task file, relevant unresolved comments, and lane ledger entries
* exclude previous reviewer verdicts from the blind-review frame unless reconciling visible disagreement
* exclude the author's preferred verdict, intended fix narrative, curated explanation, and other reviewers' findings from the initial frame unless reconciling visible disagreement
* set `{{review_baseline_dir}}` to `~/.agents/projects/{{project_name}}/artifacts/review-baselines/`
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
* assign an explicit severity to every finding even when below `{{blocking_severities}}`
* set below-threshold findings as `{{residual_findings}}`
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
  * inspect the artifact and supplied proof against that class's require and reject rules
  * for each unmet require or violated reject
    * add a finding with severity, evidence pointer, and consequence
* [Select Packet Lanes](#select-packet-lanes)

## Select Packet Lanes

* run [Select Review Lanes](select-review-lanes.mdscript.md#select-review-lanes)
* record selected `{{blind_lanes}}`, `{{lane_selection_reasons}}`, and `{{hsm_in_scope}}` in the packet
* if `{{hsm_in_scope}}` is `true` and this is a non-terminal single-pass or rolling repair review
  * [Run Inline HSM Lens](#run-inline-hsm-lens)
* if this is a non-terminal intermediate pass and selected `eng-*` lanes apply
  * read each selected engineering rules file under `references/engineering-rules/` as a lead-reviewer lens only
  * fold clear MUST / MUST NOT violations into this round's findings with rule ids
  * do not treat the inline eng lens as a blind lane sign-off
* [Route Terminal Or Intermediate](#route-terminal-or-intermediate)

## Run Inline HSM Lens

* run `/mdscript-exec {{review_skill_root}}/hsm/hsm.mdscript.md#triage` with `{{review_scope}}` from the in-scope paths when `{{review_skill_root}}` is set, otherwise `/mdscript-exec ~/.agents/skills/self-review/hsm/hsm.mdscript.md#triage`
* fold the HSM `stands` findings into this round's findings with their rule ids and severities
* mark the inline HSM pass as lead-reviewer lens only, not the blind HSM lane
* [Route Terminal Or Intermediate](#route-terminal-or-intermediate)

## Route Terminal Or Intermediate

* if this review is a terminal readiness, goal-completion, merge-readiness, live-proof, or release-readiness gate
  * [Run Terminal Multi Lane Blind](#run-terminal-multi-lane-blind)
* if the caller requested triple blind or multi-lane blind
  * [Run Terminal Multi Lane Blind](#run-terminal-multi-lane-blind)
* if this is a non-terminal intermediate rolling repair pass and the caller did not request multi-lane blind
  * record that the final cumulative readiness gate still requires [Triple Adversarial Blind Review](triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review) with selected lanes
  * run [Determine Grade](../SKILL.md#determine-grade)
  * stop
* run [Determine Grade](../SKILL.md#determine-grade)
* stop

## Run Terminal Multi Lane Blind

* run [Triple Adversarial Blind Review](triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review)
* if any spawned lane lacks `signed_off: true` or has non-empty `p_findings`
  * union lane findings into `{{blocking_findings}}`
  * run [Determine Grade](../SKILL.md#determine-grade)
  * stop
* set `{{grade}}` to `Proven for {{proof_scope}}` only when every spawned lane is `signed_off: true` with empty `p_findings`
* run [Determine Grade](../SKILL.md#determine-grade)
* stop
