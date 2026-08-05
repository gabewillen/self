# Neutral packet assembly policy

Hold these rules while building the neutral review packet.

## Supporting material

Include only neutral supporting code paths, contracts, schemas, tests, docs, artifacts, routes, or ownership surfaces needed to understand the diff.

Include the current task file, relevant unresolved comments, and lane ledger entries as neutral source material.

Do not use a previous reviewer verdict as the frame for a fresh blind review.

Do not use the author's preferred verdict, intended fix narrative, curated explanation, or another reviewer's findings as the initial frame unless explicitly reconciling visible disagreement.

## Review cycle types

| Situation | Treatment |
| --- | --- |
| Initial review | cumulative |
| Each repair review | rolling delta from the last completed review snapshot |
| Terminal readiness gate | one fresh cumulative blind review |

## Recursive severity (code only)

| Round | Blocking severities |
| --- | --- |
| Round 1 | every finding |
| Round 2 | only P1 and P2 |
| Round 3 and later | only P1 |

Report every finding with an explicit severity even when it falls below `{{blocking_severities}}`.

Preserve below-threshold findings as `{{residual_findings}}` without requesting another pass.

Apply the recursive rolling-review cycle only when code changed.

## Non-code changes

For MDScript, instruction, documentation, plan, task, comment, publication, or other non-code changes:

- run exactly one fresh review plus the applicable direct proof
- do not recurse after repairs

## Baseline persistence

Persist review baselines only under `{{project_home}}/artifacts/review-baselines/` (agent-home project root, never the product worktree).

Do not put review control state in the source repository.

## Findings reporting

Report every finding with an explicit severity even when it falls below the current blocking threshold.
