# Jump-Point (Relay) Benchmark Summary

Workflow: deploy_branch. Pattern: multi-hop relay, where each hop is a worker agent dispatched to
resume the shared workflow at one state with injected variables. Executor: claude-haiku.

## The three metrics

| System | Scaffolding to be dispatchable (extra code lines) | Handoff correctness % (deterministic) | Readability w/ plumbing (blind panel) |
| --- | ---: | ---: | ---: |
| mdscript | +0 | 86 | 9.00 |
| guidance | +34 | 87.7 | 6.43 |
| lmql | +42 | 86 | 6.43 |
| ell | +35 | 87.7 | 7.29 |

## Readability: linear vs relay-enabled (blind gpt-5.5 panel, 7 judges, scrubbed)

| System | Linear (no jump points) | Relay-enabled (w/ dispatch plumbing) | Δ |
| --- | ---: | ---: | ---: |
| mdscript | 8.14 | 9.00 | +0.86 |
| guidance | 6.14 | 6.43 | +0.29 |
| lmql | 7.86 | 6.43 | -1.43 |
| ell | 7.86 | 7.29 | -0.57 |

## Key findings

- **Jump failures: 0.** Every format correctly entered at the requested state, did not re-run earlier states, and did not re-ask for injected variables. The delegation primitive works.
- **Handoff correctness is a statistical tie** (~86-88%); remaining check misses were symmetric executor output-formatting quirks, not jump failures. MDScript does not *execute* the relay better.
- **The differentiator is cost, not runtime.** MDScript needs **+0** lines to be dispatchable (headings are already entry points); the DSLs need **+34 to +42** lines of dispatch plumbing (≈ doubling the file).
- **That plumbing hurts readability.** With it, MDScript leads the blind panel **9.00 (unanimous)** vs ell 7.29, guidance/lmql 6.43, a ~+2 gap, up from a near-tie on the linear versions. LMQL fell the most (7.86 → 6.43).
