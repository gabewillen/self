<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Run Review Checks

* for each rule that fails below, add a finding with a severity, an evidence pointer, and the consequence
* run each check state in this file whose condition matches the artifact
* return to the caller

## Check Goal And Contract

* the artifact names its objective, done state, blockers, inputs, outputs, owner, failure behavior, and evidence
* the work starts from a contract, not a patch, and does not hide scope changes
* a PR names its preconditions, postconditions, invariants, and proof path
* async, lifecycle, retry, timeout, coordination, or visible behavior names these items:
  * states, events, guards, typed inputs and outputs, and failures
  * metrics, the owner, rollback, and teardown
* model judgment does not rebuild a fact that typed data, events, or telemetry already give
* an agent task, comment, plan, instruction, handoff, or continuation is executable MDScript
  * it has the header, stable states, one action for each bullet, failure branches, and a re-entry command
  * a bullet that explains why, without an action, belongs in a reference file
* if MDScript changed, run `node scripts/validate-mdscript.mjs <changed paths>`, and quote each error and each new warning
* each `{{variable}}` that builds a path or command is set by a state or the caller
* each branch jumps to a state or stops, and a routing state does not fall into the next state
* a prompt for input names the decision, the return script, the resume command, the saved context, and the resume heading
* a role agent records `model`, `reasoning`, and `model_selection_basis` that fit its task

## Check Evidence Boundary

* the claim has a typed `{{proof_scope}}` and the proof that matches it:
  * `source-health`: diff, contracts, lint, types, focused tests, static audits
  * `ci-repair`: the failing check and the rerun
  * `audit-completion`: the finding, the correction, and proof that it is closed
  * `blocker-note-completion`: the record of the blocker and the next owner
  * `publication`: the render, the pipeline, and the served route
  * `live-proof`: the real system, provider, device, UI, service, or telemetry
  * readiness scopes (`merge`, `issue-close`, `release`, `deployment`): every narrower proof and gate
* `Proven` means each precondition was available, each invariant held, and the proof passed now
* `Blocked` means a named external precondition is missing after the local resource path was tried
* `Not ready` means the proof failed, is stale or incomplete, or does not match the contract
  * a failed CI budget or test invariant is `Not ready` for source health, not a missing resource
* a resource-dependent precondition names its `{{local_resource_path}}`
* a blocked claim for missing infrastructure is wrong if an unused local path exists
  * a local path is a local stack, preflight, dev server, fixture, or compose file
* a vague `ready` gets the narrowest scope that the proof supports, as `Proven for {{proof_scope}} only`
* narrower proof never satisfies a broader claim
* a missing broader proof never blocks a valid narrow claim
* mixed signals (green CI, routes, stale screenshots, Draft state, traces, benchmarks) must map to exact scopes
* live and readiness scopes need real-system artifacts
* mocks, fakes, fixtures, canned responses, and stubs are never final proof when a real resource can run
  * if you can stand up the real resource, grade `Not ready`
  * if you cannot without outside help, grade `Blocked`

## Check UI And Product Surface

* use this check only if the artifact changes or claims a visible surface
* each visible feature needs a current, inspected snapshot from the real browser or device
  * a feature is a button, table, graph, widget, workflow, empty state, breakpoint, CLI command, or selector
* reject these as feature proof:
  * one broad screenshot, or a DOM or selector assertion
  * a stale or uninspected snapshot, or a mock-backed route

## Check Indirection

* for each layer that the change adds or keeps, search its call sites and implementers
  * a layer is a wrapper, forwarder, alias, re-export, adapter, facade, helper, interface, factory, config hop, or MDScript state
* keep a layer if it computes or removes real duplication
  * it computes if it derives, branches, validates, holds an invariant, converts, or absorbs a failure
* otherwise add a finding with the direct call that replaces the layer
  * use `P1` if the layer hides a failure or a decision, else `P2`
* reject these reasons: "for consistency", "to swap it later", "to keep the API stable", "for testability"
* add a finding for each shape that computes nothing:
  * a pass-through to one callee, a rename or re-export of a reachable name, an interface with one implementer
  * a parameter with one value everywhere, a variable read once at once, a bare getter or setter
  * a factory or constructor that only assigns, an override that only calls its parent
  * a rethrow without context, a one-field type without an invariant, a test that only checks forwarding
* drop a finding whose fix copies logic to two places
* drop a finding that removes an MDScript state that agents enter by heading

## Check Ownership And Permission

* triage, edit, push, public write, CI rerun, merge, release, deployment, close, publication, and proof waiver are separate grants
* add a finding for each of these:
  * a default-branch merge without exact permission, or a public write without authority
  * a proof waiver taken from other grants, or thread cleanup that hides unfinished work
