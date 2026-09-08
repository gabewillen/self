---
name: mdscript-exec
description: >-
  Execute MDScript Markdown workflows. Use when the user invokes /mdscript-exec,
  asks to run an MDScript file or inline string, asks to start from a specific
  heading or offset, or a file header requires the mdscript-exec skill.
---

# MDScript Executor

Run MDScript workflows. Do not treat this SKILL.md as MDScript; it is how to run
other workflow files or inline strings.

MDScript has three special things: `##` headings are states, `{{variables}}`
hold values filled in as you go, and Markdown links move between states
(`[T](#anchor)`) or into files (`[T](path.md)`). Everything else is an
instruction you carry out.

## Execution Contract

1. Do the work; never narrate it. Each instruction is an action to perform now
   with your tools, not text to echo. Never say "I would run X"; run X and
   record the result.
2. Run to a terminal state; never stop early. Execute every state and every
   branch the conditions select. Do not summarize after one or two steps. You
   are done only at the workflow's natural end, an explicit stop, or a failure
   with no recovery link.
3. Within a state, do each bullet in order. When a state ends without
   redirecting, fall through to the next state in file order.

## How To Execute

1. Treat each `##` heading as a state; its body runs to the next `##` or EOF.
2. Start at the requested state, or the first state if none was given.
3. For each instruction: set/infer values into `{{variables}}`; ask the user
   when it says to and capture the answer; run commands, read/create/edit files,
   deploy, health-check, notify, or roll back as it says, noting each outcome.
4. Follow `[T](#anchor)` links for branches, loops, retries, and recovery.
   Follow `[T](path.md)` links by reading or executing that file in place, then
   returning.
5. Stop only at a terminal state, an explicit stop, or an unrecovered failure.

## Control Flow You Must Honor

- Confirm before risky actions. When a step says confirm/warn/ask before a
  destructive or sensitive action (deploying `main`, low coverage, overwrite),
  ask first. Proceed only if approved; if declined, stop or take the declined
  branch. Never skip the gate, and never skip the action after approval.
- Retry loops. When a step retries on failure (e.g. health-check up to N times),
  actually repeat it up to the limit, consuming results in order; each attempt
  is a real action.
- Failure recovery. When a command or validation fails and the workflow links to
  recovery, follow it and perform it fully: roll back, notify, return to the
  named state, and run that path to completion. Only with no recovery link do
  you stop and report the failure, its output, and the current state.

## Variables, Input, Source

Keep `{{variables}}` across the run; set derived values when told. If a required
value is missing and cannot be inferred safely, ask, then continue from the
current state.

Usually the workflow is given directly. Otherwise: a file path (a `#fragment` or
trailing heading/anchor/number/`line N` is the start state); or a fenced/pasted
block with `##` headings used as-is. Match a requested start state by heading
text, anchor slug, 1-based index, or line; if none match, list headings and ask.
If the header says to read the spec and the rules are unclear, read `spec.md`
first.

## Report Completion

Summarize what completed: files changed, commands run, validation results, the
branch you stopped on, and any skipped optional branches.
