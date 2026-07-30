<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Check Review And Watcher Gates

* if code changed
  * require focused tests, relevant broader tests, real-resource artifact proof, and the recursive single-reviewer blind-review gate on the current state
  * require `{{blocking_severities}}` to be `all findings` in round 1, `P1,P2` in round 2, and `P1` in round 3 and later

* if no code changed
  * require exactly one fresh review of the current non-code artifacts, including MDScripts and documentation, plus the applicable direct validation, render, pipeline, route, or black-box proof
  * do not start a recursive repair-review loop

* if acting as the reviewer in a blind-review round
  * use this skill as the review lens
  * grade the proof decision for the claimed `{{proof_scope}}` against `{{review_diff}}`, supporting context, artifact, evidence, permissions, attribution, and gates

* if acting as the reviewer for code changes
  * require `{{review_mode}}` to be `initial-cumulative`, `repair-delta`, or `final-cumulative`

* if acting as the reviewer for non-code changes
  * require `{{review_mode}}` to be `single-non-code`

* if code changed
  * require a completed repair-delta review to advance through [Record Completed Review Snapshot](../workflows/rolling-code-review.md#record-completed-review-snapshot)

* if code changed
  * require one fresh `final-cumulative` blind review before the recursive code-review gate becomes terminal

* require one fresh blind reviewer per review round

* require review subagents to be closed, deleted, or archived after they hand off their scoped grade and answer questions about their own review

* require review subagents to report their final scoped grade, stop reason, and any blocker to the spawning implementer before they are closed, deleted, archived, or left idle

* require the current-round grade to name the exact scoped claim and proof decision; `Proven for source-health` is not proof for `live-proof`, `merge-readiness`, `issue-close-readiness`, launch, release, or deployment

* require every finding to have a severity and separate `{{blocking_findings}}` from `{{residual_findings}}`

* require residual findings to remain visible without triggering another round

* reject reused reviewers, still-open reviewers from prior rounds, missing reviewer cleanup records, author-led packets, unresolved findings at the current blocking threshold, or findings whose severity was understated to avoid the current threshold

* if a GitLab issue or MR is in scope
  * require the reviewer grade, findings, questions, answers, fixes, evidence links, and resolution to be visible in GitLab before counting the review gate
  * require reviewers to author their own sanitized GitLab notes, reviews, or comments through `gitlab-sudo-alias` with a target-scoped alias ending in `-reviewer`
  * require resolvable threads to be marked resolved only after the concern is fixed, withdrawn, or explicitly accepted as closed

* if a root or coordinating Gabe thread owns the artifact
  * add a finding if it personally edits application code, owns ticket implementation, performs code review, spawns code reviewers, or treats coordinator inspection as the implementer's review gate

* if a PR/MR was created or owned by an implementer agent
  * require implementer ownership until merge or explicit close by the authorized owner
  * require implementer-owned monitoring for CI, reviews, unresolved threads, stale base drift, conflicts, draft state, mergeability, proof state, merge state, and referenced tickets
  * require monitor event executions for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` when their conditions are met, with the exact `{{event_exec}}` MDScript jump reported to the parent
  * require CI/CD and check failures to be treated as monitored state and repair input, not as standalone blockers except for default-branch merge decisions or an explicitly narrower proof gate from the repository or user

* if an implementer handed an MR/PR to an orchestrator
  * require an orchestrator-owned MDScript goal for implementation agents, review agents, leased reviewer identities, or agent-addressed mentions
  * require the goal to include an exact `/mdscript-exec <goal-mdscript>#resume-goal` re-entry, owner role, lane id, source of truth, stop condition, allowed actions, forbidden actions, reporting path, and next jump

* if a project control-plane goal was created, updated, handed off, or claimed active
  * require evidence that `~/.agents/projects/{{project_name}}/goals/<goal-id>.mdscript.md` exists and is referenced from the lane ledger or a parent-visible file comment
  * add a finding if the goal is prose-only, lacks a stable MDScript re-entry point, lacks a stop condition, or cannot be resumed from its saved file state after compaction

* if a GitHub code PR was created or owned by the agent
  * require an every-ten-minute watcher until merge or close
  * require the watcher and any re-entered reviewer to check GitHub for replies to prior findings, requested re-review, new commits or head SHA drift, unresolved conversations, changed review states, checks, and mergeability before treating an earlier approval, blocker, green check, or `feedback_posted` record as terminal
  * require a fresh review on the current head when any GitHub reply, re-review request, new commit, unresolved review thread, stale base, conflict, or check change appears after the last reviewer signal

* if the change is MDScript-only, blog-only, documentation-only, instruction-only, plan-only, task-only, comment-only, or another non-code artifact change
  * require one fresh review and relevant direct checks, render or pipeline, and served-route proof when publication is part of the claim
