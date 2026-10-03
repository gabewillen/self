# MDScript review violations

This catalog gives the severity rules and circuit rules for `mdscript-review`.
Keep these rules in memory during the review.

## Circuit rules

| Condition | Result |
| --- | --- |
| A **P0** finding that is not waived, after a gate | Open the circuit. Stop the gates that follow. |
| A **`LEN-*`** finding (line-count rule) that is not waived | Open the circuit. Stop the gates that follow. The verdict is always `fail`. |
| The count of **P1** findings that are not waived is equal to or more than `{{p1_trip_threshold}}` (default `5`) | Open the circuit. Stop the gates that follow. |
| Only **P2** findings, or fewer **P1** findings than the threshold | Keep the circuit closed. Do the full-mode gates that follow. |

Waivers: accept only the rule ids that the user waived for this review. Record
the waived findings, but do not count them for a trip.

## Severity

| Level | Meaning |
| --- | --- |
| **P0** | Breaks the reliability of the executor or the MDScript contract. Stop at once. |
| **P1** | Can cause an incorrect execution, or is an authoring anti-pattern. Adds to the trip count. |
| **P2** | A style or maintenance problem. Cannot cause a trip alone. |

## Rule catalog

### Structure (`structure` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `HDR-001` | P0 | The `<!-- mdscript: use the mdscript-exec skill or read ... -->` execution header is not there | Add the standard execution header near the top |
| `STR-001` | P0 | The file uses new structure, such as `## State:` prefixes or a `## variables` block | Use plain `## Heading` states. Write `{{vars}}` in the instructions. |
| `STR-002` | P0 | An MDScript file has no `##` state headings | Add sequential `##` states with executable bullets |
| `FM-001` | P0 | The YAML frontmatter of `SKILL.md` has no `name` or no `description` | Add correct skill frontmatter before the execution header |
| `STR-003` | P1 | The body has only text before the first state, and no executable states after it | Change the workflow steps into `##` states |

### Actions (`actions` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `ACT-001` | P1 | One bullet has many tool actions (run, edit, and examine) | Write one executable action in each bullet |
| `ACT-002` | P1 | A bullet describes an intention ("would create", "should verify") and does not give a command | Write the bullet as an executable command |
| `ACT-003` | P2 | A bullet only gives the reason for a rule | Move the reason to a linked reference file |

### Branches (`branches` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `BR-001` | P0 | A failure, retry, or recovery condition has no explicit `[State](#anchor)` and no stop | Add a recovery link or an explicit stop |
| `BR-002` | P1 | A condition branch sends the flow to a different target, but the state continues after it | Stop after the link, or link to the correct next state |
| `BR-003` | P1 | The text gives a retry but has no back-link to the state for the retry | Add a `[State](#anchor)` link to the retry target |

### Links (`links` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `LNK-001` | P0 | A `[Title](#anchor)` link in the file is not the slug of a `##` heading | Correct the anchor or the heading text |
| `LNK-002` | P0 | The target of a relative file link does not exist | Create the target or correct the path |
| `LNK-003` | P1 | A linked executable file has no `##` entry heading | Add a durable entry heading in the linked file |

### Variables (`variables` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `VAR-001` | P0 | A `{{var}}` is part of a path, command, or entry string, but no state sets it and no text tells that the caller gives it | Set the variable in an earlier state, or write that the caller must give it |
| `VAR-002` | P1 | A condition reads a variable before a step sets, finds, or asks for it | Add an earlier step that sets the variable |
| `VAR-003` | P2 | A public entry skill has a variable name that is not clear (`{{data}}`, `{{thing}}`) | Change it to a durable and clear name |

### Line budget (`line-budget` gate)

Line counts are **mandatory** and you must **measure** them. Use `wc -l` or an
equivalent exact line count on each MDScript workflow in the review. Do not
estimate. Linked decomposition is not a waiver for a file that is still above
the limit. Each file, including sub-scripts, must be below the soft limit.

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `LEN-001` | P0 | The MDScript file has 500 lines or more (hard limit) | Divide the file into linked sub-scripts until each file has fewer than 200 lines |
| `LEN-002` | P0 | The MDScript file has 200 lines or more (soft limit, which blocks) | Move focused states into linked MDScripts until this file has fewer than 200 lines |
| `LEN-003` | P0 | The file uses `ALWAYS READ THE ENTIRE FILE` as an alternative to decomposition | Remove the directive. Divide the workflow. |
| `LEN-004` | P0 | The reviewer did not measure an MDScript file with an exact line count | Do the gate again, and run `wc -l` on each MDScript path |

Limits (defaults; change them only if the user sets them for the review):

| Limit | Default | Severity if the file is above the limit |
| --- | ---: | --- |
| Soft | `{{soft_line_limit}}` = `200` | P0 `LEN-002` |
| Hard | `{{hard_line_limit}}` = `500` | P0 `LEN-001` |

Each `LEN-*` finding that is not waived causes a `fail` verdict and trips the
circuit.

### Prompts (`prompts` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `PRM-001` | P0 | A state asks the user for input but does not give the variable or decision for the answer | Give the `{{variable}}` or the decision name |
| `PRM-002` | P1 | The answer continues at a different state, but the ask or confirmation does not give that resume target | Add an explicit `[State](#anchor)` resume target |
| `PRM-003` | P1 | The file gives its own prompt sequence, but does not write a return script before the prompt or does not end with `mdscript-exec <path>` | Write the return script before the prompt. Usual workflows can use `mdscript-exec` and do not give these rules again. |

### Language (`language` gate)

All MDScript text must be ASD-STE100 Simplified Technical English (STE). These
rules apply to instructions, prompts, descriptions, and other text. They do not
apply to `{{variables}}`, link targets, code spans, code blocks, file paths,
commands, or YAML keys. Count each of these items as one word.

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `STE-001` | P1 | An instruction sentence has more than 20 words, or a descriptive sentence has more than 25 words | Divide the sentence, or move part of it into a nested bullet |
| `STE-002` | P1 | The text uses a word from the "Do not use" column below | Use the STE replacement |
| `STE-003` | P1 | An instruction uses the passive voice ("the file should be updated") | Write the instruction as an active command ("change the file") |
| `STE-004` | P2 | The text uses the `-ing` form of a verb that is not part of a technical name | Use a simple tense or a different structure |
| `STE-005` | P2 | A noun cluster has more than three nouns | Divide the cluster with `of`, `for`, or a relative clause |
| `STE-006` | P2 | The text uses a contraction (`don't`, `it's`) | Write the full words |
| `STE-007` | P2 | An instruction gives the action before the condition ("do Y if X") | Put the condition first ("if X, do Y") |
| `STE-008` | P2 | A paragraph has more than six sentences | Divide the paragraph, or move text to a reference file |

STE replacements:

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

Technical names (`state`, `circuit`, `gate`, `return script`) and technical
verbs for computer processes (`run`, `commit`, `deploy`, `parse`, `append`) are
permitted. The official ASD-STE100 dictionary is the authority for approved
words and meanings.

## Finding shape

Record each finding in this shape:

```text
rule_id | severity | file | line_or_heading | evidence | fix_hint
```

Append each finding to `{{findings}}`. Do not remove a P0 finding.