* subtree, vendored, or embedded upstream code needs the upstream issue and PR as its review surface
* user, assistant, automation, worker, reviewer, and author provenance stay separate and supported by evidence
* for a GitLab review write, run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) as `reviewer`
  * if the alias is missing for a necessary public record, set `{{grade}}` to `Blocked` and `{{blocker}}` to it

## Check Review And Watcher Gates

* code changed: focused and broader tests, real-resource proof, one fresh blind reviewer for each lane and round
  * `{{blocking_severities}}` is `all findings` in round 1, `P1,P2` in round 2, and `P1` after that
  * `{{review_mode}}` is `initial-cumulative`, `repair-delta`, or `final-cumulative`
  * a repair delta records its snapshot, and the terminal gate has one fresh `final-cumulative` review
* no code changed: exactly one fresh review with direct validation, and no recursive loop
  * `{{review_mode}}` is `single-non-code`
* the parent composes the review, and each lane is a fresh subagent
  * reused or open reviewers and missing cleanup are findings
* the author does not frame the packet, and each finding has an honest severity
* residuals stay visible without a new round
* the grade names the exact scope, and narrow proof is not readiness
* each lane reports its grade, stop reason, and blocker before it closes
* a changed state machine needs a blind `hsm` lane at the terminal gate
  * an `n/a` needs its own search evidence, and no other lane stands in for it
* GitLab review records are visible on the MR through `-reviewer` aliases
  * threads resolve only after the concern closes
* a root or coordinator does not edit code, own implementation, review code, or spawn code reviewers
* an implementer that owns a PR monitors it until merge or close
  * it watches CI, reviews, threads, base drift, conflicts, draft state, mergeability, and tickets
  * it runs and reports the exact event jumps
  * it treats CI failures as repair input, except for a default-branch merge
* a PR handed to an orchestrator has a goal with these items:
  * the re-entry, owner, lane, source of truth, and stop condition
  * the grants, the reporting path, and the next jump
* a project goal exists as MDScript under the project goals, is in the ledger, and resumes from file state
* an agent-owned GitHub PR has a ten-minute watcher
  * before an earlier signal counts, check the current head, replies, re-review requests, threads, checks, and mergeability
  * a change after the last review needs a fresh review on the current head

## Check Coordinator Control

* each active lane has its owner, parent, reporting path, and goal re-entry in durable state
  * it also has its thread id, repository, PR, tickets, phase, events, next proof, blocker, and next check
  * if the coordinator cannot name them, grade `Not ready`
* implementer lanes, not the coordinator, own code and code review
* each child, implementer, reviewer, and goal lane has a parent-visible stop report
* a child orchestrator is a durable thread or file lane, never a subagent
  * it gets each epic, project, release train, or subticket scope
* a parent does not manage leaf work inside a child's scope
* thread titles are `<role>: [<issue>] <description>`
* an active lane has a goal MDScript, and a resume acts on changed state without reading all skill context again
* a prompt for input writes a return script under `returns/`, and ends with its resume command
* no coordinator has more than five direct lanes without a split
* after a compaction, resume, or handoff, the lane refreshed live state before it steered or reported
* each thread event runs its exact `thread-event-contracts` jump, not a bare label

## Check Publication Hygiene

* use this check only for public text, docs, PR text, release notes, dashboards, or decision records
* reject local paths, private endpoints, secrets, unredacted customer data, raw transcripts, and command-log prose
* reject third-person masking of the author's own actions
* the artifact has each metadata field that its publication surface needs

## Check Domain Gates

* skill, instruction, validator, scorer, harness, or agent workflow
  * needs executable or black-box proof against the contract
  * reject source reading, coached prompts, substring or keyword matches, or the author's examples alone
* training, extraction, eval, or adapter work
  * needs the current corpus identity, structured eval contracts, and provenance
  * needs fail-closed blockers for stale or empty inputs
* dependency, provider, release, hardware, or runtime swap
  * needs the actual runtime path, the package diff, the owner contract, and a known-good fallback
  * needs the rollout state and the release owner
  * local green proof alone is not live proof
* subtree, vendored, mirror, or source sync
  * needs the owning source and baseline, and a parent sync is source health only
  * do not resolve source conflicts for the owner
* narration against owner records: the owner record decides
* observation-only, shadow, or dry-run work
  * proves what it observes, snapshots, and excludes
  * does not read live state after the boundary or act downstream
* delegated model, adapter, or agent work
  * the chosen runtime is explicit, visible, and inside the grant
  * it fails closed instead of a silent fallback
