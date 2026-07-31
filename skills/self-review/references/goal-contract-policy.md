# Goal and contract policy

Hold these rules while checking artifact contracts and MDScript shape.

## Artifact must preserve

- objective
- done state
- blockers
- accepted input
- promised output
- ownership
- failure behavior
- required evidence

## PR/MR Design by Contract

Require a Design by Contract proof contract with:

| Field | Meaning |
| --- | --- |
| inputs and preconditions | what must exist before `{{proof_claim}}` can be tested |
| outputs and postconditions | what the MR promises to produce |
| invariants | what must remain true across the change |
| proof path | exact tests, screenshots, traces, resources, artifacts, public review, or live checks that prove the claim |

**Add a finding** if work started from a patch instead of a contract, changed hidden scope, or lacks a done state.

**Add a finding** if a PR/MR lacks inputs/preconditions, outputs/postconditions, invariants, or proof path (author must define the contract before acceptance review).

## Async, lifecycle, retry, timeout, command-surface, target-scope, coordination, or user-visible behavior

**Require** explicit states, events, guards, typed inputs, typed outputs, failures, metrics, ownership, rollback, and teardown.

## Model judgment vs structured data

**Add a finding** if model judgment reconstructs facts already known through structured data, typed state, product contracts, telemetry, or events.

## MDScript prompt contracts

For MDScript workflows that prompt for user or authority input, require the contract to name:

- the pending decision
- return script path
- exact resume command
- saved context
- caller heading that resumes after the answer

## agent-shaped artifacts

Each agent-shaped task, comment, plan, durable instruction, handoff, and continuation artifact must include:

- an MDScript execution header
- stable state headings
- one discrete executable action per step
- explicit failure and recovery branches
- an exact re-entry command when work can continue

**Add a finding** if such an artifact is prose-only.

**Add a finding** for any bullet that explains why a rule exists rather than naming an action; rationale belongs in a linked reference file, not a state body.

## MDScript validator

When the change touches MDScript files and `scripts/validate-mdscript.mjs` is available from the pack root:

- run `node scripts/validate-mdscript.mjs <changed paths>`
- add a finding for every error it reports, quoting file, line, and rule
- treat its warnings as findings when the change introduced them
- do not re-derive by reading what the validator already decides

## MDScript branch and variable shape

**Add a finding** for:

- any `{{variable}}` that builds a path, command, or re-entry when no state sets it and no caller supplies it
- any conditional branch that neither jumps to an explicit `[State](#anchor)` nor stops
- a state that continues into the next state after routing or dispatching when it should have terminated

## Role agent model selection

When the artifact creates, resumes, reviews, or depends on a `self-orchestrate`, `self-implement`, or `self-review` role agent:

**Require** explicit `model`, `reasoning`, and `model_selection_basis` chosen for that role's exact task and proof scope.

**Add a finding** when:

- selection is missing, unsupported by the task, silently substituted, carried over from another lane, or clearly insufficient for the role contract
- the artifact claims the role is correctly configured without recording the selection

Do not require a specific model name; require that the recorded basis justifies the choice against the task.
