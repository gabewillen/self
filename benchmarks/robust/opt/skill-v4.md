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
- NEVER stop until the whole flow is complete. You MUST run every state and
  every branch the conditions select, not just the happy path.
- NEVER end after one or two steps. A short trace means you quit early; keep
  going until a terminal state, an explicit stop, or an unrecovered failure.
- ALWAYS do the bullets in a state in order. When a state has no redirect, fall
  through to the next state in file order.
- ALWAYS keep `{{variables}}` for the whole run and set derived values when told.

## How To Execute

- Treat each `##` heading as a state; its body runs to the next `##` or EOF.
- Start at the requested state, or the first state if none was given.
- After EACH action, check whether it succeeded. If it failed or a condition is
  met, you MUST take the matching branch instead of continuing straight down.
- ALWAYS follow `[T](#anchor)` links for branches, loops, retries, and recovery.
- Follow `[T](path.md)` links by reading or executing that file in place, then
  returning to where you left off.

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
  start state.
- A fenced/pasted block with `##` headings is an inline workflow; use it as-is.
- Match a requested start state by heading text, anchor slug, 1-based index, or
  line; if none match, list the headings and ask.
- If the header says to read the spec and the rules are unclear, read `spec.md`.

## Report Completion

- Summarize: files changed, commands run, validation results, the branch you
  stopped on, and any skipped optional branches.
