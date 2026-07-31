<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Review And Watcher Gates

* read [Review Watcher Policy](../references/review-watcher-policy.md)
* if code changed
  * [Check Code Review Gates](#check-code-review-gates)
* if no code changed
  * [Check Noncode Review Gates](#check-noncode-review-gates)
* [Check Blind Process](#check-blind-process)

## Check Code Review Gates

* inspect for focused tests, relevant broader tests, and real-resource artifact proof
* for each missing proof element
  * add a finding with consequence and evidence pointer
* inspect for the recursive single-reviewer blind-review gate on the current state
* if the recursive blind-review gate is missing
  * add a finding with consequence and evidence pointer
* if `{{review_round}}` is `1` and `{{blocking_severities}}` is not `all findings`
  * add a finding requiring `{{blocking_severities}}` to be `all findings` in round 1
* if `{{review_round}}` is `2` and `{{blocking_severities}}` is not `P1,P2`
  * add a finding requiring `{{blocking_severities}}` to be `P1,P2` in round 2
* if `{{review_round}}` is `3` or greater and `{{blocking_severities}}` is not `P1`
  * add a finding requiring `{{blocking_severities}}` to be `P1` in round 3 and later
* if acting as the reviewer for code changes and `{{review_mode}}` is not `initial-cumulative`, `repair-delta`, or `final-cumulative`
  * add a finding requiring a valid code `{{review_mode}}`
* if a repair-delta review claims completion without [Record Completed Review Snapshot](../workflows/rolling-code-review.md#record-completed-review-snapshot)
  * add a finding requiring the completed-review snapshot
* if the recursive code-review gate claims terminal without one fresh `final-cumulative` blind review
  * add a finding requiring a final-cumulative blind review
* [Check Blind Process](#check-blind-process)

## Check Noncode Review Gates

* inspect for exactly one fresh review of the current non-code artifacts, including MDScripts and documentation
* if the single fresh review is missing
  * add a finding with consequence and evidence pointer
* inspect for the applicable direct validation, render, pipeline, route, or black-box proof
* if the applicable direct proof is missing
  * add a finding with consequence and evidence pointer
* if a recursive repair-review loop was started for non-code work
  * add a finding rejecting recursive non-code review loops
* if acting as the reviewer for non-code changes and `{{review_mode}}` is not `single-non-code`
  * add a finding requiring `{{review_mode}}` to be `single-non-code`
* if publication is part of the claim
  * inspect for render or pipeline and served-route proof
  * if publication proof is missing
    * add a finding with consequence and evidence pointer
* [Check Blind Process](#check-blind-process)

## Check Blind Process

* if acting as the reviewer in a blind-review round
  * use this skill as the review lens
  * grade the proof decision for the claimed `{{proof_scope}}` against `{{review_diff}}`, supporting context, artifact, evidence, permissions, attribution, and gates
* inspect for one fresh blind reviewer per review round
* if a reviewer was reused or remains open from a prior round
  * add a finding with consequence and evidence pointer
* if reviewer cleanup records are missing
  * add a finding with consequence and evidence pointer
* if the packet is author-led as the initial blind frame
  * add a finding with consequence and evidence pointer
* if any finding lacks a severity
  * add a finding requiring explicit severity on every finding
* separate `{{blocking_findings}}` from `{{residual_findings}}` using `{{blocking_severities}}`
* if residual findings were dropped or used to trigger another round
  * add a finding requiring residual findings to remain visible without another round
* if unresolved findings remain at the current blocking threshold
  * add a finding with consequence and evidence pointer
* if any finding severity was understated to avoid the current threshold
  * add a finding with consequence and evidence pointer
* if the current-round grade does not name the exact scoped claim and proof decision
  * add a finding with consequence and evidence pointer
* if `Proven for source-health` is treated as proof for `live-proof`, `merge-readiness`, `issue-close-readiness`, launch, release, or deployment
  * add a finding rejecting scope inflation
* if a review subagent was closed, deleted, archived, or left idle without reporting its final scoped grade, stop reason, and any blocker to the spawning implementer
  * add a finding with consequence and evidence pointer
* [Check HSM And Tracker Surfaces](#check-hsm-and-tracker-surfaces)

## Check HSM And Tracker Surfaces

* if any in-scope path defines or changes a state machine, transition table, event dispatch, behavior-driving mode enum, or lifecycle/protocol sequencing
  * inspect for blind `hsm` lane sign-off (via `gabe-review/hsm` pack) before counting the terminal readiness gate
  * if the HSM sign-off is missing at a terminal readiness gate
    * add a finding requiring the blind HSM lane
  * if `lane_applicable: false` or `n/a` lacks its own search evidence, attack attempts, and commands
    * add a finding rejecting an unsearched n/a HSM sign-off
  * if a passing rules, security, or completeness lane is used in place of the state machine lens
    * add a finding rejecting substitute lanes for HSM
* if a GitLab issue or MR is in scope
  * inspect GitLab for reviewer grade, findings, questions, answers, fixes, evidence links, and resolution
  * if any required review record is not visible in GitLab
    * add a finding with consequence and evidence pointer
  * if reviewers did not author their own sanitized notes through `gitlab-sudo-alias` with a target-scoped alias ending in `-reviewer`
    * add a finding with consequence and evidence pointer
  * if a resolvable thread was marked resolved before the concern was fixed, withdrawn, or explicitly accepted as closed
    * add a finding with consequence and evidence pointer
* if a root or coordinating Agent thread owns the artifact
  * if the root or coordinating Agent thread personally edits application code, owns ticket implementation, performs code review, spawns code reviewers, or treats coordinator inspection as the implementer's review gate
    * add a finding with consequence and evidence pointer
* [Check Implementer Surfaces](#check-implementer-surfaces)

## Check Implementer Surfaces

* if a PR or MR was created or owned by an implementer agent
  * inspect for implementer ownership until merge or explicit close by the authorized owner
  * if implementer ownership is missing
    * add a finding with consequence and evidence pointer
  * inspect for implementer-owned monitoring of CI, reviews, unresolved threads, stale base drift, conflicts, draft state, mergeability, proof state, merge state, and referenced tickets
  * if monitoring coverage is missing
    * add a finding with consequence and evidence pointer
  * inspect for monitor event executions for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` when their conditions are met
  * if a required event execution is missing or lacks the exact `{{event_exec}}` MDScript jump reported to the parent
    * add a finding with consequence and evidence pointer
  * if CI/CD or check failures are treated as standalone blockers outside default-branch merge decisions or an explicitly narrower proof gate
    * add a finding requiring failures to be treated as monitored state and repair input
* if an implementer handed an MR or PR to an orchestrator
  * inspect for an orchestrator-owned MDScript goal covering implementation agents, review agents, leased reviewer identities, or agent-addressed mentions
  * if the goal is missing
    * add a finding with consequence and evidence pointer
  * inspect the goal for exact `/mdscript-exec <goal-mdscript>#resume-goal` re-entry, owner role, lane id, source of truth, stop condition, allowed actions, forbidden actions, reporting path, and next jump
  * for each missing goal field
    * add a finding with consequence and evidence pointer
* [Check Project And GitHub Surfaces](#check-project-and-github-surfaces)

## Check Project And GitHub Surfaces

* if a project control-plane goal was created, updated, handed off, or claimed active
  * inspect for evidence that `~/.agents/projects/{{project_name}}/goals/<goal-id>.mdscript.md` exists
  * if the goal file is missing
    * add a finding with consequence and evidence pointer
  * inspect for a reference from the lane ledger or a parent-visible file comment
  * if the goal is not referenced from durable parent-visible state
    * add a finding with consequence and evidence pointer
  * if the goal is prose-only, lacks a stable MDScript re-entry point, lacks a stop condition, or cannot be resumed from its saved file state after compaction
    * add a finding with consequence and evidence pointer
* if a GitHub code PR was created or owned by the agent
  * inspect for an every-ten-minute watcher until merge or close
  * if the watcher is missing
    * add a finding with consequence and evidence pointer
  * inspect whether the watcher and any re-entered reviewer checked GitHub for replies to prior findings, requested re-review, new commits or head SHA drift, unresolved conversations, changed review states, checks, and mergeability before treating earlier signals as terminal
  * if current GitHub state was not rechecked before reusing an earlier approval, blocker, green check, or `feedback_posted` record
    * add a finding with consequence and evidence pointer
  * if a GitHub reply, re-review request, new commit, unresolved review thread, stale base, conflict, or check change appeared after the last reviewer signal without a fresh review on the current head
    * add a finding requiring a fresh review on the current head
* return to the caller
