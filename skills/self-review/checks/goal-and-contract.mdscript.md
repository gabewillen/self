<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Goal And Contract

* read [Goal Contract Policy](../references/goal-contract-policy.md)
* examine the artifact for the objective, done state, blockers, accepted input, promised output, ownership, failure behavior, and necessary evidence
* for each of these fields that is missing
  * add a finding with the consequence and an evidence pointer
* if the work started from a patch instead of a contract, changed hidden scope, or has no done state
  * add a finding with the consequence and an evidence pointer
* if the artifact is a PR or MR
  * examine the PR/MR for inputs/preconditions, outputs/postconditions, invariants, and the proof path
  * for each Design by Contract field that is missing
    * add a finding that tells the author to define the contract before acceptance review
* if the work covers async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior
  * examine the work for explicit states, events, guards, typed inputs, typed outputs, and failures
  * examine the work for metrics, ownership, rollback, and teardown
  * for each missing element
    * add a finding with the consequence and an evidence pointer
* if model judgment builds again facts that structured data, typed state, product contracts, telemetry, or events already give
  * add a finding with the consequence and an evidence pointer
* if the artifact is an MDScript workflow that prompts for user or authority input
  * examine the prompt contract for the open decision, return script path, exact resume command, saved context, and caller resume heading
  * for each prompt-contract field that is missing
    * add a finding with the consequence and an evidence pointer
* if the artifact is an agent-shaped task, comment, plan, durable instruction, handoff, or continuation
  * [Check Agent Artifact Shape](#check-agent-artifact-shape)
* [After Agent Shape](#after-agent-shape)

## Check Agent Artifact Shape

* if the artifact is prose-only
  * add a finding with the consequence and an evidence pointer
* examine the artifact for an MDScript execution header, stable state headings, and one discrete executable action for each step
* examine the artifact for explicit failure and recovery branches
* if the work can continue
  * examine the artifact for an exact re-entry command
* for each shape rule that the artifact does not satisfy
  * add a finding with the consequence and an evidence pointer
* for each bullet that explains why a rule exists and does not name an action
  * add a finding that asks to move the rationale to a linked reference file
* [After Agent Shape](#after-agent-shape)

## After Agent Shape

* if the change touches MDScript files
  * [Run MDScript Validator](#run-mdscript-validator)
* [Check MDScript Shape And Role Models](#check-mdscript-shape-and-role-models)

## Run MDScript Validator

* if `scripts/validate-mdscript.mjs` is available from the pack root
  * run `node scripts/validate-mdscript.mjs <changed paths>` from the pack root
  * for each error the validator reports
    * add a finding that quotes the file, line, and rule
  * for each warning the change introduced
    * add a finding that quotes the file, line, and rule
* [Check MDScript Shape And Role Models](#check-mdscript-shape-and-role-models)

## Check MDScript Shape And Role Models

* examine each `{{variable}}` that builds a path, command, or re-entry
* for each such variable that no state sets and no caller gives
  * add a finding with the consequence and an evidence pointer
* examine each conditional branch
* for each branch that neither jumps to an explicit state link nor stops
  * add a finding with the consequence and an evidence pointer
* examine each state that routes or dispatches
* for each such state that must stop but continues into the next state
  * add a finding with the consequence and an evidence pointer
* if the artifact creates, resumes, reviews, or depends on a `self-orchestrate`, `self-implement`, or `self-review` role agent
  * examine the artifact for an explicit `model`, `reasoning`, and `model_selection_basis`
  * make sure that the selection agrees with the exact task and proof scope of that role
  * if the selection is missing, not supported by the task, silently replaced, or carried over from another lane
    * add a finding with the consequence and an evidence pointer
  * if the selection is clearly not enough for the role contract
    * add a finding with the consequence and an evidence pointer
  * if the artifact claims a correct role configuration but does not record the selection
    * add a finding with the consequence and an evidence pointer
* return to the caller
