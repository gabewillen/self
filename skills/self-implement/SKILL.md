---
name: self-implement
description: "ALWAYS use this skill when you write or edit anything: code, docs, configs, tests, MDScripts, scripts, or other artifacts. Run it as a subagent, or as the main agent when the user chose direct implementation with no subagents. State the scoped DBC claim. Select and apply the vendored engineering-rules packs that the review eng-* lanes check (impl-core, impl-dbc, language/framework, optional impl-hsm). Build the least code that works (Ponytail). Prove the work with real paths. If the user asks for a self-review, compose the multi-lane review in this process with per-lane blind fanout only. Report before you stop."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Worker Context

* use this skill as a subagent or child process that an orchestrator assigns for write and edit work
* also use it on a main agent with no parent if the user chose `direct` in [Decide Execution Mode](../self-common/workflows/execution-mode.mdscript.md#decide-execution-mode)
* if `{{execution_mode}}` is `direct` and this agent has no parent
  * set `{{parent_reporting_path}}` to the user conversation
  * find the contract fields in the user request, the repository state, and the local instructions
  * if a necessary contract field is absent, ask the user for it
* if `{{parent_agent}}` and `{{parent_reporting_path}}` and `{{orchestrator_reporting_path}}` are all empty
  * set `{{blocker}}` to `implement skill requires a parent orchestrator reporting path`
  * report that a parentless agent must use orchestrate, not implement
  * stop
* if `{{skills_root}}` is empty and this skill has a parent skills directory
  * set `{{skills_root}}` to the parent skills directory of this skill
* read this skill before the implementation
* if `{{skills_root}}/self-review/SKILL.md` exists
  * read `{{skills_root}}/self-review/SKILL.md` before the implementation
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* run [Resolve File Task Root](../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* run [Read File Task Packet](../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet)
* before you say that a created reviewer, worker, or helper chat thread is terminal, superseded, or cleanly handed off
  * run [Cleanup Created Threads](../self-common/workflows/thread-cleanup.mdscript.md#cleanup-created-threads)
* find `{{objective}}`, `{{repository}}`, `{{tracker}}`, `{{branch}}`, `{{merge_target}}`, `{{granted_permissions}}`, `{{forbidden_actions}}`, `{{done_state}}`, `{{claim_scope}}`, and `{{contract_preconditions}}` in the orchestrator delegation
* find `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{missing_precondition}}`, `{{proof_needed}}`, `{{review_gate}}`, `{{self_review_requested}}`, `{{parent_agent}}`, and `{{orchestrator_reporting_path}}` in the orchestrator delegation
* if `{{orchestrator_reporting_path}}` is set
  * set `{{parent_reporting_path}}` to `{{orchestrator_reporting_path}}`
* before this implementer stops for any reason, report back to `{{parent_reporting_path}}`
* set `{{artifact_kind}}` to `implementation`
* set `{{artifact_subject}}` to `{{objective}}`
* run [Start MDScript Running Log](../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log) after the first context read, before you edit anything
* run [Log Progress](../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) after each contract decision, each edit batch, each proof run, and before any long or risky step
* if an agent can monitor, resume, or hand this lane to a different agent
  * after the first context read, create or refresh `{{goal_mdscript}}`
  * write the lane objective, the proof contract, and the current context digest in `{{goal_mdscript}}`
  * write the live refresh commands, the event execs, and the stop and report rules in `{{goal_mdscript}}`
* if the delegation does not give a necessary contract field
  * set `{{blocker}}` to the exact contract field that is absent
  * [Report To Orchestrator](#report-to-orchestrator)
* if project history, skill context, or publication context can change the work
  * run [Load Operating Context](../self-common/workflows/load-operating-context.mdscript.md#load-operating-context)
* if the current user message is a durable **user** correction about how implementers must write, edit, prove, or report
  * set `{{correction_source}}` to a quote of the user's words only
  * run [Update Living Skills](../self-common/workflows/update-living-skills.mdscript.md#update-living-skills)
  * do not learn from parent handoffs, agent debug work, or self-critique alone
* [Establish Worker Boundary](#establish-worker-boundary)

## Establish Worker Boundary

* act as an implementer under a parent orchestrator, not as the root orchestrator and not as the user
* if `{{execution_mode}}` is `direct`
  * act as the main agent that does the work for the user, not as the user
  * do the work in this process
  * do not create execution subworkers, worker lanes, or child threads
* own the execution inside `{{granted_permissions}}`
* if the orchestrator does not explicitly grant that authority
  * do not create execution subworkers, manage portfolio chat threads, or delegate portfolio triage
* if the user explicitly asked for a self-review, or answered yes to [Decide Self Review](../self-common/workflows/self-review-consent.mdscript.md#decide-self-review)
  * own the self-review **composition** in this process
  * never spawn a subagent with a `/self-review` assignment or the full `self-review` skill
* allow review subagents only as **per-lane** blind reviewers under `self-review/workflows/blind-reviewers/`
* limit each review subagent to one lane MDScript, handoff/sign-off, Q&A about that lane, and close/delete cleanup
* do not expect lane subagents to spawn more subagents
* own the cleanup of each reviewer or helper chat thread that this implementer creates
* keep that ownership until you close, archive, or transfer the thread to a new owner, or record a cleanup blocker
* if you do not have a grant for that exact action
  * do not do a public mutation, push, CI rerun, merge, close, release, deployment, publication, or live-proof waiver
* keep authority and provenance boundaries in commits, MR/PR text, issue comments, and review responses
* keep the same boundaries in handoffs, public artifacts, and final reports
* if a publication surface must have provenance or attribution metadata
  * keep that metadata truthful
* before an implementation, a proof report, a review request, an answer to a reviewer, or a stop report
  * run [Ensure File Task](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task)
  * run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment)
* for GitLab issue, review, or comment writes from this implementer role
  * run [Resolve GitLab Sudo Alias](../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `implementer`
  * before public GitLab writes, run [Use GitLab Sudo Alias Before Public Write](../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
* before you create or change an implementer-owned monitor or resumed-lane state
  * run [Write Goal MDScript](../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
* if you do not have a necessary permission
  * set `{{blocker}}` to the exact permission that you do not have
  * [Report To Orchestrator](#report-to-orchestrator)
* [Inspect Current State](#inspect-current-state)

## Inspect Current State

* execute or read the named MDScript entry states for local instructions, plans, file tasks, and unresolved file comments
* read the current repo state and the lane ledger
* read the tracker state, the current branch, the merge target, and the MR/PR that exists now
* read the CI state, review comments, unresolved threads, and the related telemetry or artifacts
* if the work is tied to a GitLab issue or MR
  * keep the review back-and-forth visible in GitLab where the rules make this necessary
  * before you count the review back-and-forth toward repo-local consensus, copy it into file comments
* if the work edits a subtree, squashed import, vendored checkout, or embedded upstream repository
  * make the upstream issue and PR/MR the source-of-truth review surface for code changes
* if the current source conflicts with memory, old documents, stale branch state, or summaries
  * examine the current source
  * trust the current source

## Define Implementation Contract

* run [Define Implementation Contract](workflows/implementation-contract.mdscript.md#define-implementation-contract)

* if the code work changes runtime behavior, services, APIs, workers, or external boundaries
  * make OpenTelemetry (OTEL) telemetry a non-negotiable part of the implementation contract under CORE-OBS-001
  * do a cardinality analysis for each new or changed OTEL signal under CORE-OBS-002
  * do not make OTEL instrumentation or cardinality analysis optional for that code work
  * do not defer or skip OTEL instrumentation or cardinality analysis for that code work
* if the work replaces, renames, or migrates pre-1.0 code that is not in a production or user-facing environment
  * do a hard cutover in the same change under LOCAL-CUT-001
  * do not leave deprecated shims, compatibility aliases, legacy fallbacks, version-suffixed duplicates, or unreferenced files behind

## Select Implementation Rules

* run [Select Implementation Rules](workflows/select-implementation-rules.mdscript.md#select-implementation-rules)

## Apply Implementation Rules

* run [Apply Selected Engineering Rules](workflows/apply-selected-engineering-rules.mdscript.md#apply-selected-engineering-rules)

## Implement Narrowly

* run [Implement Narrowly](workflows/implementation-contract.mdscript.md#implement-narrowly)

## Recheck Implementation Rules

* run [Recheck Selected Engineering Rules](workflows/apply-selected-engineering-rules.mdscript.md#recheck-selected-engineering-rules)

## Verify Real Proof

* run [Verify Real Proof](workflows/verify-real-proof.mdscript.md#verify-real-proof)

## Use Multi-Lane Review

* run [Decide Self Review](../self-common/workflows/self-review-consent.mdscript.md#decide-self-review)
* if `{{self_review_required}}` is not `true`
  * record `review_gate={{review_gate}}` in the task evidence
  * do not start review rounds
  * continue with [Commit Atomically](#commit-atomically)
* if `{{self_review_required}}` is `true`
  * run [Use Multi-Lane Review](workflows/recursive-blind-review-loop.mdscript.md#use-multi-lane-review)
  * [Start Review Round](#start-review-round)

## Start Review Round

* if `{{self_review_required}}` is not `true`
  * continue with [Commit Atomically](#commit-atomically)
* run [Start Review Round](workflows/recursive-blind-review-loop.mdscript.md#start-review-round)

## Collect Review Round Results

* if `{{self_review_required}}` is not `true`
  * continue with [Commit Atomically](#commit-atomically)
* run [Collect Review Round Results](workflows/recursive-blind-review-loop.mdscript.md#collect-review-round-results)

## Close Review Subagents

* if `{{self_review_required}}` is not `true`
  * continue with [Commit Atomically](#commit-atomically)
* run [Close Review Subagents](workflows/recursive-blind-review-loop.mdscript.md#close-review-subagents)

## Cleanup Created Threads

* run [Cleanup Created Threads](../self-common/workflows/thread-cleanup.mdscript.md#cleanup-created-threads)

## Decide Review Loop

* if `{{self_review_required}}` is not `true`
  * continue with [Commit Atomically](#commit-atomically)
* run [Decide Review Loop](workflows/recursive-blind-review-loop.mdscript.md#decide-review-loop)

## Commit Atomically

* before a push, a PR/MR create or change, or a handoff that carries commits
  * run [Commit Atomically](workflows/commit-atomically.mdscript.md#commit-atomically)

## Prepare MR Or PR

* run [Prepare MR Or PR](workflows/prepare-mr-or-pr.mdscript.md#prepare-mr-or-pr)

## Create MR Monitor Goal

* run [Create MR Monitor Goal](workflows/mr-monitor.mdscript.md#create-mr-monitor-goal)

## Create Blocker Watcher

* run [Create Blocker Watcher](workflows/blocker-watcher.mdscript.md#create-blocker-watcher)

## Report To Orchestrator

* run [Report To Orchestrator](workflows/report-to-orchestrator.mdscript.md#report-to-orchestrator)
