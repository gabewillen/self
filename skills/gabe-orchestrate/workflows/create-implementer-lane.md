<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Create Implementer Lane

* create or reuse an implementer only for execution work with a bounded implementation contract

* run [Resolve File Task Root](../../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* run [Select Configured Model And Reasoning](../../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `implementer` before creating, reusing, or handing off an implementer lane

* if the requested scope is an epic, milestone, project, portfolio, program, parent tracker item, release train, or anything with subtickets, child issues, child MRs, or independently owned objectives
  * create or reuse a child orchestrator instead of a direct implementer lane
  * return to `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/create-child-orchestrator-thread.md#create-child-orchestrator-thread`

* if this is a project control-plane workflow and the parent task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * do not create a root-level implementer that owns all workstreams
  * create or reuse child-orchestrator tasks for the named workstreams first
  * create implementer lanes only under the matching child-orchestrator task
  * return to `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/create-child-orchestrator-thread.md#create-child-orchestrator-thread`

* search `~/.agents/projects/{{project_name}}/tasks` for an existing live implementer task for `{{affected_system}}`, `{{tracker}}`, issue, PR, MR, incident, release, or repository

* search for an existing live Codex worker thread for the same boundary when thread tooling is available

* reuse an existing worker only when its file task preserves context and ownership without mixing unrelated work

* set `{{role_thread_title}}` to `<role>: [<issue>] <description>`, using `implementer` for `{{role}}`, the tracker key or MR/PR id for `{{issue}}`, and a short human description

* create or resume the implementer with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`

* if an existing implementer cannot be verified or resumed with the selected `{{required_model}}` and `{{required_reasoning}}` reasoning
  * set `{{blocker}}` to the model or reasoning mismatch
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for a different model, runner, or handoff decision, run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state

* if no issue exists
  * use `<role>: [no-issue] <description>` only for genuinely untracked work

* assign lane identity with [Assign Lane Identity](../../gabe-common/workflows/lane-identity.md#assign-lane-identity)

* run [Ensure File Task](../../gabe-common/workflows/file-task-comments.md#ensure-file-task) for the implementer lane with `type: implementer`

* run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript) when the implementer lane will be resumed, monitored, or handed across agents

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment) on the parent task with the implementer handoff contract

* when durable worker thread tooling is unavailable and the work is local, bounded, and authorized
  * run [Use Single Process Fallback](../../gabe-common/workflows/file-task-comments.md#use-single-process-fallback)
  * continue into `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#load-worker-context` for the implementer task in the same process

* instruct the worker to use `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#load-worker-context`

* include title, objective, repository or surface, tracker, file task id, file comment path, goal MDScript path, granted permissions, forbidden actions, required evidence, `{{claim_scope}}`, contract preconditions, postconditions, invariants, proof path, proof boundary, expected local resource path when infrastructure or services are involved, expected tests, expected real-resource artifacts when claimed, implementer-owned review gate, MR/PR goal requirement, no execution subdelegation, no portfolio chat management, attribution, parent agent, reporting path back to this orchestrator, `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`

* require the implementer to report back to this orchestrator before stopping for any reason, including done, blocked, paused, obsolete, interrupted, tool-failed, authority-boundary, context-limit, goal-terminal, or review-terminal states

* require the implementer to create or maintain `{{goal_mdscript}}` after its first context read when the lane will be monitored or resumed; re-entry should use `/mdscript-exec {{goal_mdscript}}#resume-goal` instead of rereading and narrating full Gabe, Agent Adventures, event, watcher, and ledger context on every wake

* require the implementer handoff to separate exact claim, preconditions, postconditions, invariants, proof path, local resource path attempted or ruled out, proof supplied, proof not claimed, remaining blockers, residual risk, and authority needed

* tell the implementer that missing infrastructure is not a valid blocker until the repo-local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path has been found and used, or explicitly shown absent, unsafe, or unable to satisfy the precondition

* tell the implementer not to ask reviewers for vague readiness; the review request must name the typed claim scope such as `source-health`, `ci-repair`, `audit-completion`, `blocker-note-completion`, `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, or `deployment-readiness`

* include the GitLab sudo alias requirement
  * implementer public GitLab issue, review, and comment writes use `gitlab-sudo-alias` with an alias ending in `-implementor`
  * reviewer public GitLab issue, review, and comment writes use `gitlab-sudo-alias` with an alias ending in `-reviewer`
  * project control-plane comment MDScripts are still required before mirrored public GitLab writes

* make clear that the implementer owns execution and code review while this orchestrator owns coordination, lane state, permission boundaries, final decision reporting, and orchestrator-owned goals

* in a project control-plane workflow, do not leave implementer task files as passive assignments when the current process has authority to execute them; preserve the role boundary in comments and execute the implementation lane

* tell the implementer that reports may include direct jumps such as `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/SKILL.md#monitor-implementer-lane` or workflow-file jumps for this orchestrator to continue at the right state

* tell the implementer to execute and report the matching `{{event_exec}}` for `TARGET_DRIFT`, `HANDOFF_UNACKED`, `STALE_MR`, and `DISPOSITION_READY` when those event contracts apply, and to treat them as interrupts or disposition actions instead of ordinary status

* update the ledger with [Maintain Lane Ledger](../../gabe-common/workflows/lane-ledger.md#maintain-lane-ledger)
