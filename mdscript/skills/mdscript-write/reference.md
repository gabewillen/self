# MDScript Reference for Skill Authors

## Skill file anatomy

```markdown
---
name: my-workflow
description: Does the task X. Use this skill when the user types /my-workflow or asks for X.
disable-model-invocation: true
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Get Input

* if `{{target}}` is empty
  * find `{{target}}` in the input

## Do The Work

* run `the work command`
* if the check fails
  * [Do The Work](#do-the-work)
```

## Core elements

| Element | Syntax | Function |
|---------|--------|----------|
| State | `## Title` | One workflow step, a fallthrough target, and an `mdscript-exec` entry point |
| Variable | `{{name}}` | Exists from its first mention. Do not declare it. |
| Branch or loop | `[Title](#title)` | Sends the flow to a different state |
| External call | `[Label](path/to/file.md)` | Runs or reads a different MDScript or template |
| Execution header | `<!-- mdscript: use the mdscript-exec skill or read [spec.md](url) -->` | Tells the agent to use the executor skill or the execution spec |

## Write In ASD-STE100

Write all MDScript text in ASD-STE100 Simplified Technical English (STE). This
includes instructions, prompts, descriptions, YAML `description` values, and
return scripts. The STE rules do not apply to `{{variables}}`, link targets,
code spans, code blocks, file paths, commands, or YAML keys. Count each of these
items as one word.

| Rule | What to do |
| --- | --- |
| Vocabulary | Use only STE approved words with their approved meanings. Technical names and technical verbs for computer processes are permitted. |
| One meaning | Use one word for one meaning. Use the same word for the same thing. |
| Procedural length | Write 20 words or fewer in each instruction sentence. |
| Descriptive length | Write 25 words or fewer in each descriptive sentence. Write six sentences or fewer in each paragraph. |
| One instruction | Write one instruction in each sentence and one action in each bullet. |
| Command form | Write each instruction as a command. |
| Active voice | Use the active voice in instructions. |
| Condition first | Put the condition before the action: "If X, do Y." |
| Simple tenses | Use the simple present, simple past, and future tenses. Do not use the `-ing` form of a verb, except in a technical name. |
| Noun clusters | Do not use more than three nouns in a noun cluster. |
| Articles | Use `a`, `an`, `the`, `this`, or `these` before a noun where possible. |
| Contractions | Do not use contractions. |
| Warnings | Start a warning or a caution with a short command. |

Common replacements:

| Do not use | Use |
| --- | --- |
| perform, execute (as a general verb) | do |
| ensure, verify, confirm (as "check") | make sure, examine |
| infer, determine | find |
| obtain, retrieve | get |
| provide, supply (as "give") | give |
| require | must, is necessary |
| utilize | use |
| proceed | continue, go |
| attempt | try |
| modify, update (as "change") | change |
| additional | more |
| prior to, subsequent to | before, after |
| terminate, abort | stop |
| sufficient, adequate | enough |
| approximately | about |
| assist | help |
| should | must, or a command |

Examples:

| Not STE | STE |
| --- | --- |
| `* infer {{service_name}} from the input` | `* find {{service_name}} in the input` |
| `* ensure tests are passing before proceeding` | `* run the tests` and `* if a test fails, go to [Fix Tests](#fix-tests)` |
| `* the config file should be updated` | `* change the config file` |
| `* if it doesn't exist, create it` | `* if the file does not exist, create it` |

The official ASD-STE100 dictionary is the authority for approved words and
meanings.

## Control flow patterns

**Cross-agent entry point**

```markdown
Tell a different agent to continue this workflow at a specific heading:

`/mdscript-exec .agents/skills/deploy-staging/SKILL.md#verify-deployment`
```

**Prompt return script**

Before `mdscript-exec` asks the user for input, it writes a return MDScript. The
return script keeps the variables, the open question, and the resume heading.
The prompt must end with the executable return command:

```text
mdscript-exec .mdscript/returns/setup-name-20260625T170000.md
```

Usually, the return script continues at the current state. If the answer must
continue at a different state, write an explicit `[State](#anchor)` link. If the
executor has tools, it writes the return script before it calls the ask tool or
the confirmation tool. The command is the last line of the question text.

**Find a value in the input**

```markdown
* if `{{service_name}}` is empty
  * find `{{service_name}}` in the input
```

**Set a derived value**

```markdown
* set `{{service_path}}` to `services/{{service_name}}`
```

**Branch**

```markdown
* if `{{service_path}}` already exists
  * ask the user for a different `{{service_name}}`
    * [Setup Name](#setup-name)
```

**Retry loop**

```markdown
* run `npm test`
* if a test fails
  * correct the problem
  * [Verify](#verify)
```

**External script**

```markdown
* create the service with [Create Service](examples/create-service.md)
```

## Agent Skill metadata

| Field | Rules |
|-------|-------|
| `name` | Lowercase letters and hyphens, 64 characters or fewer. It is the same as the `/name` command. |
| `description` | Third person and STE. Tells what the skill does and when to use it. 1024 characters or fewer. Contains search keywords. |

## Publish with the skills CLI

Put each skill that users can install at `skills/<name>/SKILL.md` in a GitHub
repository. Then use these commands:

```bash
npx skills add owner/repo --skill <name>
npx skills add owner/repo --skill <name> -g
```

## Line budget

Keep each MDScript to fewer than 200 lines. If a file gets near that limit,
divide it into a small number of focused, directly linked MDScripts. Then the
executor gets the context when it follows the workflow. Put examples, reasons,
and background text in linked reference files.

The limit of 500 lines is an exceptional hard limit, not a target. Do not use an
`ALWAYS READ THE ENTIRE FILE` comment as an alternative to decomposition. Use it
only if the executor supports it and the workflow cannot work without the full
file.

## Anti-patterns

Do not write MDScript with these problems:

- A step that describes an action ("I would create the file") and does not do it
- A step with many actions in it
- A branch in text only, without an anchor link
- A recovery path that is implied and not written as a `[State](#anchor)` link
- New structure, such as `## State:` prefixes or a `## variables` block
- Variable declarations in a separate block
- An authoring task that you give to a different tool or agent
- An MDScript near 200 lines that has no linked sub-scripts
- Use of the 500-line hard limit as the usual budget
- An `ALWAYS READ THE ENTIRE FILE` comment as an alternative to decomposition
- A shared step that you copy into many workflows and do not link
- Text that is not STE: long sentences, unapproved words, passive instructions,
  `-ing` verb forms, or contractions
- A description that is not clear ("helps with workflows")
- A description in the first person ("I can help you...")

## Repository examples

| File | Pattern |
|------|---------|
| `examples/generate-product.md` | Setup in many states, with external calls |
| `examples/runbook-incident.md` | Branches for severity and escalation |
| `examples/refactor-function.md` | Complexity gate and a retry when a test fails |
| `examples/create-service.md` | New service from a template |
| `examples/deploy-branch.md` | Deployment check loop |
