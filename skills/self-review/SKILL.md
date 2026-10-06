---
name: self-review
description: "Use this skill only when the user explicitly asks for a self-review, or says yes when asked; never from a rule, hook, or default. It falsifies a change or claim: code, docs, MDScripts, configs, automations, publications, or readiness. The parent composes it and spawns one blind subagent for each lane that the change needs, never the full skill. Aggregate the lane sign-offs into a scoped Proven-for, Not-ready-for, or Blocked-for verdict."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Identify Review Scope

* run [Require Self Review Consent](../self-common/workflows/self-review-consent.mdscript.md#require-self-review-consent)
* if no implementer or orchestrator composes this review, report that a parent must compose it, and stop
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `reviewer`
* run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet) if the artifact has a file task
* find the artifact, the done state, the merge target, `{{proof_scope}}`, the contract, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{review_round}}`, and `{{blocking_severities}}`
* set `{{proof_scope}}` to a typed scope from [Check Evidence Boundary](checks/review-checks.mdscript.md#check-evidence-boundary); for a vague `ready`, use the narrowest scope that the proof supports
* falsify the claim; do not approve the author's story
* [Gather Current Source](#gather-current-source)

## Gather Current Source

* read live repository, task, comment, goal, ledger, PR, test, route, screenshot, and telemetry state, not memory
* for a GitHub PR, read the current head, base, mergeability, checks, reviews, threads, and replies newer than the last review
  * if they changed, review the current head; an earlier approval or `feedback_posted` record is stale
* if source truth for the proof path is missing, set `{{grade}}` to `Blocked for {{proof_scope}}` with the missing source, and [Report Verdict](#report-verdict)
* [Build Neutral Review Packet](#build-neutral-review-packet)

## Build Neutral Review Packet

* set `{{merge_target}}` from the PR base, the MR target, or the default branch, or `main`
* for a Git change, run [Resolve Review Baseline](workflows/rolling-code-review.mdscript.md#resolve-review-baseline)
* decide "code changed" from the changed paths of `{{review_diff}}`, not from the request
* build the packet from the diff, neutral supporting code, contracts, tests, docs, the task, the open comments, and the ledger
  * leave out earlier verdicts, the author's preferred verdict and narrative, and other reviewers' findings
* if code changed, set `{{blocking_severities}}` to `all findings` in round 1, `P1,P2` in round 2, and `P1` after that
* otherwise set `{{review_mode}}` to `single-non-code`, with one fresh review and no recursion
* give each finding a severity, and keep findings below the threshold as `{{residual_findings}}`
* run [Run Review Checks](checks/review-checks.mdscript.md#run-review-checks)
* run [Select Review Lanes](workflows/select-review-lanes.mdscript.md#select-review-lanes)
* for a terminal readiness, goal, merge, live-proof, or release gate, or when the caller asks for blind lanes
  * run [Triple Adversarial Blind Review](workflows/triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review)
* for an intermediate repair pass
  * read the selected rule files, and `hsm/hsm.mdscript.md#triage` if a state machine is in scope, as a lead-reviewer lens only
  * record that the final gate must still run the blind lanes
* [Determine Grade](#determine-grade)

## Determine Grade

* if `{{grade}}` is already `Blocked for`, [Report Verdict](#report-verdict)
* set `{{blocking_findings}}` to the findings at `{{blocking_severities}}`, and `{{residual_findings}}` to the rest
* if a blocking finding is repairable, grade `Not ready for {{proof_scope}}`
* if the author claimed blocked infrastructure without trying the local resource path, grade `Not ready for {{proof_scope}}`
* if a named external precondition still blocks the proof after each local path, grade `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
* record a gap that is only outside `{{proof_scope}}` under `{{proof_not_claimed}}`, and keep judging the narrow scope
* if the request asks for broader readiness than the proof supports
  * grade the broader scope `Not ready` or `Blocked`, and keep the narrow result as a finding
* at a terminal gate, grade `Not ready for {{proof_scope}}` if any of these is true:
  * a selected lane has no complete blind sign-off
  * a state machine is in scope and no `hsm` lane signed off
  * code changed and no `eng-core` lane ran
* if no blocking finding remains, each precondition was available, and the proof passed now
  * grade `Proven for {{proof_scope}}` at `{{blocking_severities}}`, naming the lanes that signed off
  * an `n/a` HSM sign-off does not make the verdict state machine proof
* [Report Verdict](#report-verdict)

## Report Verdict

* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the grade, findings, questions, evidence, and stop report before any tracker note
* for GitLab, write through [Use GitLab Sudo Alias Before Public Write](../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write) as `reviewer`
* put findings first, by consequence, with file and line, PR, command, route, screenshot, trace, or log pointers
* write inline PR comments as short questions about evidence and risk; do not soften a blocker or hide the grade
* give each finding that the implementer can fix its exact entry, for example `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`
* report `Decision: {{proof_decision}}` and `Verdict: {{grade}}` with the scope, threshold, blocking and residual findings, contract, proof path, and `{{proof_not_claimed}}`
* if there are no findings, say `No review findings for {{proof_scope}} at {{blocking_severities}} threshold. Decision: Proven for {{proof_scope}}.`, and name what it does not claim
* if you ask for input, run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `report-verdict`
* set `{{stop_reason}}` to `blocked` or `review-complete`, and send the report with `cleanup_status` to the parent before it closes this reviewer
* never change skills from a gap that a reviewer found; only the user's corrections change skills
