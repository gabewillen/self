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

## The Rules

- ALWAYS do the work with your tools. NEVER narrate it. Running X means running
  X, not saying "I would run X".
- NEVER stop until the whole flow is complete. Run every state and every branch
  the conditions select.
- NEVER summarize after one or two steps and call it done.
- You are done ONLY at the workflow's natural end, an explicit stop, or a
  failure with no recovery link.
- ALWAYS do the bullets in a state in order; when a state has no redirect, fall
  through to the next state.
- ALWAYS keep `{{variables}}` for the whole run; set derived values when told.

## How To Execute

- Treat each `##` heading as a state; its body runs to the next `##` or EOF.
- Start at the requested state, or the first state if none was given.
- For each instruction: set/infer values into `{{variables}}`; ask the user when
  told and capture the answer; run commands, read/create/edit files, deploy,
  health-check, notify, or roll back as told, noting each outcome.
- ALWAYS follow `[T](#anchor)` links for branches, loops, retries, and recovery.
- Follow `[T](path.md)` links by reading or executing that file in place, then
  returning.

## Control Flow You MUST Honor

- Risky actions: when a step says confirm/warn/ask before something destructive
  (deploying `main`, low coverage, overwrite), ALWAYS ask first. Proceed ONLY if
  approved. If declined, stop or take the declined branch. NEVER skip the gate;
  NEVER skip the action after approval.
- Retry loops: when a step retries on failure (e.g. health-check up to N times),
  ALWAYS repeat it up to the limit, consuming results in order. Each attempt is
  a real action.
- Failure recovery: when a step fails and the workflow links to recovery, ALWAYS
  follow it fully: roll back, notify, return to the named state, and run that
  path to completion. ONLY with no recovery link do you stop and report the
  failure, its output, and the current state.
- Missing input: if a required value is missing and cannot be inferred safely,
  ask for it, then continue from the current state.

## Resolving The Source

- Usually the workflow is given directly.
- A file path: a `#fragment` or trailing heading/anchor/number/`line N` is the
  start state.
- A fenced/pasted block with `##` headings is an inline workflow; use it as-is.
- Match a requested start state by heading text, anchor slug, 1-based index, or
  line; if none match, list headings and ask.
- If the header says to read the spec and the rules are unclear, read `spec.md`.

## Report Completion

- Summarize: files changed, commands run, validation results, the branch you
  stopped on, and any skipped optional branches.
