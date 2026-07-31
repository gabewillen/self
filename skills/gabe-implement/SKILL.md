---
name: gabe-implement
description: "Execute delegated Gabe-shaped implementation lanes using project control records from ~/.agents/projects/project-name/ and a model and effort level selected for the task. This is the primary skill orchestrators hand to worker subagents. Use when a Gabe orchestrator assigns implementation, repo repair, issue work, MR/PR ownership, verification, review repair, blocker watching, or release prep. State the scoped DBC claim and proof boundaries, try local stacks before infrastructure blockers, execute and directly validate MDScript records, report before stopping, own gabe-review composition in-process (never re-delegate the full gabe-review skill), spawn only per-lane blind reviewers for multi-lane sign-off, preserve GitLab aliasing, and keep gabe-orchestrate updated until merge or close."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Worker Context

* read this skill and `{{repo_root}}/skills/gabe-review/SKILL.md` before implementation

* run [Select Configured Model And Reasoning](../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `implementer`

* run [Resolve File Task Root](../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Read File Task Packet](../gabe-common/workflows/file-task-comments.md#read-file-task-packet)

* run [Cleanup Created Threads](../gabe-common/workflows/thread-cleanup.md#cleanup-created-threads) before claiming any created reviewer, worker, or helper chat thread is terminal, superseded, or cleanly handed off

* read the orchestrator delegation and infer `{{objective}}`, `{{repository}}`, `{{tracker}}`, `{{branch}}`, `{{merge_target}}`, `{{granted_permissions}}`, `{{forbidden_actions}}`, `{{done_state}}`, `{{claim_scope}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{missing_precondition}}`, `{{proof_needed}}`, `{{review_gate}}`, `{{parent_agent}}`, and `{{orchestrator_reporting_path}}`

* set `{{parent_reporting_path}}` to `{{orchestrator_reporting_path}}`; this implementer must report back there before stopping for any reason

* when this lane will be monitored, resumed, or handed across agents, create or refresh `{{goal_mdscript}}` after the first context read with the lane objective, proof contract, current context digest, live refresh commands, event execs, and stop/report rules

* if required delegation details are missing
  * set `{{blocker}}` to the exact missing contract field
  * [Report To Orchestrator](#report-to-orchestrator)

* run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context) when project history, Gabe context, or publication context may shape the work

* [Establish Worker Boundary](#establish-worker-boundary)

## Establish Worker Boundary

* act as a Gabe-shaped implementer, not human Gabe and not the root orchestrator

* own execution inside `{{granted_permissions}}`

* do not create execution subworkers, manage portfolio chat threads, or delegate portfolio triage unless the orchestrator explicitly grants that authority

* own gabe-review **composition** in this process; never spawn a subagent whose assignment is `/gabe-review` or the full `gabe-review` skill
* allow review subagents only as **per-lane** blind reviewers under `gabe-review/workflows/blind-reviewers/`; limit them to one lane MDScript, handoff/sign-off, Q&A about that lane, and close/delete cleanup
* do not expect lane subagents to spawn further subagents

* treat every reviewer or helper chat thread this implementer creates as cleanup-owned by this implementer until it is closed, archived, transferred with a new owner, or recorded as a cleanup blocker

* do not perform public mutation, push, CI rerun, merge, close, release, deployment, publication, or live-proof waiver unless granted for that exact action

* preserve authority and provenance boundaries in commits, MR/PR text, issue comments, review responses, handoffs, public writing, and final reports; when a publication surface requires provenance or attribution metadata, keep it truthful

* before implementation, proof reporting, review request, answer to a reviewer, or stop report
  * run [Ensure File Task](../gabe-common/workflows/file-task-comments.md#ensure-file-task)
  * run [Add File Comment](../gabe-common/workflows/file-task-comments.md#add-file-comment)

* for GitLab issue, review, or comment writes from this implementer role
  * run [Resolve GitLab Sudo Alias](../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `implementer`
  * run [Use GitLab Sudo Alias Before Public Write](../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write) before public GitLab writes

* before creating or updating any implementer-owned monitor or resumed-lane state
  * run [Write Goal MDScript](../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)

* if required authority is missing
  * set `{{blocker}}` to the exact missing permission
  * [Report To Orchestrator](#report-to-orchestrator)

* [Inspect Current State](#inspect-current-state)

## Inspect Current State

* execute or read the named MDScript entry states for local instructions, plans, file tasks, and unresolved file comments
* read current repo state and the lane ledger
* read tracker state, current branch, merge target, and existing MR/PR
* read CI state, review comments, unresolved threads, and relevant telemetry or artifacts

* if the work is tied to a GitLab issue or MR
  * keep review back-and-forth visible in GitLab where required
  * mirror the same review back-and-forth into file comments before counting it toward repo-local consensus

* if the work edits a subtree, squashed import, vendored checkout, or embedded upstream repository
  * require the upstream issue and PR/MR as the source-of-truth review surface for code changes

* if current source conflicts with memory, old documents, stale branch state, or summaries
  * trust current source after verifying it

## Define Implementation Contract

* run [Define Implementation Contract](workflows/implementation-contract.md#define-implementation-contract)

## Implement Narrowly

* run [Implement Narrowly](workflows/implementation-contract.md#implement-narrowly)

## Verify Real Proof

* run [Verify Real Proof](workflows/verify-real-proof.md#verify-real-proof)

## Use Gabe Review

* run [Use Gabe Review](workflows/recursive-blind-review-loop.md#use-gabe-review)

## Start Review Round

* run [Start Review Round](workflows/recursive-blind-review-loop.md#start-review-round)

## Collect Review Round Results

* run [Collect Review Round Results](workflows/recursive-blind-review-loop.md#collect-review-round-results)

## Close Review Subagents

* run [Close Review Subagents](workflows/recursive-blind-review-loop.md#close-review-subagents)

## Cleanup Created Threads

* run [Cleanup Created Threads](../gabe-common/workflows/thread-cleanup.md#cleanup-created-threads)

## Decide Review Loop

* run [Decide Review Loop](workflows/recursive-blind-review-loop.md#decide-review-loop)

## Prepare MR Or PR

* run [Prepare MR Or PR](workflows/prepare-mr-or-pr.md#prepare-mr-or-pr)

## Create MR Monitor Goal

* run [Create MR Monitor Goal](workflows/mr-monitor.md#create-mr-monitor-goal)

## Create Blocker Watcher

* run [Create Blocker Watcher](workflows/blocker-watcher.md#create-blocker-watcher)

## Report To Orchestrator

* run [Report To Orchestrator](workflows/report-to-orchestrator.md#report-to-orchestrator)
