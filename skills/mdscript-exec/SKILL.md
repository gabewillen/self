---
name: mdscript-exec
description: >-
  Runs MDScript Markdown workflows. Use this skill when the user types
  /mdscript-exec or asks you to run an MDScript file or inline MDScript text.
  Also use it when the user asks to start at a heading or an offset. Also use
  it when the user answers an MDScript prompt that ends with a return-script
  command, or when a file header tells you to use the mdscript-exec skill.
---

# MDScript Executor

You are the executor. Use your tools to do the actions of the workflow. Do one
action at a time. There is no separate mdscript-exec tool to call. This SKILL.md
is not MDScript. It gives the instructions to run other Markdown workflow files
or inline workflow text that use MDScript syntax.

Write all return scripts, prompts, and reports in ASD-STE100 Simplified
Technical English (STE). The rules are in the `Language: ASD-STE100` section of
the MDScript `spec.md`.

## Critical Prompt Rule

Before you ask the user for input, a confirmation, or a decision, write a return
script. If you have tools, use only this sequence:

1. Use `write_file` to write a return script in `.mdscript/returns/`.
2. Use `ask_user` or `request_confirmation`. Put
   `mdscript-exec <return-script-path>` on the last line of the question text.

Do not call `ask_user` or `request_confirmation` before the return script
exists.

This prompt sequence is correct:

```text
write_file path=".mdscript/returns/deploy-branch-select-branch.md" content="..."
ask_user question="Which branch do you want to deploy?

mdscript-exec .mdscript/returns/deploy-branch-select-branch.md"
```

This prompt sequence is not correct:

```text
ask_user question="Which branch do you want to deploy?"
```

## Inputs

Accept these input forms:

- `/mdscript-exec path/to/workflow.md`
- `/mdscript-exec path/to/workflow.md#heading-anchor`
- `/mdscript-exec path/to/workflow.md "Heading Name"`
- `/mdscript-exec path/to/workflow.md ## Heading Name`
- `/mdscript-exec` with fenced or pasted MDScript text after it
- an answer to a prompt that has this last line:
  `mdscript-exec .mdscript/returns/<return-script>.md`
- a request that gives a workflow file path and, as an option, a start heading

The terms "header offset", "heading offset", "start heading", and "start state"
all mean the start state. A start state can be one of these:

- a literal heading
- a heading with a leading `##`
- a Markdown anchor slug
- a state number (the first state is 1)
- a line reference, for example `line 42`

## Find The Workflow Source

First, find if the workflow source is a file or inline text.

- If the input contains the path of a Markdown file that exists, use that file.
- If the path contains a `#fragment`, remove the fragment from the file path.
  Use the fragment as the start state.
- Text can follow the file path. If that text is a heading, an anchor, a state
  number, or a line reference, use it as the start state.
- If the user answers a prompt from an active MDScript workflow, do these steps:
  1. Run the return script from the `mdscript-exec <return-script>` line at the
     end of the prompt.
  2. Set the variable or decision that the return script gives to the answer
     of the user.
  3. Get the saved variables and the workflow context from the return script.
  4. Continue at the resume heading in the return script.
- If there is no path, examine the input for a fenced code block or pasted text.
  If that text has an MDScript execution header or `##` headings, use it as
  the full workflow. Keep the inline workflow text exactly as it is. Do not save
  it to a file if the workflow does not tell you to.
- If the input has a path and inline workflow text, and you cannot find which
  source to run, ask the user.
- If you cannot find a path or inline workflow text, ask the user for one of
  them.

For an inline workflow, the text outside the fenced or pasted MDScript can give
the start state.

## Load The Workflow

Read the workflow content from the file or from the inline text.

The workflow header can tell you to use `mdscript-exec` or to read the MDScript
spec. If you do not know the MDScript rules yet, read the linked `spec.md`
before you start.

## Parse States

Ignore the YAML frontmatter, the execution header comment, and all text before
the first `##` heading.

Each `##` heading is a state. The state body continues to the next `##` heading
or to the end of the file. Each bullet in a state is an instruction to execute.
For each state, record the heading text, the state number, and the source line
number.

Make a Markdown anchor slug for each state heading. Use the usual convention:
lowercase heading text with a hyphen between the words.

If the user gave a start state, do these steps:

1. Find if the selector contains the word `line` or `offset`.
2. Remove spaces, quotes, and leading `#` characters from the selector.
3. Remove leading words such as `heading`, `header`, `state`, `line`, or
   `offset`.
4. Compare the result with these values:
   - the literal heading text
   - the heading text without the leading `##`
   - the Markdown anchor slug
   - the state number, if the result is a number and step 1 did not find
     `line` or `offset`
   - the state that contains the source line, if step 1 found `line` or
     `offset`

If the selector does not identify a state, show the list of headings to the
user. Ask the user for a correct start heading. Do not start at the first state
as an alternative.

If the user did not give a start state, start at the first state.

## Execute States

Do each instruction in the current state in sequence. Keep the values of the
MDScript variables, for example `{{service_name}}`, through all of the workflow.

Use your tools to do each action. Do not only describe an action. If an
instruction tells you to find, ask, read, create, edit, run, examine, tell, or
record something, do that action.

If the condition before a state link is true, go to that state. Use these links
for branches, retries, and loops. If a link goes to a different file, read or
execute that file as the instruction tells you.

If a necessary value is not available and you cannot find it safely, ask the
user for it. Then continue at the current state.

Before you ask the user for input, a confirmation, or a decision, write a return
MDScript. Use a stable path in `.mdscript/returns/`, for example
`.mdscript/returns/<workflow>-<state>-<timestamp>.md`.

The return script must contain these items:

- the path of the source workflow file, or the inline workflow body or a summary
  of it if there is no file
- the exact `##` heading or anchor where execution continues after the answer
- the open question, and the variable or decision that the answer goes into
- all current `{{variables}}`, branch decisions, related files, and command
  results
- all other context that you must have to continue without a repeat of
  previous states

Use the current state heading as the resume heading. If the workflow gives a
different resume state, use that state. Do not write secrets into a return
script. Write a summary of each secret value.

The return script must be executable MDScript in STE. Use this shape:

```markdown
<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resume

* get the saved variables and context from this return script
* set `{{variable_or_decision}}` to the latest answer from the user
* execute [Resume Heading](path/to/workflow.md#resume-heading)
```

If you have tools, first use the file tool to write the return script. Then
call the ask tool or the confirmation tool. The text that you give to `ask_user`
or `request_confirmation` must end with `mdscript-exec <return-script-path>`.
Do not call `ask_user` or `request_confirmation` before you write the return
script.

Put this executable line at the end of the prompt to the user:

```text
mdscript-exec <return-script-path>
```

Do not write text after the `mdscript-exec <return-script-path>` line.

If a command or a check fails and the workflow gives a recovery state link, go
to that state. If the workflow gives no recovery state, stop. Then tell the user
the command or check that failed, the related output, and the current state.

When the current state is complete and has no branch, go to the next state in
the file. Stop when there are no more states.

## Give The Final Report

At the end, give a summary of the workflow, the changed files, the commands that
you ran, and the check results. Tell the user about the optional branches that
you did not do and about open follow-up tasks.
