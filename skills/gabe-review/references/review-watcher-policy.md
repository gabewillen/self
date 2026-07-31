# Review and watcher gate policy

Hold these rules while checking review mode, blind-review process, HSM lane, watcher, and implementer ownership.

## Code changed

**Require**

- focused tests, relevant broader tests, and real-resource artifact proof
- recursive single-reviewer blind-review gate on the current state
- `{{blocking_severities}}` = `all findings` in round 1, `P1,P2` in round 2, `P1` in round 3 and later
- completed repair-delta review advances through Record Completed Review Snapshot
- one fresh `final-cumulative` blind review before the recursive code-review gate becomes terminal

## No code changed

**Require**

- exactly one fresh review of current non-code artifacts (including MDScripts and documentation)
- applicable direct validation, render, pipeline, route, or black-box proof

**Reject**

- starting a recursive repair-review loop for non-code changes

## Reviewer role

When acting as the reviewer in a blind-review round:

- use gabe-review as the review lens
- grade the proof decision for the claimed `{{proof_scope}}` against `{{review_diff}}`, supporting context, artifact, evidence, permissions, attribution, and gates

When acting as the reviewer for code changes, require `{{review_mode}}` in `initial-cumulative`, `repair-delta`, or `final-cumulative`.

When acting as the reviewer for non-code changes, require `{{review_mode}}` = `single-non-code`.

## Blind process

**Require**

- parent process owns gabe-review composition (implementer or main/goal agent)
- never a nested full `/gabe-review` skill subagent
- one fresh blind **lane** subagent per selected lane per round (rules, security, completeness, eng-*, hsm, …)
- every finding has a severity
- separate `{{blocking_findings}}` from `{{residual_findings}}`
- residual findings remain visible without triggering another round
- current-round grade names the exact scoped claim and proof decision
- `Proven for source-health` is not proof for `live-proof`, `merge-readiness`, `issue-close-readiness`, launch, release, or deployment
- lane subagents report sign-off or stop reason to the spawning parent before close, delete, archive, or idle
- lane subagents are closed, deleted, or archived after they hand off their sign-off

**Reject**

- delegating the whole gabe-review skill to a worker that then must spawn lanes
- reused lane reviewers
- still-open lane reviewers from prior rounds
- missing reviewer cleanup records
- author-led packets as the blind frame
- unresolved findings at the current blocking threshold
- findings whose severity was understated to avoid the current threshold

## HSM lane (state machine in scope)

When any in-scope path defines or changes a state machine, transition table, event dispatch, behavior-driving mode enum, or lifecycle/protocol sequencing:

**Require**

- blind `hsm` lane sign-off from `gabe-hsm-review` before the terminal readiness gate counts
- `lane_applicable: false` / `n/a` sign-off only when it carries its own search evidence, attack attempts, and commands

**Reject**

- letting a passing rules, security, or completeness lane stand in for the state machine lens

## GitLab issue or MR in scope

**Require**

- reviewer grade, findings, questions, answers, fixes, evidence links, and resolution visible in GitLab before counting the review gate
- reviewers author their own sanitized GitLab notes, reviews, or comments through `gitlab-sudo-alias` with a target-scoped alias ending in `-reviewer`
- resolvable threads marked resolved only after the concern is fixed, withdrawn, or explicitly accepted as closed

## Root or coordinating Gabe thread

**Add a finding** if the root/coordinator personally edits application code, owns ticket implementation, performs code review, spawns code reviewers, or treats coordinator inspection as the implementer's review gate.

## Implementer-owned PR/MR

**Require**

- implementer ownership until merge or explicit close by the authorized owner
- implementer-owned monitoring for CI, reviews, unresolved threads, stale base drift, conflicts, draft state, mergeability, proof state, merge state, and referenced tickets
- monitor event executions for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` when their conditions are met, with the exact `{{event_exec}}` MDScript jump reported to the parent
- CI/CD and check failures treated as monitored state and repair input, not as standalone blockers except for default-branch merge decisions or an explicitly narrower proof gate from the repository or user

## Implementer handoff to orchestrator

**Require** an orchestrator-owned MDScript goal for implementation agents, review agents, leased reviewer identities, or agent-addressed mentions, including:

- exact `/mdscript-exec <goal-mdscript>#resume-goal` re-entry
- owner role, lane id, source of truth, stop condition
- allowed actions, forbidden actions, reporting path, and next jump

## Project control-plane goal

When a project control-plane goal was created, updated, handed off, or claimed active:

**Require** evidence that `~/.agents/projects/{{project_name}}/goals/<goal-id>.mdscript.md` exists and is referenced from the lane ledger or a parent-visible file comment.

**Add a finding** if the goal is prose-only, lacks a stable MDScript re-entry point, lacks a stop condition, or cannot be resumed from its saved file state after compaction.

## GitHub code PR created or owned by the agent

**Require**

- an every-ten-minute watcher until merge or close
- watcher and any re-entered reviewer check GitHub for replies to prior findings, requested re-review, new commits or head SHA drift, unresolved conversations, changed review states, checks, and mergeability before treating an earlier approval, blocker, green check, or `feedback_posted` record as terminal
- a fresh review on the current head when any GitHub reply, re-review request, new commit, unresolved review thread, stale base, conflict, or check change appears after the last reviewer signal

## MDScript-only / documentation-only / non-code artifact change

**Require** one fresh review and relevant direct checks, render or pipeline, and served-route proof when publication is part of the claim.
