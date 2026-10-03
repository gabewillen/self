---
name: self-review
description: "ALWAYS use this skill when you review a change or claim: code, docs, MDScripts, configs, instructions, automations, publications, diffs, or readiness. Compose multi-lane blind review in this process, and never nest the full skill. Always run rules/security/completeness and the selected eng-* packs. If a state machine is in scope, also run deep hsm. Aggregate the independent lane sign-offs. Emit scoped Proven-for or Blocked-for verdicts."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Identify Review Scope

* this skill must have a parent: an orchestrator or implementer composes it, or gives per-lane blind MDScripts to subagents
* never treat full multi-lane review as a parentless root role
* run multi-lane blind review only on a process that can spawn subagents
* never delegate this full skill again; spawn only per-lane blind MDScripts
* if `{{parent_agent}}` and `{{parent_reporting_path}}` are both empty
  * if no implementer or orchestrator that spawned this review owns its composition
    * set `{{blocker}}` to `review skill requires a parent implementer or orchestrator reporting path`
    * report that a parentless agent must use orchestrate, and compose review from orchestrate or implement
    * stop
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `reviewer`
* run [Resolve File Task Root](../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* if the reviewed artifact has a file task
  * run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet)
* find `{{parent_agent}}` and `{{parent_reporting_path}}`
* before you stop, close, delete, archive, or go silent
  * report the scoped grade or blocker to the implementer or orchestrator that spawned you
* before the reviewer stops, put the cleanup expectation in the stop report
  * write that the parent must close, archive, or delete this reviewer chat thread or subagent, or record a transfer/cleanup blocker
  * write that the parent can delete it only when explicitly allowed
* find `{{artifact_type}}`, `{{artifact}}`, `{{intended_done_state}}`, `{{merge_target}}`, `{{tracker}}`, `{{proof_scope}}`, `{{proof_claim}}`, `{{contract_preconditions}}`, and `{{contract_postconditions}}`
* find `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, `{{remaining_blockers}}`, `{{missing_precondition}}`, `{{proof_decision}}`, and `{{public_surface}}`
* find `{{review_round}}` and `{{blocking_severities}}` in the neutral review packet
* if code changed and `{{blocking_severities}}` is absent
  * set `{{blocking_severities}}` to `all findings`
* before you judge, classify `{{proof_scope}}` as a typed scope: `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`
* use Design by Contract as the format of the proof decision. A contract makes proof decidable, but not always available.
* if the decision is for PR/MR acceptance
  * make the terminal decision `Proven for {{proof_scope}}` or `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
* if the proof failed or is stale, mismatched, or incomplete, and the necessary preconditions are available
  * use `Not ready for {{proof_scope}}` as a repair state
* do not use `Not ready for {{proof_scope}}` as the terminal MR acceptance state
* treat missing infrastructure as a setup question before you treat it as a blocker
* if a repo-local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource can satisfy the precondition
  * treat the proof path as still available
* if the author asks for vague readiness
  * make the review name the narrowest claim that the given proof actually supports
  * keep broader proof gaps as `{{proof_not_claimed}}` or `{{remaining_blockers}}`
* if broader judgment, delegation, permission, or coordination is necessary
  * run `/mdscript-exec {{skills_root}}/self/SKILL.md`
* if the current request is a durable **user** correction about how reviewers must judge, falsify, or grade
  * set `{{correction_source}}` to a quote of the user's words only
  * run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)
