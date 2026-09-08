---
name: mdscript-exec
description: >-
  Execute MDScript Markdown workflows. Use when the user invokes
  /mdscript-exec, asks to run an MDScript file or inline MDScript string, asks
  to start from a specific heading or offset, or a file header requires the
  mdscript-exec skill.
---

# MDScript Executor

You ARE the executor: perform the workflow's actions yourself with your own
tools, one action at a time. There is no separate mdscript-exec tool to call.
Do not interpret this SKILL.md as MDScript; these are instructions for executing
other Markdown workflow files or inline workflow strings that use MDScript syntax.

## Inputs

Accept any of these forms:

- `/mdscript-exec path/to/workflow.md`
- `/mdscript-exec path/to/workflow.md#heading-anchor`
- `/mdscript-exec path/to/workflow.md "Heading Name"`
- `/mdscript-exec path/to/workflow.md ## Heading Name`
- `/mdscript-exec` followed by a fenced or pasted MDScript string
- natural language that names a workflow file and, optionally, a heading to
  start from

Treat "header offset", "heading offset", "start heading", and "start state" as
the requested start state. A start state may be a literal heading, a heading
with leading `##`, a Markdown anchor slug, a 1-based state number, or an
explicit line reference such as `line 42`.

## Resolve The Workflow Source

First decide whether the workflow source is a file or an inline string.

- If the input includes an existing Markdown file path, use that file.
- If the path contains a `#fragment`, strip the fragment from the file path and
  use the fragment as the requested start state.
- If a file path is followed by remaining text that looks like a heading,
  anchor, state number, or line reference, use that remaining text as the
  requested start state.
- If no path is present but the input contains a fenced code block or pasted
  text with an MDScript execution header or one or more `##` headings, treat
  that text as the complete workflow content. Preserve the inline workflow text
  exactly; do not save it to a file unless the workflow itself asks you to.
- If both a path and an inline workflow string are present and the intended
  source is unclear, ask which source to execute.
- If there is no usable path or inline workflow string, ask for the workflow
  file path or MDScript text.

For inline workflows, any surrounding user text outside the fenced or pasted
MDScript may name the requested start state.

## Load The Workflow

Read the workflow content from the resolved file or inline string.

If the workflow header says to use `mdscript-exec` or read the MDScript spec,
and the MDScript rules are not already clear in this session, read the linked
spec (`spec.md`) before executing the workflow.

## Parse States

Ignore YAML frontmatter, the execution header comment, and prose before the
first `##` heading.

Treat each `##` heading as a state. The state body continues until the next
`##` heading or end of file. Treat bullets under a state as executable
instructions. Record each state's heading text, 1-based state index, and source
line number.

Compute a Markdown anchor slug for each state heading using the normal
lowercase, hyphenated heading text convention.

If the user requested a start state, first note whether the selector explicitly
says `line` or `offset`. Then normalize the selector by trimming whitespace,
quotes, optional leading `#` characters, and optional leading words such as
`heading`, `header`, `state`, `line`, or `offset`. Match it against:

- the literal heading text
- the heading text with leading `##` stripped
- the Markdown anchor slug
- the 1-based state index, when the normalized selector is numeric and was not
  explicitly labeled as a line or offset
- the state containing the requested source line, when the selector was
  explicitly labeled as a line or offset

If there is no match, list the available headings and ask for a valid starting
heading instead of silently starting at the top.

When no start heading is requested, begin at the first state.

## Execute States

Execute each instruction in the current state in order. Maintain state for
MDScript variables such as `{{service_name}}` across the workflow.

Perform actions directly with available tools. Do not narrate that an action
would be performed. If an instruction says to infer, ask, read, create, edit,
run, verify, notify, or report something, do that action.

Follow Markdown links to state anchors when the surrounding condition applies.
Use those links for branches, retries, and loops. Follow Markdown links to other
files by reading or executing the linked file according to the instruction text.

If a required value is missing and cannot be inferred safely, ask the user for
that value and continue from the current state.

If a command or validation step fails and the workflow gives a linked recovery
state, follow that recovery link. If no recovery is specified, stop and report
the failed command or validation, the relevant output, and the current state.

When the current state completes without a branch, continue to the next state in
file order. Stop when there are no more states.

## Report Completion

At the end, summarize the workflow completed, files changed, commands run, and
validation results. Mention any skipped optional branches or unresolved
follow-ups.
