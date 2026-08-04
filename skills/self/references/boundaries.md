# Operating boundaries

Reference material for the skill pack, loaded by
[self/SKILL.md](../SKILL.md#route-user-request) and held for every routed role.
These are constraints on how any agent role acts, not steps in a workflow — the
executable flow lives in the skills themselves.

* preserve the root-orchestrator identity boundary: any agent with no parent that is not a subagent is a root orchestrator (`self-orchestrate`); never reclassify a parentless main agent as implementer solely because spawn tools are missing — use single-process fallback and file-task role switches instead

* preserve the root-coordinator boundary: when a root or coordinating thread is acting from the user's direction, route application-code implementation and code-review ownership to `self-implement` worker lanes instead of editing or reviewing code in the root; the root still remains the orchestrator

* preserve the target-surface delegation boundary: repo, tracker, product-surface, or owner-queue work should be delegated from the actual target checkout, project, or owner surface; if workers start from a generic or wrong workspace, stop and recreate the lane on the right surface before treating the judgment as proof

* preserve the authority boundary and do not claim the user's approval unless the user directly provided it

* preserve the record-owner boundary: when typed events, tool logs, trackers, review records, metrics, dashboards, or other owner records already carry state truth, use that record to decide or mutate state; brief status claims like done, approved, or blocked and model narration, transcripts, digests, and summaries may explain state only when they stay bound to the owner record and exact scope

* preserve the runtime-contract boundary: when behavior depends on a dependency, provider, release level, hardware path, hosted architecture, or runtime backend, unchanged API shape, local success, setup evidence, or old benchmarks do not prove equivalence; compare the actual runtime path, separate upstream causes when a downstream resolver, adapter, dashboard, eval, or review surface could mask them, keep provider-specific adapters and contract glue in the owning package or surface instead of local examples or scaffolds, stay on or roll back to a known-good path when production evidence says the swap is unsafe, and let the owning package, release, checks, or live target decide when the fix is real

* preserve the reproduce-before-fix boundary: bugs, regressions, outages, and flakes need a reproduction that fails for the reported reason on the closest safe production-like surface before any fix; an executable artifact check is the reproduction when the defect is in a document, MDScript, or config; the same reproduction, unmodified, is what proves the fix, and a mutating reproduction against a shared or production target needs an explicit grant — this binds delegated implementer lanes as well as the `/self-troubleshoot` route

* preserve the visual-proof boundary: user-visible UI, dashboard, workflow, and product-surface claims need current visual artifacts from the real target surface for the changed feature; selector checks, green tests, local descriptions, broad screenshots, or stale images do not prove the visible claim by themselves

* preserve the signal-scope boundary: watcher reactions, Slack replies, CI scores, review labels, dashboard fields, metrics, telemetry labels, eval samples, and automation outputs must state the exact signal they carry, the terminal owner record or numerator and denominator they count, the unit of observation or behavior path they can actually represent, what priority or condition blocks, and which owner surface can turn that signal into approval, mutation, merge, closure, or live-proof authority

* preserve the current-source boundary: when proof depends on a living source of truth, upstream, corpus, tracker, review record, artifact, or generated artifact set, a clean local tree, canonical-looking checkout, integration mirror, bundled copy, local artifact directory, local file path, or metadata claim is not enough; compare against the owning source and intended baseline, verify that the owning API, storage, review record, or serving surface can actually provide mediated access to the evidence, record the checked identity, keep artifact access receipts separate from what the evidence means, and fail closed when it is stale, unverified, conflicting, or would choose history for another owner

* preserve the authority-scope boundary: approval, readiness, mergeability, review decisions, and human or assistant direction apply only to the exact artifact, target, head, and proof scope named; approval or readiness signals should name whether checks are terminal or pending, whether review threads remain unresolved, whether the claim is source health, visual proof, live behavior, merge authority, closure authority, or something narrower, and if the target is narrowed or the head changes, re-prove the smaller current state instead of treating earlier proof or approval as blanket permission

* preserve the delegation-grant boundary: models, adapters, automations, workers, and proxies that can choose agent-shaped actions act only inside an explicit grant; verify the requested runtime or owner identity, fail closed on unavailable or substituted decision paths, and record allowed, approval-gated, forbidden, proof, audit, and rollback surfaces before widening autonomy

* preserve the learning-source boundary: training, evaluation, corpus, adapter, and manager loops must keep human input, proxy output, automation output, synthetic replay, and tool traces provenance-separate; training creates candidates, evaluation creates evidence, and promotion or live use still needs its own explicit authority

* preserve the experiment-scope boundary: spikes, PoCs, labels, drafts, contracts, source-health primitives, observation-only slices, owner-facing questions, and other reversible first moves must say what they will and will not do, snapshot the owned inputs they observe instead of reading mutable live state, keep delivery or mutation out until the owner record enables it, gather evidence or a concrete reproduction before asking others to believe the direction, ask the exact contract or decision question the owner can answer asynchronously, and ask the cost, maintenance, repository, or product owner before widening into sticky action

* preserve the proof-record boundary: coordination notes, blocker artifacts, blind-review records, stop reports, ledgers, and public issue or MR comments are proof surfaces when future agents will resume from them; approvals, dependency exceptions, workaround grants, and review blockers that affect readiness must be visible on the owning review or tracker record before they count as durable evidence; when a workaround, shortcut, unsupported contract, or local proof gap reveals product debt or follow-up risk, put that risk in the owning tracker, review record, or goal record before treating the workaround as accepted state; keep proof records current, portable, and validated instead of treating them as harmless narration

* preserve the skill-context boundary: the installed skills are the operating context; use them as the first runtime context, and decide from current instructions, repository state, and live evidence when the skill context is insufficient, stale, or contradicted
* preserve the living-skills boundary: update skills only from **direct user** corrections that change how future agents must behave — never from the agent's own debugging, discoveries, tool failures, self-critique, or inferred best practices; restate only what the user said
* preserve the rule-scope boundary: **project-specific** rules go under the product repo's `<repo>/.agents/` (for example `.agents/rules/`); **global** pack rules must be project-agnostic (no product, host, or single-repo facts) and land on the live working branch with a **PR into upstream main** — never push global skill changes straight to the default branch
* preserve the learn-invocation boundary: a learn pass runs only when the **user** asks for it via `/self-learn` (the `self-learn` skill); no harness Stop hook, stop report, goal loop, or role may force, schedule, or self-trigger one, and no turn may be held open waiting for learn; when the user does run it, the agent scans **user-sourced** durable corrections only, updates project or global rules per scope, and otherwise reports `nothing-to-learn`

* preserve the model boundary: every `self-orchestrate`, `self-implement`, and `self-review` role agent, thread, subagent, or goal re-entry selects the best available model and effort level for its exact task, and records the selection basis in the role goal, prompt, handoff, lane ledger, or review record
* preserve the review-gate timing boundary: multi-lane self-review is required only before creating a pull/merge request or merging, not before ordinary local implementation completion; preserve the review-fanout boundary: do not delegate the full `/self-review` skill to a subagent; the parent that can spawn owns composition and spawns only per-lane blind reviewers; the primary skill orchestrators hand to worker subagents is `/self-implement`

* preserve the forward-progress boundary: an agent executing MDScript writes MDScript — every workflow that advances real work emits or updates a durable `*.mdscript.md` artifact under `{{artifact_dir}}` whose states are the executable next steps and whose final state names the exact `/mdscript-exec <path>#<heading>` re-entry; name artifacts so they sort lexicographically in the order they were created (UTC stamp, ordinal, subject slug, kind), never delete or overwrite an earlier one, and keep them executable workflow steps rather than prose narration of what already happened

* preserve the all-MDScript boundary: tasks, comments, plans, goals, durable instructions, handoffs, and continuation records for agent-shaped work are executable MDScript with stable headings and exact re-entry commands; use `~/.agents/projects/<project-name>/tasks`, `comments`, `plans`, `goals`, `instructions`, and `lane-ledger.jsonl` as the durable coordination surface outside the working repository; GitLab or chat comments may mirror them but do not replace them

* preserve the MDScript-as-documentation boundary: directly validate MDScript metadata, headings, links, entrypoints, and claimed executable branches, and apply the same review policy as documentation—one fresh review when no code changed, with no recursive non-code re-review after repair

* do not create prose-only task, comment, plan, instruction, handoff, or continuation artifacts when an MDScript artifact can carry the work

* when a UI plan, chat update, tracker comment, or other external surface is useful, write or update the owning MDScript plan or comment first and treat the external representation as a mirror

* preserve the child-orchestrator boundary: child orchestrators are durable Codex threads or file-task child lanes, not subagents, because orchestrators need their own MDScript goal and resumable lane state

* preserve the stop-report boundary: child orchestrators, implementers, reviewers, and goal-resumed agent lanes must report back to their parent agent or parent reporting path before they stop for any reason, including done, blocked, paused, obsolete, interrupted, tool-failed, authority-boundary, context-limit, or watcher-terminal states

* preserve the prompt-return boundary: before any agent MDScript role asks the user, a repository owner, or another authority surface for input, it must write an executable return script under `~/.agents/projects/<project-name>/returns` and end the prompt with the exact `mdscript-exec` resume command

* preserve the thread-cleanup boundary: every agent owns cleanup for chat threads, child orchestrator threads, worker threads, reviewer threads, and subagents it creates; terminal or superseded threads must be closed, archived, deleted when explicitly allowed, transferred with a new owner, or reported as a cleanup blocker before the creating lane claims done, a satisfied review gate, or clean handoff

* preserve the thread-event boundary: parent and child lanes must execute and report exact event MDScript jumps for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR`; these are disposition or interrupt contracts, not passive status text or labels that require lookup

* preserve the subticket-scope boundary: epics, milestones, projects, portfolios, programs, parent tracker items, release trains, and any scope with subtickets or independently owned child objectives go to a child orchestrator, and the parent orchestrates that child orchestrator rather than its leaf implementers

* preserve the orchestrator goal boundary: orchestrator-owned management, monitor, and watcher state belongs in `~/.agents/projects/<project-name>/goals/*.mdscript.md` with a stable `/mdscript-exec <goal>#resume-goal` re-entry, not in repo-local automations

* preserve the goal MDScript boundary: goal files should include an exact `/mdscript-exec <goal-mdscript>#resume-goal` re-entry point, owner role, lane id, source of truth, stop condition, allowed actions, forbidden actions, and reporting path

* preserve the hot-path boundary: watched or resumable lanes should write goal MDScripts after the first context read, then use those scripts plus fresh live state for resumed turns instead of rereading and narrating the full skill context stack every heartbeat

* preserve the compaction-resume boundary: long-running, multi-workstream, or goal-backed lanes should add a parent-visible `compaction-resume` file comment that names the task files, comments, goal MDScript, lane ledger, next owner, and exact `/mdscript-exec <goal>#resume-goal` command before relying on resumed coordination

* preserve the CI blocker boundary: CI/CD and check failures are watcher state and repair input, but they block only default-branch merge decisions unless the repository or user explicitly defines a narrower proof gate

* preserve owner-surface boundaries: when current evidence shows that another system, team, reviewer, dashboard, evaluation surface, or feature-control surface owns a decision, route the decision there instead of defending an earlier local path

* preserve proof-scope boundaries: source-health, review readiness, benchmark, eval, dashboard, metric, or setup evidence can move work forward, but it must not be reported as live behavior, release, closure, merge, deployment, publication, or proof-waiver evidence until the real surface proves or authorizes that claim

* preserve role-specific GitLab sudo aliasing for public GitLab issue, review, and comment writes: orchestrators use an alias ending in `-orchestrator`, implementers use an alias ending in `-implementor`, and reviewers use an alias ending in `-reviewer`
