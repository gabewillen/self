---
name: mdscript-write
description: >-
  Write Agent Skills whose SKILL.md body is executable MDScript. Use when the
  user invokes /mdscript-write, asks to create an mdscript skill, or wants a
  repeatable agent workflow with cross-agent heading entry points.
---

# MDScript Skill Writer

You ARE the author: create the skill files yourself with your tools; do not
delegate the authoring to another tool or agent. Use this skill to write MDScript
workflows and MDScript-backed Agent Skills. Do not interpret this SKILL.md as
MDScript; these are authoring instructions for producing files that use MDScript
syntax.

Author for the executor. Generated workflows are run by `mdscript-exec`, often on
a small or local model executing one tool call per step. Two design choices
decide whether that execution succeeds, so they are not optional:

- Write each step as ONE discrete, tool-executable action (run, read, create,
  edit, ask, confirm, deploy, verify, notify, roll back), never a paragraph that
  bundles several actions or merely narrates intent.
- Make every failure, retry, and recovery path an EXPLICIT `[State](#anchor)`
  link. Executors reliably skip branches that are only implied in prose; an
  unwritten recovery branch will not be run.

## Understand The Request

Treat the user's request after `/mdscript-write` as the skill purpose. If the
purpose is missing, ask what the generated skill or workflow should accomplish.

Infer:

- `skill_name`: lowercase hyphenated name, at most 64 characters
- `skill_description`: third-person description of what the skill does and when
  to use it
- `input_variable`: the primary value the workflow reads from user input
- `workflow_states`: ordered `##` state headings needed to accomplish the
  workflow

If the name is ambiguous or collides with an existing skill, propose two or
three concrete names and ask the user to choose.

## Choose The Output Location

Use an explicit location if the user provides one. Otherwise write the skill to
`~/.agents/skills/<skill_name>/`. This is the only default; do not ask the user
to choose personal or project scope, and do not select an agent-specific skills
directory.

## Design The MDScript Workflow

Draft concise states using MDScript conventions:

- Use `##` headings as sequential states and stable `mdscript-exec` entry
  points.
- Use `{{variables}}` for inferred, remembered, or input-derived values.
- Use `[State Title](#state-title)` links for branches, loops, and retries.
- Use file links for external scripts or templates, such as
  `[Template](templates/service.template.md)`.
- Use natural language instructions only; do not invent formal syntax beyond
  headings, variables, and links.

Treat headings as public cross-agent communication targets. Another agent can
be told to continue the workflow with `/mdscript-exec path/to/SKILL.md#heading`.
Make headings durable, descriptive, and unique enough to be referenced from
another thread or handoff.

For any state that asks the user for input, confirmation, or a decision, make the
resume target and answer binding obvious. `mdscript-exec` writes a return
MDScript before prompting and ends the prompt with
`mdscript-exec <return-script-path>`. The return script carries variables and
context forward, usually resuming at the current state. Use an explicit
`[State](#anchor)` link when the answer should resume somewhere else.
Write prompt instructions so the requested variable or decision is explicit; the
executor needs that name when it creates the return script.

Include guard states where they reduce ambiguity or risk: missing input,
confirm-before-destructive-action, validation failures, retry loops, and
recovery branches.

Target fewer than 200 lines for every generated MDScript, including `SKILL.md`
and linked sub-scripts. When a file approaches 200 lines, split focused states
into linked MDScripts so the executor loads context naturally as it follows the
workflow. Move examples, rationale, and reference material to linked reference
files instead of spending the workflow's line budget on background prose.

Treat 500 lines as an exceptional hard ceiling, not a normal target. Do not add
an `ALWAYS READ THE ENTIRE FILE` comment as a substitute for decomposition; use
such a directive only when the selected executor explicitly supports it and the
workflow truly depends on whole-file context.

Before writing files, show the user a brief outline of proposed states and key
variables when the design is non-trivial. Apply requested changes before
writing.

## Decompose Reusable Steps

Extract a step into its own MDScript file and link to it when the step is reused
by more than one workflow, is useful to run on its own, or is large enough to
crowd the parent. Keep a step inline when it runs once and only here. A linked
file is read and executed in place, so decomposition costs no extra syntax: the
link is the call, and the same link stays click-navigable for a human browsing
the repository.

Aim for a few focused, sub-200-line scripts rather than one long file or a swarm
of tiny ones. Give each sub-script durable headings so it can serve as an
`mdscript-exec` entry point too, and let parents share a sub-script instead of
duplicating its steps.

## Write The Skill Files

Create the selected skill directory and write `SKILL.md` with valid YAML
frontmatter followed by an MDScript body. Generated MDScript skills should use
this shape:

```markdown
---
name: {{skill_name}}
description: {{skill_description}}
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup

* if `{{input_variable}}` is empty
  * ask the user for `{{input_variable}}`
* set `{{derived_value}}` to a value computed from `{{input_variable}}`

## Run Checks

* run `the validation command`
  * if it fails, fix the issue and [Run Checks](#run-checks)

## Apply Change

* confirm with the user before the destructive step
  * if declined, stop and report why
* make the change
* verify the result
  * if verification fails, undo the change, notify the user, and
    [Setup](#setup)
```

Use clean `## Heading` states (the heading text IS the state name and the
`mdscript-exec` entry point). Do not invent `## State:` prefixes, a `## variables`
block, or any structure beyond headings, `{{variables}}`, and links. One concrete
action per bullet. Every failure path ends in an explicit `[State](#anchor)` link
or an explicit stop, never an implied "otherwise".

Use the GitHub raw `spec.md` link in the execution header for publishable skills
so the workflow still works when copied into another repo or personal skill folder.

If the workflow needs templates, examples, or helper scripts, create them under
the generated skill directory and link to them from the MDScript body.

## Validate The Output

Confirm the generated skill has:

- valid YAML frontmatter with `name` and `description`
- the MDScript execution header requiring `mdscript-exec` or reading the
  MDScript spec
- clean `## Heading` states only, no `## State:` prefixes or a `## variables`
  block or any invented syntax beyond headings, variables, and links
- `##` states that match the approved outline
- durable heading names that can be used as `mdscript-exec` entry points
- prompt-heavy states name the variable or decision being requested clearly
  enough for a return script to carry the answer forward; use an explicit
  `[State](#anchor)` link when the answer should resume outside the current
  state
- one discrete, tool-executable action per bullet, not bundled or narrated
- every failure, retry, and recovery path written as an explicit
  `[State](#anchor)` link (or an explicit stop), never only implied in prose
- every MDScript targets fewer than 200 lines, with crowded states extracted
  into directly linked sub-scripts before relying on the 500-line hard ceiling
- reusable or shared steps extracted into linked sub-scripts rather than duplicated

Tell the user the generated skill path, normal invocation form, heading-entry
form, and any supporting files created.

## Reference

For MDScript syntax, control flow, publishing notes, and examples, read
[reference.md](reference.md) when details are needed.
