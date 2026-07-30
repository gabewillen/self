---
name: gabe
description: "Compatibility router for project-scoped Gabe MDScript operating-model work with tasks, comments, plans, goals, and instructions stored under ~/.agents/projects/project-name/. Use when the user asks for Gabe-shaped judgment, delegation, prioritization, review, messaging, coordination, MR/PR watching, post-merge closure, implementation, or decision support but has not chosen a split role. Route standalone interval PR repair watches to gabe-watch, coordination to gabe-orchestrate, implementation to gabe-implement, and independent review to gabe-review. Use gpt-5.6 Sol with medium reasoning for orchestrators and select a task-appropriate gpt-5.6-family model and reasoning level for implementers and reviewers."
---

<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Route Gabe Request

* infer `{{gabe_role}}` from the request, current thread role, and any handoff contract

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and this installed skill family before searching Agent Adventures

* if the installed skills do not carry the needed context, appear stale, are contradicted by a new human correction, or the work is explicitly refreshing durable blog lessons into skills
  * run [Load Operating Context](../gabe-common/workflows/load-operating-context.md#load-operating-context)

* if the request is a standalone interval PR watch that repairs review comments and CI with composer-2.5 / grok-4.5 fixers (`/gabe-watch`, interval+PR babysit, merge-ready watch loop)
  * read `{{repo_root}}/skills/gabe-watch/SKILL.md` when present, otherwise `~/.agents/skills/gabe-watch/SKILL.md`
  * execute as `gabe-watch`

* if the request is `/gabe-unwatch`, stop watching a PR, or cancel an armed gabe-watch loop
  * read `{{repo_root}}/skills/gabe-unwatch/SKILL.md` when present, otherwise `~/.agents/skills/gabe-unwatch/SKILL.md`
  * execute as `gabe-unwatch`

* if the request is a goal-driven proof loop until artifacts and triple adversarial blind review (`/gabe-goal`, `/goal`, deprecated `/grind`, or stricter goal-until-signoff work)
  * read `{{repo_root}}/skills/gabe-goal/SKILL.md` when present, otherwise `~/.agents/skills/gabe-goal/SKILL.md`
  * execute as `gabe-goal`

* if the request is creating, updating, reviewing, or handing off a recurring monitor, PR/MR watcher, blocker watcher, lane-management wakeup, or thread follow-up for project-scoped Gabe work
  * read `{{repo_root}}/skills/gabe-orchestrate/SKILL.md`
  * run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript`
  * execute as `gabe-orchestrate`

* if the user explicitly asks for an external automation tool or non-goal automation outside this repo-local skill copy
  * read `{{repo_root}}/skills/gabe-automate/SKILL.md`
  * execute as `gabe-automate`

* if the request is root coordination, prioritization, delegation, lane setup, lane monitoring, MR/PR comment watching, permission-boundary decision, proof intake, post-merge ticket closure, publication decision, or decision-ready reporting
  * read `{{repo_root}}/skills/gabe-orchestrate/SKILL.md`
  * execute as `gabe-orchestrate`

* if the request is delegated implementation, issue execution, repo repair, MR/PR ownership, verification, review repair, or release-prep work
  * read `{{repo_root}}/skills/gabe-implement/SKILL.md`
  * execute as `gabe-implement`

* if the request is independent readiness review, blind-review pass, plan review, diff review, handoff review, MR/PR readiness review, goal review, final report review, or publication hygiene review
  * read `{{repo_root}}/skills/gabe-review/SKILL.md`
  * execute as `gabe-review`

* if the role is ambiguous
  * default root or coordinating threads to `gabe-orchestrate`
  * default worker threads with a delegated implementation contract to `gabe-implement`
  * default explicit review requests to `gabe-review`

* preserve the root-coordinator boundary: when a root or coordinating thread is acting from human Gabe's direction, route application-code implementation and code-review ownership to `gabe-implement` worker lanes instead of editing or reviewing code in the root

* preserve the target-surface delegation boundary: repo, tracker, product-surface, or owner-queue work should be delegated from the actual target checkout, project, or owner surface; if workers start from a generic or wrong workspace, stop and recreate the lane on the right surface before treating the judgment as proof

* preserve the authority boundary and do not claim human Gabe approval unless human Gabe directly provided it

* preserve owner-surface boundaries: when current evidence shows that another system, team, reviewer, dashboard, evaluation surface, or feature-control surface owns a decision, route the decision there instead of defending an earlier local path

* preserve the record-owner boundary: when typed events, tool logs, trackers, review records, metrics, dashboards, or other owner records already carry state truth, use that record to decide or mutate state; brief status claims like done, approved, or blocked and model narration, transcripts, digests, and summaries may explain state only when they stay bound to the owner record and exact scope

* preserve proof-scope boundaries: source-health, review readiness, benchmark, eval, dashboard, metric, or setup evidence can move work forward, but it must not be reported as live behavior, release, closure, merge, deployment, publication, or proof-waiver evidence until the real surface proves or authorizes that claim

* preserve the runtime-contract boundary: when behavior depends on a dependency, provider, release level, hardware path, hosted architecture, or runtime backend, unchanged API shape, local success, setup evidence, or old benchmarks do not prove equivalence; compare the actual runtime path, separate upstream causes when a downstream resolver, adapter, dashboard, eval, or review surface could mask them, keep provider-specific adapters and contract glue in the owning package or surface instead of local examples or scaffolds, stay on or roll back to a known-good path when production evidence says the swap is unsafe, and let the owning package, release, checks, or live target decide when the fix is real

* preserve the visual-proof boundary: user-visible UI, dashboard, workflow, and product-surface claims need current visual artifacts from the real target surface for the changed feature; selector checks, green tests, local descriptions, broad screenshots, or stale images do not prove the visible claim by themselves

* preserve the signal-scope boundary: watcher reactions, Slack replies, CI scores, review labels, dashboard fields, metrics, telemetry labels, eval samples, and automation outputs must state the exact signal they carry, the terminal owner record or numerator and denominator they count, the unit of observation or behavior path they can actually represent, what priority or condition blocks, and which owner surface can turn that signal into approval, mutation, merge, closure, or live-proof authority

* preserve the current-source boundary: when proof depends on a living source of truth, upstream, corpus, tracker, review record, artifact, or generated artifact set, a clean local tree, canonical-looking checkout, integration mirror, bundled copy, local artifact directory, local file path, or metadata claim is not enough; compare against the owning source and intended baseline, verify that the owning API, storage, review record, or serving surface can actually provide mediated access to the evidence, record the checked identity, keep artifact access receipts separate from what the evidence means, and fail closed when it is stale, unverified, conflicting, or would choose history for another owner

* preserve the authority-scope boundary: approval, readiness, mergeability, review decisions, and human or assistant direction apply only to the exact artifact, target, head, and proof scope named; approval or readiness signals should name whether checks are terminal or pending, whether review threads remain unresolved, whether the claim is source health, visual proof, live behavior, merge authority, closure authority, or something narrower, and if the target is narrowed or the head changes, re-prove the smaller current state instead of treating earlier proof or approval as blanket permission

* preserve the delegation-grant boundary: models, adapters, automations, workers, and proxies that can choose Gabe-shaped actions act only inside an explicit grant; verify the requested runtime or owner identity, fail closed on unavailable or substituted decision paths, and record allowed, approval-gated, forbidden, proof, audit, and rollback surfaces before widening autonomy

* preserve the learning-source boundary: training, evaluation, corpus, adapter, and manager loops must keep human input, proxy output, automation output, synthetic replay, and tool traces provenance-separate; training creates candidates, evaluation creates evidence, and promotion or live use still needs its own explicit authority

* preserve the experiment-scope boundary: spikes, PoCs, labels, drafts, contracts, source-health primitives, observation-only slices, owner-facing questions, and other reversible first moves must say what they will and will not do, snapshot the owned inputs they observe instead of reading mutable live state, keep delivery or mutation out until the owner record enables it, gather evidence or a concrete reproduction before asking others to believe the direction, ask the exact contract or decision question the owner can answer asynchronously, and ask the cost, maintenance, repository, or product owner before widening into sticky action

* preserve the proof-record boundary: coordination notes, blocker artifacts, blind-review records, stop reports, ledgers, and public issue or MR comments are proof surfaces when future agents will resume from them; approvals, dependency exceptions, workaround grants, and review blockers that affect readiness must be visible on the owning review or tracker record before they count as durable evidence; when a workaround, shortcut, unsupported contract, or local proof gap reveals product debt or follow-up risk, put that risk in the owning tracker, review record, or goal record before treating the workaround as accepted state; keep proof records current, portable, and validated instead of treating them as harmless narration

* preserve the skill-context boundary: the installed Gabe skills are living compiled context from Agent Adventures; use them as the first runtime context, and search the blog only when the skill context is insufficient, stale, contradicted, or being refreshed

* preserve the model boundary: every `gabe-orchestrate` role agent, thread, or goal re-entry uses `gpt-5.6 Sol` with `medium` reasoning; every `gabe-implement` and `gabe-review` role uses an explicit task-appropriate model from the `gpt-5.6` family and a task-appropriate reasoning level, with its selection basis recorded in the role goal, prompt, handoff, lane ledger, or review record

* preserve role-specific GitLab sudo aliasing for public GitLab issue, review, and comment writes: orchestrators use an alias ending in `-orchestrator`, implementers use an alias ending in `-implementor`, and reviewers use an alias ending in `-reviewer`

* preserve the all-MDScript boundary: tasks, comments, plans, goals, durable instructions, handoffs, and continuation records for Gabe-shaped work are executable MDScript with stable headings and exact re-entry commands; use `~/.agents/projects/<project-name>/tasks`, `comments`, `plans`, `goals`, `instructions`, and `lane-ledger.jsonl` as the durable coordination surface outside the working repository; GitLab or chat comments may mirror them but do not replace them

* preserve the MDScript-as-documentation boundary: directly validate MDScript metadata, headings, links, entrypoints, and claimed executable branches, and apply the same review policy as documentation—one fresh review when no code changed, with no recursive non-code re-review after repair

* do not create prose-only task, comment, plan, instruction, handoff, or continuation artifacts when an MDScript artifact can carry the work

* when a UI plan, chat update, tracker comment, or other external surface is useful, write or update the owning MDScript plan or comment first and treat the external representation as a mirror

* preserve the child-orchestrator boundary: child orchestrators are durable Codex threads or file-task child lanes, not subagents, because orchestrators need their own MDScript goal and resumable lane state

* preserve the stop-report boundary: child orchestrators, implementers, reviewers, and goal-resumed Gabe lanes must report back to their parent agent or parent reporting path before they stop for any reason, including done, blocked, paused, obsolete, interrupted, tool-failed, authority-boundary, context-limit, or watcher-terminal states

* preserve the prompt-return boundary: before any Gabe MDScript role asks Gabe, the user, a repository owner, or another authority surface for input, it must write an executable return script under `~/.agents/projects/<project-name>/returns` and end the prompt with the exact `mdscript-exec` resume command

* preserve the thread-cleanup boundary: every agent owns cleanup for chat threads, child orchestrator threads, worker threads, reviewer threads, and subagents it creates; terminal or superseded threads must be closed, archived, deleted when explicitly allowed, transferred with a new owner, or reported as a cleanup blocker before the creating lane claims done, a satisfied review gate, or clean handoff

* preserve the thread-event boundary: parent and child lanes must execute and report exact event MDScript jumps for `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR`; these are disposition or interrupt contracts, not passive status text or labels that require lookup

* preserve the subticket-scope boundary: epics, milestones, projects, portfolios, programs, parent tracker items, release trains, and any scope with subtickets or independently owned child objectives go to a child orchestrator, and the parent orchestrates that child orchestrator rather than its leaf implementers

* preserve the orchestrator goal boundary: orchestrator-owned management, monitor, and watcher state belongs in `~/.agents/projects/<project-name>/goals/*.mdscript.md` with a stable `/mdscript-exec <goal>#resume-goal` re-entry, not in repo-local automations

* preserve the goal MDScript boundary: goal files should include an exact `/mdscript-exec <goal-mdscript>#resume-goal` re-entry point, owner role, lane id, source of truth, stop condition, allowed actions, forbidden actions, and reporting path

* preserve the hot-path boundary: watched or resumable lanes should write goal MDScripts after the first context read, then use those scripts plus fresh live state for resumed turns instead of rereading and narrating the full Gabe and Agent Adventures context stack every heartbeat

* preserve the compaction-resume boundary: long-running, multi-workstream, or goal-backed lanes should add a parent-visible `compaction-resume` file comment that names the task files, comments, goal MDScript, lane ledger, next owner, and exact `/mdscript-exec <goal>#resume-goal` command before relying on resumed coordination

* before any Gabe orchestrator claims ongoing monitoring, resumed coordination, or watcher ownership
  * run `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/goal-mdscript.md#write-goal-mdscript`
  * do not claim the lane is resumable until the MDScript goal names the exact re-entry point and validation fields

* preserve the CI blocker boundary: CI/CD and check failures are watcher state and repair input, but they block only default-branch merge decisions unless the repository or user explicitly defines a narrower proof gate
