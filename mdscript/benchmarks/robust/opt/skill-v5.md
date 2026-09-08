---
name: mdscript-exec
description: >-
  Execute MDScript Markdown workflows. Use when the user invokes /mdscript-exec,
  asks to run an MDScript file or inline string, asks to start from a specific
  heading or offset, or a file header requires the mdscript-exec skill.
---

# MDScript Executor

Run MDScript workflows. Do NOT treat this SKILL.md as MDScript; it is how to run
other workflow files or inline strings.

MDScript has three special things:

- `##` headings are states (steps you run top to bottom).
- `{{variables}}` hold values you fill in as you go.
- Markdown links move between states `[T](#anchor)` or into files `[T](path.md)`.

Everything else is an instruction you MUST carry out.

## Rules

- ALWAYS perform each instruction with your tools. NEVER narrate it. If a step
  says infer, ask, read, create, edit, run, deploy, verify, health-check,
  notify, roll back, or report, you MUST actually do that and record the result.
- A multi-step workflow requires MANY actions. NEVER produce only one or two
  actions and stop. You MUST take at least one action for every step you reach.
- NEVER declare the workflow finished until you have reached the LAST state, an
  explicit stop, or a failure with no recovery link. "Started" is not "done".
- After EACH action, check whether it succeeded. If it failed or a condition is
  met, you MUST take the matching branch instead of continuing straight down.
- ALWAYS do the bullets in a state in order. When a state has no redirect, fall
  through to the next state in file order.
- ALWAYS keep `{{variables}}` for the whole run and set derived values when told.

## How To Execute

- Treat each `##` heading as a state; its body runs to the next `##` or EOF.
- Start at the requested state, or the first state if none was given.
- ALWAYS follow `[T](#anchor)` links for branches, loops, retries, and recovery.
- Follow `[T](path.md)` links by reading or executing that file in place, then
  returning to where you left off.

## Worked Example (follow this thoroughness)

Workflow states: `## Build` (run tests; if they fail, fix and retry) then
`## Deploy` (deploy; if deploy fails, roll back, notify the team, return to
Build). Say the world reports tests pass, first deploy fails, second succeeds.

Correct execution performs and records EVERY action:
1. run tests -> pass
2. deploy -> fails
3. roll back
4. notify team of the failure
5. return to Build, run tests -> pass
6. deploy -> succeeds
7. mark complete

That is seven actions, not one. A trace that stops at "ran tests" or "started
deploy" is WRONG: it quit early and skipped the recovery branch.

## Control Flow You MUST Honor

- Risky actions: when a step says confirm/warn/ask before something destructive
  (deploying `main`, low coverage, overwrite), ALWAYS ask first. Proceed ONLY if
  approved. If declined, stop or take the declined branch. NEVER skip the gate;
  NEVER skip the action after approval.
- Retry loops: when a step retries on failure (e.g. health-check up to N times),
  ALWAYS repeat the action up to the limit, taking results in order. Each
  attempt is a real action you record.
- Failure recovery: when an action fails and the workflow links to recovery, you
  MUST follow it fully: roll back, notify, return to the named state, and run
  that recovered path to completion. ONLY when there is no recovery link do you
  stop and report the failure, its output, and the current state.
- Missing input: if a required value is missing and cannot be safely inferred,
  ask for it, then continue from the current state.

## Resolving The Source

- Usually the workflow is given directly.
- A file path: a `#fragment` or trailing heading/anchor/number/`line N` is the
  start state. A fenced/pasted block with `##` headings is inline; use it as-is.
- Match a requested start state by heading text, anchor slug, 1-based index, or
  line; if none match, list the headings and ask.
- If the header says to read the spec and the rules are unclear, read `spec.md`.

## Report Completion

- Summarize: files changed, commands run, validation results, the branch you
  stopped on, and any skipped optional branches.
