<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Implementer Lane

* create or reuse an implementer only for execution work with a bounded implementation contract
* run [Resolve File Task Root](../../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)
* run [Select Configured Model And Reasoning](../../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `implementer`
* [Route Scope To Right Lane](#route-scope-to-right-lane)

## Route Scope To Right Lane

* if the requested scope is an epic, milestone, project, portfolio, program, parent tracker item, release train, or anything with subtickets, child issues, child MRs, or independently owned objectives
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.md#create-child-orchestrator-thread)
* if this is a project control-plane workflow and the parent task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * do not create a root-level implementer that owns all workstreams
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.md#create-child-orchestrator-thread)
* [Search Existing Implementer](#search-existing-implementer)

## Search Existing Implementer

* search `~/.agents/projects/{{project_name}}/tasks` for an existing live implementer task for `{{affected_system}}`, `{{tracker}}`, issue, PR, MR, incident, release, or repository
* search for an existing live Codex worker thread for the same boundary when thread tooling is available
* if an existing worker preserves context and ownership without mixing unrelated work
  * reuse that worker
  * [Verify Implementer Model Match](#verify-implementer-model-match)
* [Assign Implementer Identity](#assign-implementer-identity)

## Verify Implementer Model Match

* create or resume the implementer with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`
* if an existing implementer cannot be verified or resumed with `{{required_model}}` and `{{required_reasoning}}`
  * set `{{blocker}}` to the model or reasoning mismatch
  * [Stop On Implementer Blocker](#stop-on-implementer-blocker)
* [Ensure Implementer Task And Goal](#ensure-implementer-task-and-goal)

## Assign Implementer Identity

* set `{{role_thread_title}}` to `<role>: [<issue>] <description>` using `implementer` for role, the tracker key or MR/PR id for issue, and a short human description
* if no issue exists
  * set `{{role_thread_title}}` to `implementer: [no-issue] <description>` only for genuinely untracked work
* assign lane identity with [Assign Lane Identity](../../gabe-common/workflows/lane-identity.md#assign-lane-identity)
* create or resume the implementer with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`
* [Ensure Implementer Task And Goal](#ensure-implementer-task-and-goal)

## Ensure Implementer Task And Goal

* run [Ensure File Task](../../gabe-common/workflows/file-task-comments.md#ensure-file-task) for the implementer lane with `type: implementer`
* run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript) when the implementer lane will be resumed, monitored, or handed across agents
* resolve `{{goal_mdscript}}` from the implementer goal path when a goal was written
* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment) on the parent task with the implementer handoff contract
* if durable worker thread tooling is unavailable and the work is local, bounded, and authorized
  * run [Use Single Process Fallback](../../gabe-common/workflows/file-task-comments.md#use-single-process-fallback)
  * continue into `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#load-worker-context` for the implementer task in the same process
* [Write Implementer Handoff Contract](#write-implementer-handoff-contract)

## Write Implementer Handoff Contract

* instruct the worker to use `/mdscript-exec {{repo_root}}/skills/gabe-implement/SKILL.md#load-worker-context`
* include title, objective, repository or surface, tracker, file task id, file comment path, goal MDScript path, granted permissions, forbidden actions, and required evidence
* include `{{claim_scope}}`, contract preconditions, postconditions, invariants, proof path, proof boundary, expected local resource path when infrastructure or services are involved, expected tests, and expected real-resource artifacts when claimed
* include implementer-owned review gate, MR/PR goal requirement, no execution subdelegation, no portfolio chat management, attribution, parent agent, and reporting path back to this orchestrator
* include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
* require the implementer to report back to this orchestrator before stopping for any reason
* require the implementer to create or maintain `{{goal_mdscript}}` after its first context read when the lane will be monitored or resumed
* require re-entry via `/mdscript-exec {{goal_mdscript}}#resume-goal` instead of rereading full skill context on every wake
* require the handoff to separate exact claim, preconditions, postconditions, invariants, proof path, local resource path attempted or ruled out, proof supplied, proof not claimed, remaining blockers, residual risk, and authority needed
* tell the implementer that missing infrastructure is not a valid blocker until the local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path has been found and used, or explicitly shown absent, unsafe, or unable to satisfy the precondition
* tell the implementer not to ask reviewers for vague readiness; the review request must name the typed claim scope
* include the GitLab sudo alias requirement for `-implementor` and `-reviewer` public writes and project control-plane comment MDScripts before mirrored public GitLab writes
* make clear that the implementer owns execution and gabe-review composition (including per-lane blind fanout), while this orchestrator owns coordination, lane state, permission boundaries, final decision reporting, and orchestrator-owned goals
* forbid the implementer from re-delegating the full `/gabe-review` skill to a nested subagent; lane MDScripts only
* tell the implementer that reports may include direct jumps such as `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/SKILL.md#monitor-implementer-lane`
* tell the implementer to execute and report matching `{{event_exec}}` for `TARGET_DRIFT`, `HANDOFF_UNACKED`, `STALE_MR`, and `DISPOSITION_READY` when those contracts apply
* if this is a project control-plane workflow and the current process has authority to execute the implementer task
  * preserve the role boundary in comments
  * execute the implementation lane instead of leaving the task file as a passive assignment
* [Verify Implementer Handoff Contract](#verify-implementer-handoff-contract)

## Verify Implementer Handoff Contract

* verify the implementer file task exists with `type: implementer`
* verify the parent file comment records the implementer handoff contract
* verify the handoff names `{{claim_scope}}`, proof path, granted permissions, forbidden actions, parent agent, and reporting path
* if a goal is required for monitored or resumed work and `{{goal_mdscript}}` is missing
  * set `{{blocker}}` to `missing implementer goal MDScript`
  * [Repair Implementer Handoff Contract](#repair-implementer-handoff-contract)
* if any required handoff field is missing
  * set `{{blocker}}` to the missing implementer handoff field
  * [Repair Implementer Handoff Contract](#repair-implementer-handoff-contract)
* [Finalize Implementer Create](#finalize-implementer-create)

## Repair Implementer Handoff Contract

* rewrite the missing handoff fields into the implementer task, goal, and parent file comment
* resolve `{{goal_mdscript}}` again from the implementer goal path when a goal is required
* [Verify Implementer Handoff Contract](#verify-implementer-handoff-contract)

## Finalize Implementer Create

* update the ledger with [Maintain Lane Ledger](../../gabe-common/workflows/lane-ledger.md#maintain-lane-ledger)
* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)

## Stop On Implementer Blocker

* if the caller will ask the user, a repository owner, or another authority surface for a different model, runner, or handoff decision
  * run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state
* stop and report `Blocked for {{claim_scope}}: {{blocker}}`
