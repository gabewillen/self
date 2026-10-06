---
name: self-implement
description: "ALWAYS use this skill when you write or edit anything: code, docs, configs, tests, MDScripts, or scripts. Run it as a subagent, or as the main agent when the user chose direct work. State the scoped claim, hold the shared engineering rule packs, build the least code that works (Ponytail), and prove it on the real path. Compose a multi-lane self-review only when the user asks. Report before you stop."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Worker Context

* if `{{execution_mode}}` is `direct` and this agent has no parent
  * set `{{parent_reporting_path}}` to the user conversation
  * take the contract from the user request, the repository, and the local instructions
  * do the work in this process, with no worker lanes or child threads
* otherwise take these from the delegation:
  * the objective, repository, branch, merge target, grants, forbidden actions, and done state
  * the claim scope, contract, proof path, `{{self_review_requested}}`, and reporting path
  * if `{{orchestrator_reporting_path}}` is set, set `{{parent_reporting_path}}` to it
* if `{{parent_reporting_path}}` is empty, report that a parentless agent without `direct` must orchestrate, and stop
* if a necessary contract field is missing, ask the user in `direct` mode, or set `{{blocker}}` and [Report To Orchestrator](#report-to-orchestrator)
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet)
* set `{{artifact_kind}}` to `implementation`, and `{{artifact_subject}}` to `{{objective}}`
* run [Start MDScript Running Log](../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log) before you edit
* run [Log Progress](../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) after each decision, edit batch, and proof run
* if an agent can monitor or resume this lane, run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
* stay inside `{{granted_permissions}}`
  * without that exact grant, do not push, write in public, rerun CI, merge, close, release, deploy, publish, or waive proof
  * do not create execution subworkers unless the grant says so
* keep attribution and provenance truthful in commits, PR text, comments, and reports
* for GitLab writes, run [Resolve GitLab Sudo Alias](../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) as `implementer`
* [Inspect Current State](#inspect-current-state)

## Inspect Current State

* read the local instructions, the task file, the open comments, and the lane ledger
* read the repository, branch, merge target, PR, CI, review threads, and related telemetry
* for a vendored or upstream subtree, use the upstream issue and PR as the review surface
* when current source conflicts with memory or summaries, trust current source
* run [Define Implementation Contract](workflows/implementation-contract.mdscript.md#define-implementation-contract)
  * code that changes runtime behavior, services, APIs, workers, or external boundaries needs these:
    * OpenTelemetry (OTEL) telemetry, which is non-negotiable (CORE-OBS-001)
    * a cardinality analysis of each new or changed key (CORE-OBS-002)
  * a pre-1.0, undeployed replacement is a hard cutover in the same change (LOCAL-CUT-001)
* run [Select Implementation Rules](workflows/select-implementation-rules.mdscript.md#select-implementation-rules)
* run [Apply Selected Engineering Rules](workflows/apply-selected-engineering-rules.mdscript.md#apply-selected-engineering-rules)
* run [Implement Narrowly](workflows/implementation-contract.mdscript.md#implement-narrowly)
* run [Recheck Selected Engineering Rules](workflows/apply-selected-engineering-rules.mdscript.md#recheck-selected-engineering-rules)
* run [Verify Real Proof](workflows/verify-real-proof.mdscript.md#verify-real-proof)
* [Finish Change](#finish-change)

## Finish Change

* run [Decide Self Review](../self-common/workflows/self-review-consent.mdscript.md#decide-self-review)
* if `{{self_review_required}}` is `true`, run [Use Multi-Lane Review](workflows/recursive-blind-review-loop.mdscript.md#use-multi-lane-review)
  * compose it in this process, with one blind subagent for each lane, never the full `/self-review`
* otherwise record `review_gate={{review_gate}}` in the task evidence
* before a push, a PR change, or a handoff with commits, run [Commit Atomically](workflows/commit-atomically.mdscript.md#commit-atomically)
* if the lane opens or changes a PR, run [Prepare MR Or PR](workflows/prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)
* if something blocks the lane, run [Create Blocker Watcher](workflows/mr-monitor.mdscript.md#create-blocker-watcher)
* run [Cleanup Created Threads](../self-common/workflows/thread-cleanup.mdscript.md#cleanup-created-threads)
* [Report To Orchestrator](#report-to-orchestrator)

## Report To Orchestrator

* run [Report To Orchestrator](workflows/report-to-orchestrator.mdscript.md#report-to-orchestrator)