* use this skill to falsify readiness, not to rubber-stamp the narrative of the author
* [Gather Current Source](#gather-current-source)

## Gather Current Source

* before you judge, read the current source of truth
* prefer live repo state, current file task state, unresolved file comments, goal MDScript files, and lane ledger entries over memory
* prefer the current issue or PR/MR state, documentation source, test and route output, screenshots, telemetry, and artifacts over memory
* do not let the installed skill context override current source, live evidence, local instructions, or the current user request
* if necessary source truth is not available for the proof path
  * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing source truth`
  * set `{{blocker}}` to the exact missing source truth
  * [Report Verdict](#report-verdict)
* before you return a verdict, approval, blocker, or stale-review answer for a GitHub PR
  * examine the current GitHub head SHA, base branch, mergeability/conflict state, checks, reviews, review comments, and conversation threads
  * examine author replies, `changes_requested`, review-request or re-review signals, and comments newer than the last reviewer signal
  * if the head, author replies, re-review requests, thread states, or unresolved conversations changed
    * run the review again against the current head and current discussion state, not the earlier verdict
  * if a `feedback_posted`, `github_approval_sent`, green-check reaction, or private reviewer memory names an old head, or newer GitHub changes need action
    * treat that earlier signal as stale
  * if GitHub access is not available
    * set the blocker to the exact missing GitHub source truth
    * do not claim that the previous review is still current
* [Build Neutral Review Packet](#build-neutral-review-packet)

## Build Neutral Review Packet
* run [Build Neutral Review Packet](workflows/neutral-review-packet.mdscript.md#build-neutral-review-packet)

## Check Goal And Contract
* run [Check Goal And Contract](checks/goal-and-contract.mdscript.md#check-goal-and-contract)

## Check Evidence Boundary
* run [Check Evidence Boundary](checks/evidence-boundary.mdscript.md#check-evidence-boundary)

## Check UI And Product Surface
* run [Check UI And Product Surface](checks/evidence-boundary.mdscript.md#check-ui-and-product-surface)

## Check Indirection
* run [Check Indirection](checks/indirection.mdscript.md#check-indirection)

## Check Ownership And Permission
* run [Check Ownership And Permission](checks/ownership-permission.mdscript.md#check-ownership-and-permission)

## Check Review And Watcher Gates
* run [Check Review And Watcher Gates](checks/review-watcher-gates.mdscript.md#check-review-and-watcher-gates)

## Check Coordinator Control
* run [Check Coordinator Control](checks/coordinator-control.mdscript.md#check-coordinator-control)

## Check Publication Hygiene
* run [Check Publication Hygiene](checks/publication-hygiene.mdscript.md#check-publication-hygiene)

## Determine Grade

* if `{{grade}}` is already `Blocked` or starts with `Blocked for`
  * [Report Verdict](#report-verdict)
* set `{{blocking_findings}}` to the findings with a severity in `{{blocking_severities}}`
* set `{{residual_findings}}` to findings below `{{blocking_severities}}`
* if an agent can fix a finding in `{{blocking_findings}}` autonomously
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: proof path failed or contract mismatch is repairable`
  * [Report Verdict](#report-verdict)
* if the claimed blocker is missing infrastructure, missing service setup, or missing local resources
  * if the author did not use or examine the available `{{local_resource_path}}`
    * set `{{grade}}` to `Not ready for {{proof_scope}}`
    * set `{{proof_decision}}` to `Not accepted: available local resource path was not used before claiming blocked proof`
    * [Report Verdict](#report-verdict)
* if a named missing precondition, resource, access, authority, source truth, or safe target prevents the proof path for `{{proof_scope}}`
  * if you examined or used all available repo-local stacks and safe local resource paths
    * set `{{grade}}` to `Blocked for {{proof_scope}}`
    * set `{{proof_decision}}` to `Blocked for {{proof_scope}}: missing {{missing_precondition}}`
    * [Report Verdict](#report-verdict)
* if missing evidence, access, authority, real resource, source truth, or safe target is only for a broader scope outside `{{proof_scope}}`
  * record it under `{{proof_not_claimed}}` or `{{remaining_blockers}}`
  * continue to judge the narrower `{{proof_scope}}`
* if the given proof supports only a narrower scope
  * if the requested verdict is final readiness, live proof, issue closure, merge, launch, release, or deployment
    * if the broader proof path can run and did not pass
      * set `{{grade}}` to `Not ready for {{proof_scope}}`
    * if the broader proof path needs a missing precondition, access, authority, real resource, source truth, or safe target
      * set `{{grade}}` to `Blocked for {{proof_scope}}`
    * keep each narrower supported result as a scoped finding, for example `Proven for source-health only`
    * [Report Verdict](#report-verdict)
* if this is a terminal readiness gate and `{{blind_lanes}}` is empty
  * run [Select Review Lanes](workflows/select-review-lanes.mdscript.md#select-review-lanes)
* if this is a terminal readiness gate and a lane in `{{blind_lanes}}` has a missing or incomplete blind sign-off
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: adversarial blind multi-lane review ({{blind_lanes}}) required`
  * [Report Verdict](#report-verdict)
* if this is a terminal readiness gate, `{{hsm_in_scope}}` is `true`, and no `hsm` lane sign-off exists
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: state machine in scope requires the blind hsm lane`
  * [Report Verdict](#report-verdict)
* if this is a terminal readiness gate, code changed, engineering rules are installed, and `{{blind_lanes}}` has no `eng-core` lane
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: code terminal review requires eng-core lane selection`
  * [Report Verdict](#report-verdict)
* if no `{{blocking_findings}}` remain for `{{proof_scope}}` and all `{{contract_preconditions}}` were available
  * if no invariant failure at `{{blocking_severities}}` remains and `{{proof_path}}` passed with current proof
    * if this is not a terminal readiness gate, or each selected blind lane signed off with empty `p_findings`
      * set `{{grade}}` to `Proven for {{proof_scope}}`
      * if blind lanes ran
        * set `{{proof_decision}}` to `Proven for {{proof_scope}} at {{blocking_severities}} threshold via adversarial blind multi-lane review ({{blind_lanes}})`
      * if blind lanes did not run and this is an explicitly non-terminal intermediate pass
        * set `{{proof_decision}}` to `Proven for {{proof_scope}} at {{blocking_severities}} threshold`
      * if the `hsm` or `eng-hsm` lane signed off `n/a` or `lane_applicable: false`
        * do not let the verdict read as state machine proof
      * [Report Verdict](#report-verdict)

## Report Verdict

* if findings exist
  * run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the findings, scoped grade, questions, evidence, and stop report before any external tracker note
  * before you post findings to a GitLab issue, review, or comment, run [Resolve GitLab Sudo Alias](../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
  * put the findings first, in the order of their consequence
  * if they are available, include pointers to the file and line, PR/MR/issue, command, route, screenshot, trace, metric, log, or artifact
  * if you post inline review comments on GitHub or GitLab
    * write each comment as a short agent-shaped question about the evidence and risk, not a bossy or opinionated command
    * ask the smallest useful question, for example: do the proof, contract, ownership, failure path, or user-visible behavior satisfy the claim?
    * keep the question honest: do not soften a blocker, hide the scoped grade, or omit the remediation entrypoint
    * do not imply that the user personally asked the question if the user did not ask it
  * if a finding maps to implementer work
    * tell the implementer the exact remediation entrypoint, for example `/mdscript-exec {{skills_root}}/self-implement/workflows/implementation-contract.mdscript.md#define-implementation-contract`, `/mdscript-exec {{skills_root}}/self-implement/workflows/implementation-contract.mdscript.md#implement-narrowly`, `/mdscript-exec {{skills_root}}/self-implement/workflows/verify-real-proof.mdscript.md#verify-real-proof`, `/mdscript-exec {{skills_root}}/self-implement/workflows/mr-monitor.mdscript.md#create-mr-monitor-goal`, or `/mdscript-exec {{skills_root}}/self-implement/workflows/blocker-watcher.mdscript.md#create-blocker-watcher`
  * include open questions for missing evidence, authority, or source truth
  * if you ask the user, a repository owner, or another authority surface for input, not only record findings
    * first, run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `report-verdict`
  * report `Decision: {{proof_decision}}` and `Verdict: {{grade}}` with `{{proof_scope}}`, `{{blocking_severities}}`, `{{blocking_findings}}`, `{{residual_findings}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and the narrow reason
  * set `{{stop_reason}}` to `blocked` or `review-complete`
* if no findings exist
  * run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the scoped proven grade, evidence, residual risk, and stop report before any external tracker note
  * before you post the ready verdict to a GitLab issue, review, or comment, run [Resolve GitLab Sudo Alias](../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
  * say `No review findings for {{proof_scope}} at {{blocking_severities}} threshold. Decision: Proven for {{proof_scope}}.`
  * if broader final proof remains outside the claim
    * say `This does not claim {{proof_not_claimed}}.`
  * if the implementer must continue at a specific proof-decision step
    * include `/mdscript-exec {{skills_root}}/self-implement/workflows/prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr`, `/mdscript-exec {{skills_root}}/self-implement/workflows/mr-monitor.mdscript.md#create-mr-monitor-goal`, or `/mdscript-exec {{skills_root}}/self-implement/workflows/report-to-orchestrator.mdscript.md#report-to-orchestrator`
  * name the remaining residual risk or evidence gaps
  * set `{{stop_reason}}` to `review-complete`
* in both cases, report the stop reason, final scoped grade, `proof_not_claimed`, and exact `cleanup_status=...` or cleanup blocker
* send this report to `{{parent_agent}}` or `{{parent_reporting_path}}` before the parent closes the reviewer
* include the cleanup status that the parent expects for the reviewer thread or subagent as the literal `cleanup_status` field
* never bury a failed correction pattern in a summary
* do not run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills) for gaps that a reviewer invented
* only the durable corrections of the user can change skills
