# MDScript review violations

Severity and circuit rules for `mdscript-review`. Hold these while reviewing.

## Circuit rules

| Condition | Effect |
| --- | --- |
| Any unwaived **P0** finding after a gate | Open circuit; stop remaining gates |
| Any unwaived **`LEN-*`** finding (line-count rules) | Open circuit; stop remaining gates; verdict is always `fail` |
| Unwaived **P1** count ≥ `{{p1_trip_threshold}}` (default `5`) | Open circuit; stop remaining gates |
| Only **P2** or residual **P1** below threshold | Keep circuit closed; finish remaining full-mode gates |

Waivers: only honor rule ids the user explicitly waived for this run. Record waived findings but do not count them toward trip.

## Severity

| Level | Meaning |
| --- | --- |
| **P0** | Breaks executor reliability or the MDScript contract; fail-fast |
| **P1** | Likely mis-execution or authoring anti-pattern; accumulates toward trip |
| **P2** | Style or maintainability nit; never trips alone |

## Rule catalog

### Structure (`structure` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `HDR-001` | P0 | Missing `<!-- mdscript: use the mdscript-exec skill or read ... -->` execution header | Add the standard execution header near the top |
| `STR-001` | P0 | Uses invented structure such as `## State:` prefixes or a `## variables` declaration block | Use plain `## Heading` states; introduce `{{vars}}` inline |
| `STR-002` | P0 | No `##` state headings in a file presented as MDScript | Add sequential `##` states with executable bullets |
| `FM-001` | P0 | `SKILL.md` lacks YAML frontmatter `name` and `description` | Add valid skill frontmatter before the execution header |
| `STR-003` | P1 | Prose-only body before first state with no executable states after | Convert workflow steps into `##` states |

### Actions (`actions` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `ACT-001` | P1 | One bullet bundles multiple discrete tool actions (run + edit + verify) | Split into one executable action per bullet |
| `ACT-002` | P1 | Bullet narrates intent ("would create", "should verify") instead of commanding an action | Rewrite as an imperative executable instruction |
| `ACT-003` | P2 | Bullet is pure rationale explaining why a rule exists | Move rationale to a linked reference file |

### Branches (`branches` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `BR-001` | P0 | Failure, retry, or recovery condition has no explicit `[State](#anchor)` and does not stop | Add a recovery link or an explicit stop |
| `BR-002` | P1 | Conditional branch falls through ambiguously after routing or dispatch | Terminate after route, or link to the next intended state |
| `BR-003` | P1 | Retry described in prose without a back-link to the state to re-enter | Add `[State](#anchor)` for the retry target |

### Links (`links` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `LNK-001` | P0 | In-file `[Title](#anchor)` does not match any `##` heading slug | Fix the anchor or the heading text |
| `LNK-002` | P0 | Relative file link target does not exist | Create the target or correct the path |
| `LNK-003` | P1 | External file link exists but has no `##` entry heading when treated as executable | Add a durable entry heading in the linked file |

### Variables (`variables` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `VAR-001` | P0 | `{{var}}` builds a path, command, or re-entry string and no state sets it and no caller is documented as supplying it | Set the variable in an earlier state or document required caller input |
| `VAR-002` | P1 | Variable is read in a condition before any set/infer/ask step in the workflow | Add an earlier setup step for that variable |
| `VAR-003` | P2 | Variable name is vague (`{{data}}`, `{{thing}}`) in a public entry skill | Rename to a durable, descriptive identifier |

### Line budget (`line-budget` gate)

Line counts are **mandatory and measured**. Every MDScript workflow under review must be counted with `wc -l` (or an equivalent exact line count). Do not estimate. Do not treat linked decomposition as a waiver for a file that is still over the limit — each file, including sub-scripts, must stay under the soft limit.

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `LEN-001` | P0 | MDScript file is ≥ 500 lines (hard ceiling) | Split into linked sub-scripts immediately until every file is under 200 |
| `LEN-002` | P0 | MDScript file is ≥ 200 lines (soft authoring limit; blocking) | Extract focused states into linked MDScripts so this file is under 200 lines |
| `LEN-003` | P0 | Uses `ALWAYS READ THE ENTIRE FILE` instead of decomposing | Remove the directive; split the workflow |
| `LEN-004` | P0 | Reviewer failed to measure an MDScript file with an exact line count | Re-run the gate and `wc -l` every MDScript path |

Limits (defaults; override only when the user sets them for the run):

| Limit | Default | Severity when exceeded |
| --- | ---: | --- |
| Soft | `{{soft_line_limit}}` = `200` | P0 `LEN-002` |
| Hard | `{{hard_line_limit}}` = `500` | P0 `LEN-001` |

Any unwaived `LEN-*` finding fails the review and trips the circuit.

### Prompts (`prompts` gate)

| Id | Severity | Detect | Fix |
| --- | --- | --- | --- |
| `PRM-001` | P0 | State asks the user for input but does not name the variable or decision to bind | Name `{{variable}}` or the decision explicitly |
| `PRM-002` | P1 | Ask/confirm state never indicates resume target when resume is not the current state | Add an explicit `[State](#anchor)` resume target |
| `PRM-003` | P1 | File reimplements ask/prompt sequencing without requiring a return script before the ask and a final `mdscript-exec <path>` line | Require return-script-first prompting; ordinary workflows may rely on `mdscript-exec` without restating this |

## Finding shape

Record each finding as:

```text
rule_id | severity | file | line_or_heading | evidence | fix_hint
```

Append to `{{findings}}`. Never silently drop a P0.
