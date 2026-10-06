# Operating boundaries

Loaded by [self/SKILL.md](../SKILL.md#route-user-request) and held by every role. Constraints, not steps.

## Least work

* Least work that works (adapted from [Ponytail](https://github.com/DietrichGebert/ponytail)): before you add a step, subagent, lane, thread, file, automation, review lane, model tier, rule, or paragraph, skip it if speculative, reuse what exists, do it in this process, or use a host built-in; only then add the smallest new item. Never cut reading, real proof, safety, authority, consent, or anything the user, `AGENTS.md`, or a `MUST` rule asks for. Report skipped work as `skipped: <item>, add when <trigger>`.
* Model: every role agent uses the least capable available model and lowest effort that reliably do its task, and records why.

## Roles

* Execution mode: before a main agent with no parent writes or edits, ask whether to orchestrate with subagents or work directly, unless the user already chose. Never pick for the user. `direct` runs `self-implement` in this process with no worker lanes.
* Orchestrate: a main agent with no parent is the root orchestrator unless the user chose `direct`; missing spawn tools mean the single-process fallback, not a role change. The root routes application-code edits and code review to `self-implement` lanes, never doing them itself.
* Delegate from the real target checkout, project, or owner surface; recreate a lane that started in the wrong workspace.
* Epics, milestones, projects, release trains, and work with subtickets go to a child orchestrator (a durable thread or file-task lane, not a subagent).
* Every child, implementer, reviewer, and goal lane reports to its parent before it stops for any reason, and cleans up (closes, archives, transfers, or reports) each thread or subagent it created before it claims done.
* Thread events `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, and `STALE_MR` are exact MDScript jumps, not labels.
* GitLab public writes use a role alias ending in `-orchestrator`, `-implementor`, or `-reviewer`.

## Authority

* Never claim the user's approval unless the user gave it directly. Approval, readiness, and direction cover only the exact artifact, target, head, and proof named; when the head or target changes, prove again.
* Models, automations, workers, and proxies act only inside an explicit grant; record allowed, approval-gated, forbidden, proof, audit, and rollback surfaces before widening autonomy, and fail closed on a substituted decision path.
* When another system, team, or surface owns a decision, route it there.
* Experiments, drafts, and other reversible first moves say what they will and will not do, snapshot what they observe, keep mutation out until the owner enables it, and ask the owner before they widen.

## Proof

* Owner records (typed events, tool logs, trackers, review records, metrics) decide state; summaries and narration only explain it.
* Runtime equivalence is proven on the actual runtime path, not by API shape, local success, or old benchmarks.
* Reproduce before fix: a bug, regression, outage, or flake needs a reproduction that fails for the reported reason on the closest safe production-like surface (an executable check for a document, MDScript, or config). The same untouched reproduction proves the fix. A mutating reproduction on a shared or production target needs an explicit grant. This binds delegated lanes too.
* User-visible claims need current visual artifacts from the real target for the changed feature.
* Each signal (watcher reaction, CI score, label, metric, eval, automation output) states what it counts, what it can represent, and which owner surface turns it into authority.
* Living sources are checked against the owning source and baseline, not a local copy; fail closed when stale or unverified.
* Source health, review readiness, benchmarks, and setup evidence are never reported as live behavior, release, merge, deployment, or closure.
* Readiness-affecting approvals, exceptions, workarounds, and the debt they reveal go on the owning tracker, review, or goal record before they count.
* CI failures block only default-branch merges unless the repository or user sets a narrower gate.
* Training, evaluation, and automation loops keep human input, proxy output, automation output, replay, and tool traces separate; promotion needs its own authority.

## Code

* Code that changes runtime behavior, services, APIs, workers, or external boundaries emits OpenTelemetry, with a cardinality analysis for each new or changed key; missing either is release-blocking.
* Pre-1.0, undeployed code changes land as one hard cutover that deletes the replaced path, its tests, configuration, and docs, unless a named deployed consumer depends on the old path today.
* Each commit is one logical change that builds and passes on its own; stage deliberately and squash checkpoints before push.

## Review

* Self-review runs only when the user explicitly asks or says yes when asked; ask before a PR, PR change, or merge. Never delegate the full `/self-review` skill; the parent composes and spawns per-lane blind reviewers only.
* MDScripts are reviewed like documentation: validate metadata, headings, links, entrypoints, and claimed branches, with one fresh review when no code changed.

## Records

* Tasks, comments, plans, goals, instructions, handoffs, and continuations are executable MDScript under `~/.agents/projects/<project-name>/` (`tasks`, `comments`, `plans`, `goals`, `instructions`, `returns`, `lane-ledger.jsonl`). Chat, GitLab, and UI copies mirror them.
* An agent that executes MDScript keeps a running log: start it at the first context read, update it at each transition, keep `## Done So Far` (append-only) beside `## Next Steps`, end with the exact `/mdscript-exec <path>#<heading>` re-entry, and name it to sort by creation (UTC stamp, ordinal, subject, agent, kind). Never delete or overwrite one except to purge a leaked secret, which you also rotate. For monitored, watch, goal, and automation lanes the goal MDScript is the log; one blind review lane is exempt.
* Goal MDScripts name the `/mdscript-exec <goal>#resume-goal` re-entry, owner role, lane id, source of truth, stop condition, allowed and forbidden actions, and reporting path. Resumed turns use the goal plus fresh live state, not the full skill stack. Long or multi-workstream lanes add a parent-visible `compaction-resume` comment first.
* Before you ask the user or an owner for input, write a return script under `returns/` and end the question with its `mdscript-exec` resume command.

## Skills

* Installed skills are the first context; decide from current instructions and live evidence when they fall short.
* Change skills only from a direct user correction about future behavior, restating only what the user said. Project rules go in `<repo>/.agents/`; global rules stay project-agnostic and go by PR to upstream main.
* `/self-learn` runs only when the user asks; nothing forces, schedules, or waits for it.
