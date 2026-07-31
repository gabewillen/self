---
name: gabe-review
description: "ALWAYS use this skill when reviewing any change or claim — code, docs, MDScripts, configs, instructions, automations, publications, diffs, or readiness: compose multi-lane blind review in-process (never nest the full skill), always run rules/security/completeness plus selected eng-* packs and deep hsm when a state machine is in scope, aggregate independent lane sign-offs, and emit scoped Proven-for or Blocked-for verdicts."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Identify Review Scope

* this skill requires a parent: orchestrators and implementers compose it (or assign per-lane blind MDScripts to subagents); never treat full multi-lane review as a parentless root role
* run multi-lane blind review only on a process that can spawn subagents when lanes are required; never re-delegate this full skill — spawn only per-lane blind MDScripts
* if `{{parent_agent}}` and `{{parent_reporting_path}}` are both empty and no spawning implementer or orchestrator owns this review composition
  * set `{{blocker}}` to `review skill requires a parent implementer or orchestrator reporting path`
  * stop and report that a parentless agent must use orchestrate (and compose review from there or from implement), not run review as the root role alone

* run [Select Configured Model And Reasoning](../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `reviewer`

* run [Resolve File Task Root](../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Read File Task Packet](../gabe-common/workflows/file-task-comments.md#read-file-task-packet) when the reviewed artifact has a file task

* infer `{{parent_agent}}` and `{{parent_reporting_path}}`; report the scoped grade or blocker to the spawning implementer or orchestrator before stopping, closing, deleting, archiving, or going silent

* before the reviewer stops, include cleanup expectation in the stop report: the parent must close, archive, delete when explicitly allowed, or record a transfer/cleanup blocker for this reviewer chat thread or subagent

* infer `{{artifact_type}}`, `{{artifact}}`, `{{intended_done_state}}`, `{{merge_target}}`, `{{tracker}}`, `{{proof_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, `{{missing_precondition}}`, `{{proof_decision}}`, and `{{public_surface}}`

* infer `{{review_round}}` and `{{blocking_severities}}` from the neutral review packet

* if code changed and `{{blocking_severities}}` is absent
  * set `{{blocking_severities}}` to `all findings`

* classify `{{proof_scope}}` before judging; use typed scopes such as `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`

* treat Design by Contract as the proof-decision format: contracts make proof decidable, not always available

* for PR/MR acceptance, require the terminal decision to be `Proven for {{proof_scope}}` or `Blocked for {{proof_scope}}: missing {{missing_precondition}}`

* treat `Not ready for {{proof_scope}}` as a repair state for failed, stale, mismatched, or incomplete proof while required preconditions are available; do not use it as the terminal MR acceptance state

* treat missing infrastructure as a setup question before it is a blocker; if the repo provides a local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path that can satisfy the precondition, the proof path is still available

* if the author asks for vague readiness
  * force the review to name the narrowest claim actually supported by the supplied proof
  * preserve broader proof gaps as `{{proof_not_claimed}}` or `{{remaining_blockers}}`

* if broader judgment, delegation, permission, or coordination is needed
  * run `/mdscript-exec {{repo_root}}/skills/gabe/SKILL.md`

* if the current request is a durable human correction about how reviewers must judge, falsify, or grade
  * set `{{correction_source}}` to that correction
  * run [Update Living Skills](../gabe-common/workflows/update-living-skills.md#update-living-skills)

* use this skill to falsify readiness, not to rubber-stamp the author's narrative

* [Gather Current Source](#gather-current-source)

## Gather Current Source

* read the current source of truth before judging

* prefer live repo state, current file task state, unresolved file comments, goal MDScript files, lane ledger entries, current issue or PR/MR state, current documentation source, current test output, current route output, current screenshots, current telemetry, and current artifacts over memory

* do not let the installed skill context override current source, live evidence, local instructions, or the user's current request

* if required source truth is unavailable for the proof path
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing source truth`
  * set `{{blocker}}` to the exact missing source truth
  * [Report Verdict](#report-verdict)

* if reviewing a GitHub PR, before returning a verdict, approval, blocker, or stale-review answer
  * inspect current GitHub head SHA, base branch, mergeability/conflict state, checks, reviews, review comments, conversation threads, author replies, `changes_requested`, review-request or re-review signals, and comments newer than the last reviewer signal
  * if the head changed, an author replied to a finding, a re-review was requested, a review thread changed state, or a newer unresolved conversation exists, rerun the review against the current head and current discussion state instead of reusing the earlier verdict
  * treat prior `feedback_posted`, `github_approval_sent`, green-check reactions, or private reviewer memory as stale unless they name the same current head and no newer GitHub reply, re-review request, unresolved conversation, or check/mergeability change needs action
  * if GitHub access is unavailable, set the blocker to the exact missing GitHub source truth rather than claiming the previous review is still current

* [Build Neutral Review Packet](#build-neutral-review-packet)

## Build Neutral Review Packet

* run [Build Neutral Review Packet](workflows/neutral-review-packet.md#build-neutral-review-packet)

## Check Goal And Contract

* run [Check Goal And Contract](checks/goal-and-contract.md#check-goal-and-contract)

## Check Evidence Boundary

* run [Check Evidence Boundary](checks/evidence-boundary.md#check-evidence-boundary)

## Check UI And Product Surface

* run [Check UI And Product Surface](checks/evidence-boundary.md#check-ui-and-product-surface)

## Check Indirection

* run [Check Indirection](checks/indirection.mdscript.md#check-indirection)

## Check Ownership And Permission

* run [Check Ownership And Permission](checks/ownership-permission.md#check-ownership-and-permission)

## Check Review And Watcher Gates

* run [Check Review And Watcher Gates](checks/review-watcher-gates.md#check-review-and-watcher-gates)

## Check Coordinator Control

* run [Check Coordinator Control](checks/coordinator-control.md#check-coordinator-control)

## Check Publication Hygiene

* run [Check Publication Hygiene](checks/publication-hygiene.md#check-publication-hygiene)

## Determine Grade

* if `{{grade}}` is already `Blocked` or starts with `Blocked for`
  * [Report Verdict](#report-verdict)

* set `{{blocking_findings}}` to findings whose severity is included by `{{blocking_severities}}`

* set `{{residual_findings}}` to findings below `{{blocking_severities}}`

* if any finding in `{{blocking_findings}}` can be fixed autonomously
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: proof path failed or contract mismatch is repairable`
  * [Report Verdict](#report-verdict)

* if the claimed blocker is missing infrastructure, missing service setup, or missing local resources, and `{{local_resource_path}}` is available but was skipped or not inspected
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: available local resource path was not used before claiming blocked proof`
  * [Report Verdict](#report-verdict)

* if a named missing precondition, resource, access, authority, source truth, or safe target prevents running the proof path for `{{proof_scope}}` after any available repo-local stack or safe local resource path has been checked or exhausted
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
  * [Report Verdict](#report-verdict)

* if exact missing evidence, access, authority, real resource, source truth, or safe target belongs only to a broader proof scope outside `{{proof_scope}}`
  * record it under `{{proof_not_claimed}}` or `{{remaining_blockers}}`
  * continue judging the narrower `{{proof_scope}}`

* if the supplied proof supports a narrower scope but the requested verdict is final readiness, live proof, issue closure, merge, launch, release, or deployment
  * set `{{grade}}` to `Not ready for {{proof_scope}}` when the broader proof path can be run and has not passed
  * set `{{grade}}` to `Blocked for {{proof_scope}}` when the broader proof path needs a missing precondition, access, authority, real resource, source truth, or safe target
  * keep any narrower supported result as a scoped finding such as `Proven for source-health only`
  * [Report Verdict](#report-verdict)

* if this is a terminal readiness gate and `{{blind_lanes}}` is empty
  * run [Select Review Lanes](workflows/select-review-lanes.md#select-review-lanes)

* if this is a terminal readiness gate and blind sign-offs are missing or incomplete for any lane in `{{blind_lanes}}`
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: adversarial blind multi-lane review ({{blind_lanes}}) required`
  * [Report Verdict](#report-verdict)

* if this is a terminal readiness gate, `{{hsm_in_scope}}` is `true`, and no `hsm` lane sign-off exists
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: state machine in scope requires the blind hsm lane`
  * [Report Verdict](#report-verdict)

* if this is a terminal readiness gate, code changed, and no `eng-core` lane is in `{{blind_lanes}}` while engineering rules are installed
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: code terminal review requires eng-core lane selection`
  * [Report Verdict](#report-verdict)

* if no `{{blocking_findings}}` remain for `{{proof_scope}}`, all `{{contract_preconditions}}` were available, no invariant failure at `{{blocking_severities}}` remains, `{{proof_path}}` passed with current proof, and (for terminal readiness) every selected blind lane signed off with empty `p_findings`
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} at {{blocking_severities}} threshold via adversarial blind multi-lane review ({{blind_lanes}})` when blind lanes ran; otherwise `Proven for {{proof_scope}} at {{blocking_severities}} threshold` only for explicitly non-terminal intermediate passes
  * when the `hsm` or `eng-hsm` lane signed off `n/a` or `lane_applicable: false`, do not let the verdict read as state machine proof
  * [Report Verdict](#report-verdict)

## Report Verdict

* if findings exist
  * run [Add File Comment](../gabe-common/workflows/file-task-comments.md#add-file-comment) with the findings, scoped grade, questions, evidence, and stop report before any external tracker note
  * before posting findings to a GitLab issue, review, or comment, run [Resolve GitLab Sudo Alias](../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write)
  * lead with findings ordered by consequence
  * include file and line, PR/MR/issue, command, route, screenshot, trace, metric, log, or artifact pointers when available
  * when posting inline review comments on GitHub or GitLab
    * write each comment as a concise agent-shaped question that names the evidence and risk without sounding bossy, opinionated, or like a command
    * ask the smallest useful question, such as whether the current proof, contract, ownership, failure path, or user-visible behavior really satisfies the claim
    * keep the question honest: do not soften a blocker, hide the scoped grade, omit the remediation entrypoint, or imply the user personally asked the question unless they did
  * when a finding maps to implementer work
    * tell the implementer the exact remediation entrypoint, such as `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/implementation-contract.md#define-implementation-contract`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/implementation-contract.md#implement-narrowly`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`, or `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher`
  * include open questions for missing evidence, authority, or source truth
  * before asking the user, a repository owner, or another authority surface for input instead of only recording reviewer findings, run [Prepare Prompt Return Script](../gabe-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `report-verdict`
  * report `Decision: {{proof_decision}}` and `Verdict: {{grade}}` with `{{proof_scope}}`, `{{blocking_severities}}`, `{{blocking_findings}}`, `{{residual_findings}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and the narrow reason
  * set `{{stop_reason}}` to `blocked` or `review-complete`
  * report the stop reason, final scoped grade, `proof_not_claimed`, and exact `cleanup_status=...` or cleanup blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before the reviewer is closed
  * include the reviewer thread or subagent cleanup status expected from the parent as the literal `cleanup_status` field

* if no findings exist
  * run [Add File Comment](../gabe-common/workflows/file-task-comments.md#add-file-comment) with the scoped proven grade, evidence, residual risk, and stop report before any external tracker note
  * before posting the ready verdict to a GitLab issue, review, or comment, run [Resolve GitLab Sudo Alias](../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write)
  * say `No review findings for {{proof_scope}} at {{blocking_severities}} threshold. Decision: Proven for {{proof_scope}}.`
  * if broader final proof remains outside the claim
    * say `This does not claim {{proof_not_claimed}}.`
  * if the implementer should continue at a specific proof-decision step
    * include `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/prepare-mr-or-pr.md#prepare-mr-or-pr`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`, or `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/report-to-orchestrator.md#report-to-orchestrator`
  * name remaining residual risk or evidence gaps
  * set `{{stop_reason}}` to `review-complete`
  * report the stop reason, final scoped grade, `proof_not_claimed`, and exact `cleanup_status=...` or cleanup blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before the reviewer is closed
  * include the reviewer thread or subagent cleanup status expected from the parent as the literal `cleanup_status` field
* never bury a failed correction pattern in a summary
* if a failed correction pattern or durable review-policy gap remains after the verdict
  * set `{{correction_source}}` to that pattern or gap
  * run [Update Living Skills](../gabe-common/workflows/update-living-skills.md#update-living-skills)
