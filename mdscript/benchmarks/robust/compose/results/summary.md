# Composition Benchmark Summary

Structure: two parents (ship_feature, hotfix) reuse two shared sub-components (checks, deploy).
Executor: claude-haiku; blind judge: claude-sonnet. Static metrics need no model.

## Metrics

| System | Wiring lines (static) | Click-navigable refs (static) | Compose correctness % | Blind judge |
| --- | ---: | ---: | ---: | ---: |
| mdscript | 0 | 4/4 (100.0%) | 95 | 8.75 |
| guidance | 8 | 0/4 (0.0%) | 90 | 9.25 |
| lmql | 8 | 0/4 (0.0%) | 100 | 8.5 |
| ell | 8 | 0/4 (0.0%) | 100 | 8.75 |

## Findings

- **Composition execution is a tie** (~90-100%): agents follow MDScript file-links and DSL imports equally well; misses were single-repeat flakiness, not structural.
- **Wiring cost:** MDScript composes a shared sub-script with **0** dedicated lines (the link is the instruction); the DSLs need **8** lines per format (imports + call sites across two parents).
- **Human-navigability (the bonus):** MDScript's cross-component references are **100%** click-navigable GitHub hyperlinks that resolve to real files; DSL imports are **0%**, not links in a code host. The same links an agent executes, a human clicks.
