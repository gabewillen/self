---
name: mdscript-write
description: >-
  Writes Agent Skills that have an executable MDScript body in SKILL.md. All the
  MDScript text that it writes is in ASD-STE100 Simplified Technical English.
  Use this skill when the user types /mdscript-write or asks for an MDScript
  skill. Also use it when the user wants a repeatable agent workflow with
  heading entry points for other agents.
---

# MDScript Skill Writer

You are the author. Use your tools to write the skill files. Do not give the
authoring task to a different tool or agent. Use this skill to write MDScript
workflows and Agent Skills that use MDScript. This SKILL.md is not MDScript. It
gives the instructions to write files that use MDScript syntax.

Write for the executor. The `mdscript-exec` skill runs the workflows that you
write. Frequently, a small or local model runs them with one tool call for each
step. These three design rules are mandatory:

- Write each step as ONE action that a tool can do, for example run, read,
  create, edit, ask, or deploy. Do not put many actions in one step. Do not
  write a step that only describes an intention.
- Write each failure, retry, and recovery path as an EXPLICIT `[State](#anchor)`
  link. Executors usually do not do a branch that the text only implies.
- Write all MDScript text in ASD-STE100 Simplified Technical English (STE).
  Short sentences with approved words decrease the errors of small models.

## Write In ASD-STE100

Write each instruction, prompt, description, and sentence of the MDScript in
STE. Use only approved words, the command form, and the active voice. Put the
condition first. Write one instruction in each sentence, with 20 words or fewer.
Do not use `-ing` verb forms or contractions. Before you write, read
[the STE rules in reference.md](reference.md#write-in-asd-ste100).

## Understand The Request

The text after `/mdscript-write` is the purpose of the skill. If there is no
purpose, ask the user what the skill or workflow must do.

Find these values:

- `skill_name`: a lowercase name with hyphens, 64 characters or fewer
- `skill_description`: a third-person STE description of what the skill does
  and when to use it
- `input_variable`: the primary value that the workflow gets from the user input
- `workflow_states`: the `##` state headings that the workflow must have, in
  sequence

If the name is not clear, or a skill with the same name exists, give the user
two or three possible names. Ask the user to select one.

## Select The Output Location

If the user gives a location, use it. If not, write the skill to
`~/.agents/skills/<skill_name>/`. This is the only default location. Do not ask
the user to select a personal or project scope. Do not select a skills directory
for one specific agent.

## Design The MDScript Workflow

Write short states with these MDScript conventions:

- Use `##` headings as sequential states and as stable `mdscript-exec` entry
  points.
- Use `{{variables}}` for values that you find, remember, or get from the input.
- Use `[State Title](#state-title)` links for branches, loops, and retries.
- Use file links for external scripts or templates, for example
  `[Template](templates/service.template.md)`.
- Use only STE instructions. Do not make new formal syntax. The only syntax is
  headings, variables, and links.

Headings are public targets for other agents. An agent can tell a different
agent to continue the workflow with `/mdscript-exec path/to/SKILL.md#heading`.
Make each heading durable, clear, and unique. Use STE approved words or
technical names in headings.

A state can ask the user for input, a confirmation, or a decision. In that
state, make the resume target and the variable for the answer clear. Before the
prompt, `mdscript-exec` writes a return MDScript. The prompt ends with
`mdscript-exec <return-script-path>`. The return script keeps the variables and
the context, and usually continues at the current state. If the answer must
continue at a different state, write an explicit `[State](#anchor)` link. Give
the name of the variable or decision in each prompt instruction.

Add guard states where they decrease risk or confusion. Examples are input that
is not there, confirmation before a step that deletes data, failed checks,
retry loops, and recovery branches.

Keep each MDScript that you write, including `SKILL.md` and linked sub-scripts,
to fewer than 200 lines. If a file gets near 200 lines, move focused states into
linked MDScripts. Move examples, reasons, and reference text to linked reference
files.

The limit of 500 lines is an exceptional hard limit, not a usual target. Do not
add an `ALWAYS READ THE ENTIRE FILE` comment as an alternative to decomposition.
Use that comment only if the executor supports it and the workflow cannot work
without the full file.

If the design is not simple, show the user a short outline of the states and
the key variables before you write the files. Make the changes that the user
asks for before you write the files.

## Decompose Reusable Steps

Move a step into a separate MDScript file and link to it in these conditions:

- More than one workflow uses the step.
- The step is useful as a workflow by itself.
- The step is so large that it fills too much of the parent file.

Keep a step in the parent file if only that workflow uses it one time. The
executor reads and executes a linked file at the location of the link. The link
is the call, and a human can also click the link to read the file.

Write a small number of focused sub-scripts. Keep each sub-script below 200
lines. Do not write one long file or many very small files. Give each sub-script
durable headings so that it is also an `mdscript-exec` entry point. If two
parent workflows use the same steps, link one shared sub-script. Do not copy
the steps.

## Write The Skill Files

Create the skill directory. Write `SKILL.md` with correct YAML frontmatter and
an MDScript body. Use this shape for an MDScript skill:

```markdown
---
name: {{skill_name}}
description: {{skill_description}}
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Get Input

* if `{{input_variable}}` is empty
  * ask the user for `{{input_variable}}`
* set `{{derived_value}}` to a value from `{{input_variable}}`

## Run Checks

* run `the validation command`
* if the command fails
  * correct the problem
  * [Run Checks](#run-checks)

## Make The Change

* ask the user for `{{change_approved}}` before the change
* if `{{change_approved}}` is `no`
  * tell the user that you did not make the change
  * stop
* make the change
* examine the result
* if the result is not correct
  * roll back the change
  * tell the user about the failure
  * [Get Input](#get-input)
```

Use clean `## Heading` states. The heading text is the state name and the
`mdscript-exec` entry point. Do not use `## State:` prefixes, a `## variables`
block, or other structure. Write one action in each bullet. End each failure
path with an explicit `[State](#anchor)` link or an explicit stop. Do not write
an implied "otherwise".

For a skill that you will publish, use the GitHub raw `spec.md` link in the
execution header. Then the workflow continues to work if a user copies it into
a different repository or skill folder.

Create templates, examples, and helper scripts in the skill directory. Link to
them from the MDScript body.

## Examine The Output

Make sure that the skill has these items:

- correct YAML frontmatter with `name` and an STE `description`
- the MDScript execution header that tells the agent to use `mdscript-exec` or
  to read the MDScript spec
- only clean `## Heading` states, with no new syntax
- `##` states that agree with the outline that the user approved
- durable headings that are correct `mdscript-exec` entry points
- prompt states that give the variable or decision for the answer
- one action that a tool can do in each bullet
- an explicit `[State](#anchor)` link or stop for each failure, retry, and
  recovery path
- fewer than 200 lines in each MDScript, and shared steps in linked sub-scripts
- STE text in each instruction, prompt, and description

Tell the user the path of the skill, the usual command to use it, the command
to start at a heading, and the supporting files that you created.

## Reference

For syntax, control flow, STE rules, and examples, read [reference.md](reference.md).
