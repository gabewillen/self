---
name: gabe-review
description: "Review rolling code diffs, PR/MR readiness, replies, MDScript and documentation changes, instructions, automations, publications, and final reports using a task-appropriate gpt-5.6-family model and reasoning level. Use for diminishing-severity recursive code review, single-pass non-code review, content-addressed review baselines, final cumulative blind review, DBC proof decisions, scoped verdicts, executable MDScript contracts, evidence and authority boundaries, UI proof, runtime/provider equivalence, source-owner sync, permissions, provenance drift, proof inflation, stale assumptions, state-machine gaps, model/data/eval source-currentness, coordinator control, current review state, and publication hygiene. Treat MDScripts exactly like documentation for review."
---

<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Identify Review Scope

* run [Select Configured Model And Reasoning](../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `reviewer`

* run [Resolve File Task Root](../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Read File Task Packet](../gabe-common/workflows/file-task-comments.md#read-file-task-packet) when the reviewed artifact has a file task

* infer `{{parent_agent}}` and `{{parent_reporting_path}}`; reviewers must report their scoped grade or blocker to the spawning implementer before they stop, close, delete, archive, or go silent

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

* if broader Gabe-shaped judgment, delegation, permission, or coordination is needed
  * read `{{repo_root}}/skills/gabe/SKILL.md`

* if the review is high-stakes, ambiguous, maintaining this skill, or likely shaped by Agent Adventures history
  * read `references/correction-patterns.md`

* search or read Agent Adventures only when the installed skills and `references/correction-patterns.md` do not carry enough current context, appear stale, are contradicted by a new human correction, or the review is explicitly about refreshing blog lessons into skills

* use this skill to falsify readiness, not to rubber-stamp the author's narrative

* [Gather Current Source](#gather-current-source)

## Gather Current Source

* read the current source of truth before judging

* prefer live repo state, current file task state, unresolved file comments, goal MDScript files, lane ledger entries, current issue or PR/MR state, current blog files, current test output, current route output, current screenshots, current telemetry, and current artifacts over memory

* if Agent Adventures context may shape the verdict
  * first use the installed Gabe skills and `references/correction-patterns.md` as the compiled Agent Adventures context
  * verify and read the canonical blog checkout only when the compiled context is missing, stale, contradicted, or insufficient for the verdict
  * if reading the blog is required, read only the bounded context needed: `about.qmd`, onboarding posts when the needed onboarding rule is not already carried by skills, the relevant project page, and 1-3 recent or keyword-relevant posts

* do not let blog context override current source, live evidence, local instructions, or the user's current request

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

* if `{{merge_target}}` is unknown
  * use the PR base, MR target, default branch, or `main` only when no more specific target exists

* if reviewing code, PR, MR, or branch readiness
  * run [Resolve Review Baseline](workflows/rolling-code-review.md#resolve-review-baseline)
  * use `{{review_diff}}` as the primary review object for `{{review_diff_scope}}`

* include only neutral supporting code paths, contracts, schemas, tests, docs, artifacts, routes, or ownership surfaces needed to understand the diff

* include the current task file, relevant unresolved comments, and lane ledger entries as neutral source material, but do not use a previous reviewer verdict as the frame for a fresh blind review

* treat an initial review as cumulative, each repair review as a rolling delta from the last completed review snapshot, and the terminal readiness gate as one fresh cumulative blind review

* for recursive code review, make every round-1 finding blocking, only P1 and P2 blocking in round 2, and only P1 blocking in round 3 and later

* report every finding with an explicit severity even when it falls below `{{blocking_severities}}`

* preserve below-threshold findings as `{{residual_findings}}` without requesting another pass

* apply the recursive rolling-review cycle only when code changed

* for MDScript, instruction, documentation, plan, task, comment, publication, or other non-code changes, run exactly one fresh review plus the applicable direct proof and do not recurse after repairs

* persist review baselines only under `~/.agents/projects/{{project_name}}/artifacts/review-baselines/`; do not put review control state in the source repository

* do not use the author's preferred verdict, intended fix narrative, curated explanation, or another reviewer's findings as the initial frame unless explicitly reconciling visible disagreement

* run [Check Goal And Contract](checks/goal-and-contract.md#check-goal-and-contract)

* run [Check Evidence Boundary](checks/evidence-boundary.md#check-evidence-boundary)

* run [Check UI And Product Surface](checks/evidence-boundary.md#check-ui-and-product-surface)

* run [Check Ownership And Permission](checks/ownership-permission.md#check-ownership-and-permission)

* run [Check Review And Watcher Gates](checks/review-watcher-gates.md#check-review-and-watcher-gates)

* run [Check Coordinator Control](checks/coordinator-control.md#check-coordinator-control)

* run [Check Publication Hygiene](checks/publication-hygiene.md#check-publication-hygiene)

* if reviewing a skill, instruction, validator, scorer, harness, or agent workflow whose claim is that future agents will behave correctly
  * require executable or black-box proof against exact contract fields and current durable artifacts, not only source inspection, coached prompts, substring matches, keyword hits, or author-written examples

* if reviewing model training, data extraction, eval harnesses, or adapter-selection work
  * require current source-corpus identity, structured decision-case or held-out eval contracts, provenance, and fail-closed blockers for stale sources, missing adapters, empty artifacts, or promotion claims unsupported by real candidate proof

* if reviewing a dependency, provider, release, hardware path, runtime backend, or patch-level swap whose API shape stayed similar
  * require the actual runtime path, platform, package diff, owner-surface contract, known-good fallback, rollout state, release or merge owner, and upstream/downstream cause separation when a resolver, adapter, dashboard, eval, or review surface could mask the source failure before accepting behavior, deployment, or live-proof claims
  * reject local green proof, unchanged names, or successful setup evidence as proof that the production runtime, hardware path, or dependency owner has accepted the swap

* if reviewing subtree, vendored import, embedded repository, mirror, or source-sync work
  * require the source-owning repository and intended source baseline to be explicit and current
  * treat a parent or integration checkout sync as source-health only unless the upstream owner review, CI, history decision, and release or merge record prove a broader claim
  * reject resolving local overlays, divergent histories, or child-source conflicts in the parent checkout when that would bypass the source owner or choose history on the owner's behalf

* if reviewing work where model narration, transcript text, digests, summaries, or inferred labels compete with typed product state, tool logs, tracker state, review state, metrics, dashboards, or other owner records
  * require the owner record to decide or mutate state; narrative may explain only when bound to that record

* if reviewing observation-only, telemetry-only, shadow-mode, dry-run, or measurement-first work
  * require the contract to prove what data is observed, what inputs are snapshotted, what delivery, mutation, user-facing, or downstream side effects are excluded, and which broader delivery or live-proof gates remain outside the claim
  * reject observation proof that reads mutable live state after the boundary, silently emits downstream actions, or reports source-health evidence as caller-facing, delivery, deployment, or live-proof readiness

* if reviewing delegated model, adapter, subagent, navigator, or autonomous-driver work
  * require the chosen runtime or agent identity to be explicit, current, visible at the owning control surface, and bound to the authority grant
  * reject silent fallback from a requested local model, hosted model, adapter, navigator, driver, or helper agent to a more convenient substitute
  * require setup failures, missing credentials, hidden or ineligible agents, unavailable adapters, stale cursors, and normal-stop handoffs to fail closed or route through the same owner-input path a human would use

* [Determine Grade](#determine-grade)

## Check Goal And Contract

* run [Check Goal And Contract](checks/goal-and-contract.md#check-goal-and-contract)

## Check Evidence Boundary

* run [Check Evidence Boundary](checks/evidence-boundary.md#check-evidence-boundary)

## Check UI And Product Surface

* run [Check UI And Product Surface](checks/evidence-boundary.md#check-ui-and-product-surface)

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

* if no `{{blocking_findings}}` remain for `{{proof_scope}}`, all `{{contract_preconditions}}` were available, no invariant failure at `{{blocking_severities}}` remains, and `{{proof_path}}` passed with current proof
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} at {{blocking_severities}} threshold`
  * [Report Verdict](#report-verdict)

## Report Verdict

* if findings exist
  * run [Add File Comment](../gabe-common/workflows/file-task-comments.md#add-file-comment) with the findings, scoped grade, questions, evidence, and stop report before any external tracker note
  * before posting findings to a GitLab issue, review, or comment, run [Resolve GitLab Sudo Alias](../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write)
  * lead with findings ordered by consequence
  * include file and line, PR/MR/issue, command, route, screenshot, trace, metric, log, or artifact pointers when available
  * when posting inline review comments on GitHub or GitLab
    * write each comment as a concise Gabe-shaped question that names the evidence and risk without sounding bossy, opinionated, or like a command
    * ask the smallest useful question, such as whether the current proof, contract, ownership, failure path, or user-visible behavior really satisfies the claim
    * keep the question honest: do not soften a blocker, hide the scoped grade, omit the remediation entrypoint, or imply human Gabe personally asked the question unless he did
  * when a finding maps to implementer work
    * tell the implementer the exact remediation entrypoint, such as `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/implementation-contract.md#define-implementation-contract`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/implementation-contract.md#implement-narrowly`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/verify-real-proof.md#verify-real-proof`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`, or `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/blocker-watcher.md#create-blocker-watcher`
  * include open questions for missing evidence, authority, or source truth
  * before asking Gabe, the user, a repository owner, or another authority surface for input instead of only recording reviewer findings, run [Prepare Prompt Return Script](../gabe-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this skill and `{{return_resume_heading}}` set to `report-verdict`
  * report `Decision: {{proof_decision}}` and `Verdict: {{grade}}` with `{{proof_scope}}`, `{{blocking_severities}}`, `{{blocking_findings}}`, `{{residual_findings}}`, `{{contract_preconditions}}`, `{{contract_postconditions}}`, `{{contract_invariants}}`, `{{proof_path}}`, `{{local_resource_path}}`, `{{proof_supplied}}`, `{{proof_not_claimed}}`, and the narrow reason
  * set `{{stop_reason}}` to `blocked` or `review-complete`
  * report the stop reason, final scoped grade, `proof_not_claimed`, and exact `cleanup_status=...` or cleanup blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before the reviewer is closed
  * include the reviewer thread or subagent cleanup status expected from the parent as the literal `cleanup_status` field

* if no findings exist
  * run [Add File Comment](../gabe-common/workflows/file-task-comments.md#add-file-comment) with the scoped proven grade, evidence, residual risk, and stop report before any external tracker note
  * before posting the ready verdict to a GitLab issue, review, or comment, run [Resolve GitLab Sudo Alias](../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write)
  * say `No Gabe-review findings for {{proof_scope}} at {{blocking_severities}} threshold. Decision: Proven for {{proof_scope}}.`
  * if broader final proof remains outside the claim
    * say `This does not claim {{proof_not_claimed}}.`
  * if the implementer should continue at a specific proof-decision step
    * include `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/prepare-mr-or-pr.md#prepare-mr-or-pr`, `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/mr-monitor.md#create-mr-monitor-goal`, or `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/report-to-orchestrator.md#report-to-orchestrator`
  * name remaining residual risk or evidence gaps
  * set `{{stop_reason}}` to `review-complete`
  * report the stop reason, final scoped grade, `proof_not_claimed`, and exact `cleanup_status=...` or cleanup blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before the reviewer is closed
  * include the reviewer thread or subagent cleanup status expected from the parent as the literal `cleanup_status` field

* never bury a failed Gabe correction pattern in a summary
