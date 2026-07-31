<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Goal And Contract

* read [Goal Contract Policy](../references/goal-contract-policy.md)
* inspect the artifact for objective, done state, blockers, accepted input, promised output, ownership, failure behavior, and required evidence
* for each missing field among objective, done state, blockers, accepted input, promised output, ownership, failure behavior, and required evidence
  * add a finding with consequence and evidence pointer
* if work started from a patch instead of a contract, changed hidden scope, or lacks a done state
  * add a finding with consequence and evidence pointer
* if the artifact is a PR or MR
  * inspect the PR/MR for inputs/preconditions, outputs/postconditions, invariants, and proof path
  * for each missing Design by Contract field
    * add a finding requiring the author to define the contract before acceptance review
* if the work covers async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior
  * inspect for explicit states, events, guards, typed inputs, typed outputs, failures, metrics, ownership, rollback, and teardown
  * for each missing element
    * add a finding with consequence and evidence pointer
* if model judgment reconstructs facts already known through structured data, typed state, product contracts, telemetry, or events
  * add a finding with consequence and evidence pointer
* if the artifact is an MDScript workflow that prompts for user or authority input
  * inspect the prompt contract for the pending decision, return script path, exact resume command, saved context, and caller resume heading
  * for each missing prompt-contract field
    * add a finding with consequence and evidence pointer
* if the artifact is a Gabe-shaped task, comment, plan, durable instruction, handoff, or continuation
  * [Check Gabe Artifact Shape](#check-gabe-artifact-shape)
* [After Gabe Shape](#after-gabe-shape)

## Check Gabe Artifact Shape

* if the artifact is prose-only
  * add a finding with consequence and evidence pointer
* inspect the artifact for an MDScript execution header, stable state headings, one discrete executable action per step, explicit failure and recovery branches, and an exact re-entry command when work can continue
* for each missing shape requirement
  * add a finding with consequence and evidence pointer
* for each bullet that explains why a rule exists rather than naming an action
  * add a finding requiring rationale in a linked reference file
* [After Gabe Shape](#after-gabe-shape)

## After Gabe Shape

* if the change touches MDScript files
  * [Run MDScript Validator](#run-mdscript-validator)
* [Check MDScript Shape And Role Models](#check-mdscript-shape-and-role-models)

## Run MDScript Validator

* if `scripts/validate-mdscript.mjs` is available from the pack root
  * run `node scripts/validate-mdscript.mjs <changed paths>` from the pack root
  * for each error the validator reports
    * add a finding quoting the file, line, and rule
  * for each warning the change introduced
    * add a finding quoting the file, line, and rule
* [Check MDScript Shape And Role Models](#check-mdscript-shape-and-role-models)

## Check MDScript Shape And Role Models

* inspect every `{{variable}}` that builds a path, command, or re-entry
* for each such variable with no state set and no caller supply
  * add a finding with consequence and evidence pointer
* inspect every conditional branch
* for each branch that neither jumps to an explicit state link nor stops
  * add a finding with consequence and evidence pointer
* inspect every state that routes or dispatches
* for each such state that continues into the next state when it should have terminated
  * add a finding with consequence and evidence pointer
* if the artifact creates, resumes, reviews, or depends on a `gabe-orchestrate`, `gabe-implement`, or `gabe-review` role agent
  * inspect the artifact for explicit `model`, `reasoning`, and `model_selection_basis` chosen for that role's exact task and proof scope
  * if the selection is missing, unsupported by the task, silently substituted, carried over from another lane, or clearly insufficient for the role contract
    * add a finding with consequence and evidence pointer
  * if the artifact claims the role is correctly configured without recording the selection
    * add a finding with consequence and evidence pointer
* return to the caller
