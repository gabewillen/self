# MDScript Reference for Skill Authors

## Skill file anatomy

```markdown
---
name: my-workflow
description: Third-person WHAT and WHEN. Include trigger terms and /my-workflow.
disable-model-invocation: true
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup

* if `{{target}}` is empty
  * infer `{{target}}` from the input

## Execute

* perform the work using available tools

* if validation fails
  * [Execute](#execute)
```

## Core elements

| Element | Syntax | Role |
|---------|--------|------|
| State | `## Title` | One workflow step, fallthrough target, and `mdscript-exec` entry point |
| Variable | `{{name}}` | Created on first mention; no declarations |
| Branch/loop | `[Title](#title)` | Redirect flow to another state |
| External call | `[Label](path/to/file.md)` | Run or read another MDScript or template |
| Execution header | `<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](url) -->` | Points agent at the executor skill or execution spec |

## Control flow patterns

**Cross-agent entry point**

```markdown
Tell another agent to continue this workflow at a specific heading:

`/mdscript-exec .agents/skills/deploy-staging/SKILL.md#verify-deployment`
```

**Prompt return script**

When `mdscript-exec` asks the user for input during execution, it first writes a
return MDScript that carries variables, the pending question, and the resume
heading. The prompt must end with the executable return command:

```text
mdscript-exec .mdscript/returns/setup-name-20260625T170000.md
```

Usually the return script resumes at the current state. If the answer should
resume somewhere else, make that target explicit with a `[State](#anchor)` link.
In tool-using environments, the executor writes the return script before calling
the ask or confirmation tool, and includes the command as the last line of the
question or confirmation text.

**Infer from input**

```markdown
* if `{{service_name}}` is empty
  * infer `{{service_name}}` from the input
```

**Set derived values**

```markdown
* set `{{service_path}}` to `services/{{service_name}}`
```

**Branch**

```markdown
* if `{{service_path}}` already exists
  * ask the user for a different name
    * [Setup Name](#setup-name)
```

**Retry loop**

```markdown
* run `npm test`
  * if tests fail, fix issues and [Verify](#verify)
```

**External script**

```markdown
* create the service using [Create Service](examples/create-service.md)
```

## Agent Skill metadata

| Field | Rules |
|-------|-------|
| `name` | Lowercase, hyphens, ≤64 chars; matches `/name` invocation |
| `description` | Third person; WHAT + WHEN; ≤1024 chars; discovery keywords |

## Publishing with the skills CLI

Place installable skills at `skills/<name>/SKILL.md` in a GitHub repo, then:

```bash
npx skills add owner/repo --skill <name>
npx skills add owner/repo --skill <name> -g
```

## Line budget

Target fewer than 200 lines per MDScript. Split a file that approaches that
budget into a few focused, directly linked MDScripts so the executor acquires
context as it follows the workflow. Put examples, rationale, and background
material in linked reference files. The 500-line limit is an exceptional hard
ceiling, not an authoring target, and an `ALWAYS READ THE ENTIRE FILE` comment
does not replace decomposition unless the selected executor explicitly defines
that directive and the workflow truly depends on whole-file context.

## Anti-patterns

- Narrating instead of executing (saying "I would create the file" instead of creating it)
- Bundling several actions into one step instead of one discrete action per bullet
- Prose-only branching without anchor links, or implied recovery paths never written as `[State](#anchor)` links
- Inventing structure such as `## State:` heading prefixes or a `## variables` block instead of plain `## Heading` states with inline `{{variables}}`
- Declaring variables in a separate block
- Delegating the authoring to another tool or agent instead of writing the files yourself
- MDScripts approaching 200 lines without extracting focused linked states
- Treating the 500-line hard ceiling as the normal authoring budget
- Adding an `ALWAYS READ THE ENTIRE FILE` comment instead of decomposing a crowded workflow
- Duplicating a shared step across workflows instead of linking one sub-script
- Vague descriptions ("helps with workflows")
- First-person descriptions ("I can help you...")

## Repo examples

| File | Pattern |
|------|---------|
| `examples/generate-product.md` | Multi-state setup with external calls |
| `examples/runbook-incident.md` | Branching severity and escalation |
| `examples/refactor-function.md` | Complexity gate and retry on test failure |
| `examples/create-service.md` | Scaffold from template |
| `examples/deploy-branch.md` | Deployment verification loop |
