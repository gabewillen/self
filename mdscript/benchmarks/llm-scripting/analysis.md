# Probabilistic LLM Scripting Benchmark

This analysis is based on `benchmarks/llm-scripting/results/latest.json`, generated with OpenAI `gpt-5.5` using `--blind-labels`, the default `probabilistic` system group, 3 execution runs per artifact, and 3 judgments per execution.

## Outcome Result

`gpt-5.5` completed 36 executions and 108 judgments with zero failed executions or judgments. The rubric scores produced task outcomes, not readability, simplicity, debuggability, or framework feature depth as independent virtues.

| Rank | System | Overall | Task Success | Requirements Met | Failure Recovery | Std Dev | Judgments |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | MDScript | 9.73 | 9.89 | 9.67 | 9.33 | 0.35 | 27 |
| 2 | Guidance | 9.67 | 9.81 | 9.59 | 9.37 | 0.36 | 27 |
| 3 | ell | 9.65 | 9.78 | 9.63 | 9.30 | 0.37 | 27 |
| 4 | LMQL | 9.65 | 9.81 | 9.56 | 9.30 | 0.39 | 27 |

Case winners:

- `release_notes`: LMQL, 9.73.
- `deploy_branch`: ell, 9.71.
- `onboard_service`: MDScript, 9.93.

## Interpretation

The corrected run answers the narrower question raised by review feedback: how does MDScript compare against other probabilistic scripting formats, not against full programmatic agent frameworks. In that comparison, MDScript narrowly ranks first.

The earlier MDScript trailing result was informative, but not publishable as-is. Two issues were mixed into the comparison:

- The generated MDScript artifact did not embed the goal and success criteria, while Guidance, LMQL, and ell artifacts did.
- Two case requirements were implicit rather than explicit: branch names needed slash-to-hyphen sanitization for deploy artifacts, and Docker Compose scaffolds needed `docker-compose.yml`.

After making those details explicit in the shared benchmark source, MDScript produced complete executions in all 9 attempts across the three cases. It won `onboard_service`, placed second on `deploy_branch`, and placed second on `release_notes`.

## What Changed

The benchmark now defaults to the `probabilistic` system group:

```text
mdscript, guidance, lmql, ell
```

Programmatic agent/workflow frameworks are excluded from the publishable result because they bring different tradeoffs: typed state, graph control, tracing, runtime execution, optimizers, or SDK machinery. Those systems can still be run with `--system-group all` for exploratory context, but they are not the headline comparison.

The execution-and-judgment method is unchanged:

1. The executor model follows the workflow artifact and produces a structured task result.
2. The judge model scores only that produced result against the task scenario.
3. Each artifact receives 3 execution attempts and 3 judgments per attempt.

Current overall score:

```text
0.50 task_success + 0.35 requirements_met + 0.15 failure_recovery
```

## MDScript Takeaway

The defensible claim is:

> In a repeated frontier-model execution-and-judgment benchmark against probabilistic LLM scripting systems, MDScript produced the highest overall score after the benchmark was narrowed to comparable systems and success-critical details were made explicit in the shared task definitions.

The key practical lesson is not that MDScript can rely on vagueness. It is the opposite: freeform scripting works best when the author writes success-critical details plainly. Once the Markdown artifact included the same goal context and the tasks named exact artifact requirements, the executor handled the workflows consistently.

## Limits

- This is still an LLM-simulated execution benchmark, not a sandboxed real tool execution benchmark.
- The executor and judge both used `gpt-5.5`; provider/model coupling may affect results.
- The artifacts are generated representations, not expert-authored best implementations for every system.
- The benchmark scenarios exercise only three workflow families.
- The margin between all four systems is small, so future runs should report confidence intervals before making strong claims.

## Next Improvements

- Run a true sandbox executor that creates files and runs commands, then judge concrete filesystem/output state.
- Add hand-authored best-effort artifacts for every probabilistic scripting system.
- Add multiple executor models, including a smaller local model, to test whether MDScript helps weaker agents more than frontier agents.
- Add confidence intervals across more than three execution attempts.
