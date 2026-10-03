<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Implementer Lane

* create or use again an implementer only for execution work with a bounded implementation contract
* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)
* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* [Route Scope To Right Lane](#route-scope-to-right-lane)

## Route Scope To Right Lane

* if the requested scope is an epic, milestone, project, portfolio, program, parent tracker item, or release train
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if the requested scope has subtickets, child issues, child MRs, or independently owned objectives
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* if a project control-plane task names three or more independent workstreams, modules, surfaces, owners, proof paths, or separable objective groups
  * do not create a root-level implementer that owns all workstreams
  * [Create Child Orchestrator Thread](create-child-orchestrator-thread.mdscript.md#create-child-orchestrator-thread)
* [Search Existing Implementer](#search-existing-implementer)

## Search Existing Implementer

* search `~/.agents/projects/{{project_name}}/tasks` for a live implementer task that already exists for the same boundary
  * include `{{affected_system}}`, `{{tracker}}`, issues, PRs, MRs, incidents, releases, and repositories as boundaries
* if thread tools are available
  * search for a live Codex worker thread that already exists for the same boundary
* if an existing worker keeps its context and ownership and does not mix in unrelated work
  * use that worker again
  * [Verify Implementer Model Match](#verify-implementer-model-match)
* [Assign Implementer Identity](#assign-implementer-identity)

## Verify Implementer Model Match

* create or resume the implementer with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`
* if you cannot examine or resume an existing implementer with `{{required_model}}` and `{{required_reasoning}}`
  * set `{{blocker}}` to the model or reasoning mismatch
  * [Stop On Implementer Blocker](#stop-on-implementer-blocker)
* [Ensure Implementer Task And Goal](#ensure-implementer-task-and-goal)

## Assign Implementer Identity

* set `{{role_thread_title}}` to `<role>: [<issue>] <description>`
  * use `implementer` for role
  * use the tracker key or MR/PR id for issue
  * use a short human description for description
* if no issue exists and the work is genuinely untracked
  * set `{{role_thread_title}}` to `implementer: [no-issue] <description>`
* assign the lane identity with [Assign Lane Identity](../../self-common/workflows/lane-identity.mdscript.md#assign-lane-identity)
* create or resume the implementer with `model: {{required_model}}` and `reasoning: {{required_reasoning}}`
* [Ensure Implementer Task And Goal](#ensure-implementer-task-and-goal)

## Ensure Implementer Task And Goal

* run [Ensure File Task](../../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task) for the implementer lane with `type: implementer`
* if an agent will resume or monitor the implementer lane, or the lane will move to a different agent
  * run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
* if you wrote a goal
  * set `{{goal_mdscript}}` to the implementer goal path
* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) on the parent task with the implementer handoff contract
* if no durable worker thread tools are available and the work is local, bounded, and authorized
  * run [Use Single Process Fallback](../../self-common/workflows/file-task-comments.mdscript.md#use-single-process-fallback)
  * continue into `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#load-worker-context` for the implementer task in the same process
* [Write Implementer Handoff Contract](#write-implementer-handoff-contract)

## Write Implementer Handoff Contract

* tell the worker to use `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#load-worker-context`
* include the title, objective, repository or surface, tracker, file task id, file comment path, and goal MDScript path
* include the granted permissions, forbidden actions, and necessary evidence
* include `{{claim_scope}}`, the contract preconditions, postconditions, invariants, proof path, and proof boundary
* if infrastructure or services are involved, include the expected local resource path
* include the expected tests
* if the lane claims real-resource artifacts, include the expected real-resource artifacts
* include the implementer-owned review gate
* include `self_review_requested: {{self_review_requested}}`
  * set this value only from an explicit user request or from the answer of the user
  * if the user did not ask for a self-review and did not answer the question, leave this value empty
* include the MR/PR goal rule, no execution subdelegation, and no portfolio chat management
* include the attribution, the parent agent, and the reporting path back to this orchestrator
* include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
* tell the implementer to report back to this orchestrator before it stops for any reason
* if an agent will monitor or resume the lane
  * tell the implementer to create or maintain `{{goal_mdscript}}` after its first context read
* tell the implementer to re-enter with `/mdscript-exec {{goal_mdscript}}#resume-goal` and not read the full skill context again at each wake
* tell the implementer to keep these items separate in the handoff:
  * the exact claim, preconditions, postconditions, invariants, and proof path
  * the local resource path that it tried or ruled out, the `proof_supplied` value, and the `proof_not_claimed` value
  * the blockers that remain, the residual risk, and the authority needed
* tell the implementer that missing infrastructure is not a valid blocker until one of these is true:
  * it found and used the local stack, bootstrap, preflight, dev server, fixture target, compose profile, or safe local resource path
  * it showed that this path is absent, unsafe, or cannot satisfy the precondition
* tell the implementer not to ask reviewers for vague readiness
* tell the implementer that each review request must name the typed claim scope
* include the GitLab sudo alias rule for `-implementor` and `-reviewer` public writes
* include the rule that project control-plane comment MDScripts come before mirrored public GitLab writes
* tell the implementer that it owns execution
* tell the implementer that it owns the self-review composition, with per-lane blind fanout, only if `self_review_requested` is `true`
* tell the implementer that this orchestrator owns coordination, lane state, permission boundaries, final decision reports, and orchestrator-owned goals
* tell the implementer not to delegate the full `/self-review` skill to a nested subagent
* tell the implementer to delegate only lane MDScripts
* tell the implementer that reports can include direct jumps, such as `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#monitor-implementer-lane`
* if the `TARGET_DRIFT`, `HANDOFF_UNACKED`, `STALE_MR`, or `DISPOSITION_READY` contracts apply
  * tell the implementer to execute and report the `{{event_exec}}` that matches
* if this is a project control-plane workflow and the current process has the authority to execute the implementer task
  * keep the role boundary in the comments
  * execute the implementation lane
  * do not leave the task file as a passive assignment
* [Verify Implementer Handoff Contract](#verify-implementer-handoff-contract)

## Verify Implementer Handoff Contract

* make sure that the implementer file task exists with `type: implementer`
* make sure that the parent file comment records the implementer handoff contract
* make sure that the handoff names `{{claim_scope}}`, the proof path, granted permissions, forbidden actions, parent agent, and reporting path
* if monitored or resumed work needs a goal and `{{goal_mdscript}}` is missing
  * set `{{blocker}}` to `missing implementer goal MDScript`
  * [Repair Implementer Handoff Contract](#repair-implementer-handoff-contract)
* if a necessary handoff field is missing
  * set `{{blocker}}` to the missing implementer handoff field
  * [Repair Implementer Handoff Contract](#repair-implementer-handoff-contract)
* [Finalize Implementer Create](#finalize-implementer-create)

## Repair Implementer Handoff Contract

* write the missing handoff fields again into the implementer task, goal, and parent file comment
* if a goal is necessary
  * set `{{goal_mdscript}}` again to the implementer goal path
* [Verify Implementer Handoff Contract](#verify-implementer-handoff-contract)

## Finalize Implementer Create

* change the ledger with [Maintain Lane Ledger](../../self-common/workflows/lane-ledger.mdscript.md#maintain-lane-ledger)
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Stop On Implementer Blocker

* if the caller asks the user, a repository owner, or an authority surface for a model, runner, or handoff decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the stop-boundary state of the caller
* report `Blocked for {{claim_scope}}: {{blocker}}`
* stop
