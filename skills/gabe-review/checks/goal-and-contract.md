<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Goal And Contract

* verify the artifact preserves objective, done state, blockers, accepted input, promised output, ownership, failure behavior, and required evidence

* for PR/MR work, require a Design by Contract proof contract:
  * inputs and preconditions: what must exist before `{{proof_claim}}` can be tested
  * outputs and postconditions: what the MR promises to produce
  * invariants: what must remain true across the change
  * proof path: exact tests, screenshots, traces, resources, artifacts, public review, or live checks that prove the claim

* if work started from a patch instead of a contract, changed hidden scope, or lacks a done state
  * add a finding with consequence and evidence pointer

* if a PR/MR lacks inputs/preconditions, outputs/postconditions, invariants, or proof path
  * add a finding requiring the author to define the contract before acceptance review

* for async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior
  * require explicit states, events, guards, typed inputs, typed outputs, failures, metrics, ownership, rollback, and teardown

* if model judgment reconstructs facts already known through structured data, typed state, product contracts, telemetry, or events
  * add a finding

* for MDScript workflows that prompt for user or authority input
  * require the contract to name the pending decision, return script path, exact resume command, saved context, and caller heading that resumes after the answer

* if a Gabe-shaped task, comment, plan, durable instruction, handoff, or continuation artifact is prose-only
  * add a finding

* require each Gabe-shaped task, comment, plan, durable instruction, handoff, and continuation artifact to include an MDScript execution header, stable state headings, one discrete executable action per step, explicit failure and recovery branches, and an exact re-entry command when work can continue

* add a finding for any bullet that explains why a rule exists rather than naming an action
* require that rationale live in a linked reference file rather than a state body

* if the change touches MDScript files
  * run `node scripts/validate-mdscript.mjs <changed paths>` from the pack root when the script is available
  * add a finding for every error it reports, quoting the file, line, and rule
  * treat its warnings as findings when the change introduced them
  * do not re-derive by reading what the validator already decides

* add a finding for any `{{variable}}` that builds a path, command, or re-entry when no state sets it and no caller supplies it
* add a finding for any conditional branch that neither jumps to an explicit `[State](#anchor)` nor stops
* add a finding for a state that continues into the next state after routing or dispatching, when it should have terminated

* if the artifact creates, resumes, reviews, or depends on a `gabe-orchestrate`, `gabe-implement`, or `gabe-review` role agent
  * require an explicit `model`, `reasoning`, and `model_selection_basis` chosen for that role's exact task and proof scope
  * add a finding when the selection is missing, unsupported by the task, silently substituted, carried over from another lane, or clearly insufficient for the role contract
  * add a finding when the artifact claims the role is correctly configured without recording the selection
  * do not require a specific model name; require that the recorded basis justifies the choice against the task
