<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Review And Watcher Gates

* read [Review Watcher Policy](../references/review-watcher-policy.md)
* if code changed
  * [Check Code Review Gates](#check-code-review-gates)
* if no code changed
  * [Check Noncode Review Gates](#check-noncode-review-gates)
* [Check Blind Process](#check-blind-process)

## Check Code Review Gates

* examine the change for focused tests, relevant broader tests, and real-resource artifact proof
* for each missing proof element
  * add a finding with the consequence and an evidence pointer
* examine the current state for the recursive single-reviewer blind-review gate
* if the recursive blind-review gate is missing
  * add a finding with the consequence and an evidence pointer
* if `{{review_round}}` is `1` and `{{blocking_severities}}` is not `all findings`
  * add a finding that `{{blocking_severities}}` must be `all findings` in round 1
* if `{{review_round}}` is `2` and `{{blocking_severities}}` is not `P1,P2`
  * add a finding that `{{blocking_severities}}` must be `P1,P2` in round 2
* if `{{review_round}}` is `3` or greater and `{{blocking_severities}}` is not `P1`
  * add a finding that `{{blocking_severities}}` must be `P1` in round 3 and later
* if you are the reviewer for code changes
  * if `{{review_mode}}` is not `initial-cumulative`, `repair-delta`, or `final-cumulative`
    * add a finding that asks for a valid code `{{review_mode}}`
* if a repair-delta review claims completion without [Record Completed Review Snapshot](../workflows/rolling-code-review.mdscript.md#record-completed-review-snapshot)
  * add a finding that asks for the completed-review snapshot
* if the recursive code-review gate claims terminal without one fresh `final-cumulative` blind review
  * add a finding that asks for a final-cumulative blind review
* [Check Blind Process](#check-blind-process)

## Check Noncode Review Gates

* examine the current non-code artifacts, for example MDScripts and documentation, for exactly one fresh review
* if the single fresh review is missing
  * add a finding with the consequence and an evidence pointer
* examine the artifacts for the applicable direct validation, render, pipeline, route, or black-box proof
* if the applicable direct proof is missing
  * add a finding with the consequence and an evidence pointer
* if a recursive repair-review loop started for non-code work
  * add a finding that rejects recursive non-code review loops
* if you are the reviewer for non-code changes
  * if `{{review_mode}}` is not `single-non-code`
    * add a finding that `{{review_mode}}` must be `single-non-code`
* if publication is part of the claim
  * examine the claim for render or pipeline proof and served-route proof
  * if publication proof is missing
    * add a finding with the consequence and an evidence pointer
* [Check Blind Process](#check-blind-process)

## Check Blind Process

* if you are the reviewer in a blind-review round
  * use this skill as the review lens
  * grade the proof decision for the claimed `{{proof_scope}}` against `{{review_diff}}`, the support context, artifact, evidence, permissions, attribution, and gates
* examine whether each review round has one fresh blind reviewer
* if a reviewer from a prior round is used again or stays open
  * add a finding with the consequence and an evidence pointer
* if reviewer cleanup records are missing
  * add a finding with the consequence and an evidence pointer
* if the author leads the packet as the initial blind frame
  * add a finding with the consequence and an evidence pointer
* if any finding lacks a severity
  * add a finding that asks for an explicit severity on each finding
* use `{{blocking_severities}}` to separate `{{blocking_findings}}` from `{{residual_findings}}`
* if residual findings were removed or started another round
  * add a finding that residual findings must stay visible without another round
* if unresolved findings remain at the current blocking threshold
  * add a finding with the consequence and an evidence pointer
* if the severity of a finding is too low so that it avoids the current threshold
  * add a finding with the consequence and an evidence pointer
* if the current-round grade does not name the exact scoped claim and proof decision
  * add a finding with the consequence and an evidence pointer
* if `Proven for source-health` is treated as proof for `live-proof`, `merge-readiness`, `issue-close-readiness`, launch, release, or deployment
  * add a finding that rejects scope inflation
* if a review subagent is closed, deleted, archived, or idle
  * if it did not report its final scoped grade, stop reason, and blocker to the implementer that spawned it
    * add a finding with the consequence and an evidence pointer
* [Check HSM And Tracker Surfaces](#check-hsm-and-tracker-surfaces)

## Check HSM And Tracker Surfaces

* if an in-scope path defines or changes a state machine, transition table, event dispatch, behavior-driving mode enum, or lifecycle/protocol sequence
  * before you count the terminal readiness gate, examine the path for a blind `hsm` lane sign-off from the `self-review/hsm` pack
  * if the HSM sign-off is missing at a terminal readiness gate
    * add a finding that asks for the blind HSM lane
  * if `lane_applicable: false` or `n/a` does not have its own search evidence, attack tries, and commands
    * add a finding that rejects an n/a HSM sign-off without a search
  * if a rules, security, or completeness lane that passed replaces the state machine lens
    * add a finding that rejects substitute lanes for HSM
* if a GitLab issue or MR is in scope
  * examine GitLab for the reviewer grade, findings, questions, answers, fixes, evidence links, and resolution
  * if a necessary review record is not visible in GitLab
    * add a finding with the consequence and an evidence pointer
  * if reviewers did not write their own sanitized notes through `gitlab-sudo-alias`
    * add a finding with the consequence and an evidence pointer
  * if the target-scoped alias of a reviewer does not end in `-reviewer`
    * add a finding with the consequence and an evidence pointer
  * if a person marked a resolvable thread resolved before the concern was fixed, withdrawn, or explicitly accepted as closed
    * add a finding with the consequence and an evidence pointer
* if a root or coordinating agent thread owns the artifact
  * if the thread personally edits application code, owns ticket implementation, or does code review
    * add a finding with the consequence and an evidence pointer
  * if the thread spawns code reviewers or uses coordinator inspection as the review gate of the implementer
    * add a finding with the consequence and an evidence pointer
* [Check Implementer Surfaces](#check-implementer-surfaces)

## Check Implementer Surfaces

* if an implementer agent created or owns a PR or MR
  * examine whether the implementer keeps ownership until merge or until the authorized owner explicitly closes it
  * if implementer ownership is missing
    * add a finding with the consequence and an evidence pointer
  * examine whether the implementer monitors CI, reviews, unresolved threads, stale base drift, conflicts, and draft state
  * examine whether the implementer monitors mergeability, proof state, merge state, and referenced tickets
  * if the monitor does not cover one of these items
    * add a finding with the consequence and an evidence pointer
  * if the conditions for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR` occur
    * examine the monitor for the event execution of each of these events
  * if a necessary event execution is missing
    * add a finding with the consequence and an evidence pointer
  * if the parent did not get the exact `{{event_exec}}` MDScript jump of an event execution
    * add a finding with the consequence and an evidence pointer
  * if the implementer uses CI/CD or check failures as standalone blockers
    * if this occurs outside default-branch merge decisions or an explicitly narrower proof gate
      * add a finding that failures must be monitored state and repair input
* if an implementer handed an MR or PR to an orchestrator
  * examine the handoff for an orchestrator-owned MDScript goal
  * examine whether the goal covers implementation agents, review agents, leased reviewer identities, or agent-addressed mentions
  * if the goal is missing
    * add a finding with the consequence and an evidence pointer
  * examine the goal for the exact `/mdscript-exec <goal-mdscript>#resume-goal` re-entry, owner role, lane id, and source of truth
  * examine the goal for the stop condition, allowed actions, forbidden actions, reporting path, and next jump
  * for each goal field that is missing
    * add a finding with the consequence and an evidence pointer
* [Check Project And GitHub Surfaces](#check-project-and-github-surfaces)

## Check Project And GitHub Surfaces

* if an agent created, changed, handed off, or claimed active a project control-plane goal
  * examine the evidence that `~/.agents/projects/{{project_name}}/goals/<goal-id>.mdscript.md` exists
  * if the goal file is missing
    * add a finding with the consequence and an evidence pointer
  * examine the lane ledger or a parent-visible file comment for a reference to the goal
  * if no durable parent-visible state refers to the goal
    * add a finding with the consequence and an evidence pointer
  * if the goal is prose-only, or has no stable MDScript re-entry point or stop condition
    * add a finding with the consequence and an evidence pointer
  * if an agent cannot resume the goal from its saved file state after compaction
    * add a finding with the consequence and an evidence pointer
* if the agent created or owns a GitHub code PR
  * examine the PR for an every-ten-minute watcher until merge or close
  * if the watcher is missing
    * add a finding with the consequence and an evidence pointer
  * examine whether the watcher and each re-entered reviewer checked GitHub before they used earlier signals as terminal
  * examine whether this check covered replies to prior findings, requested re-review, new commits, and head SHA drift
  * examine whether this check covered unresolved conversations, changed review states, checks, and mergeability
  * if an agent used an earlier approval, blocker, green check, or `feedback_posted` record again
    * if the agent did not check the current GitHub state again first
      * add a finding with the consequence and an evidence pointer
  * if a GitHub reply, re-review request, new commit, or unresolved review thread occurred after the last reviewer signal
    * if no fresh review exists on the current head
      * add a finding that asks for a fresh review on the current head
  * if a stale base, conflict, or check change occurred after the last reviewer signal
    * if no fresh review exists on the current head
      * add a finding that asks for a fresh review on the current head
* return to the caller
