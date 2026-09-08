# LLM Scripting Benchmark

This benchmark compares MDScript with probabilistic, human-readable LLM scripting systems using a two-stage LLM execution and judgment loop. It is intentionally representation-level: each system gets an equivalent source artifact for the same repository workflow, an executor model attempts the workflow three times, and a judge model scores each produced result three times.

The default judge is `gemma4:e4b`, the smallest installed Gemma 4-family model in this environment. That is deliberate: a small local model is more likely to expose whether a format remains legible under long-horizon workflow pressure. For publishable judge results, run the OpenAI backend with `gpt-5.5` and `--blind-labels`.

## Research Notes

The publishable comparison set is deliberately restricted to probabilistic scripting systems: source artifacts whose main job is to steer language-model behavior rather than provide deterministic runtime orchestration.

- MDScript uses Markdown headings, links, variables, and natural-language instructions as an executable workflow artifact.
- Guidance scripts model prompts and constrained generations with Python-hosted control flow.
- LMQL expresses language-model queries with constraints over generated variables.
- ell represents language-model programs as Python functions with prompt/tool structure.

Programmatic agent and workflow frameworks are not part of the default benchmark. LangGraph, LlamaIndex Workflows, Microsoft Agent Framework, OpenAI Agents SDK, Pydantic AI, and DSPy are useful engineering tools, but they bring runtime machinery, typed state, tracing, graph control, or optimizer abstractions that answer a different question. They remain available in the harness through `--system-group all` for exploratory context, not as the headline comparison.

Sources used for positioning:

- Guidance repository/docs: <https://github.com/guidance-ai/guidance>
- LMQL docs: <https://lmql.ai/docs/latest/language/reference.html>
- ell docs: <https://docs.ell.so/>

## Methodology

The harness renders equivalent workflow artifacts for each probabilistic scripting candidate and case. For each artifact, it runs:

1. Three independent execution attempts against a fixed task scenario.
2. Three independent judgments for each produced execution result.

That yields 9 judgments per case/system and 27 judgments per system across the three cases. Each judgment scores produced task outcomes on a 1-10 scale:

- `task_success`: how likely a capable coding agent is to complete the task end-to-end.
- `requirements_met`: how many explicit success criteria are likely to be satisfied in the final result.
- `failure_recovery`: how likely the workflow is to recover from normal branch/failure cases.

Overall score is weighted as:

```text
0.50 task_success + 0.35 requirements_met + 0.15 failure_recovery
```

The order of judge calls is randomized with a fixed seed to reduce position effects. All artifacts are generated locally from the same case definitions, and the judge prompt tells the model to score only the artifact, not ecosystem reputation. Use `--blind-labels` for publication-oriented runs; it masks candidate names in the judge prompt and replaces obvious framework identifiers in the artifact text.

The executor prompt treats natural-language bullets, comments, and instruction strings as workflow semantics. The judge prompt scores only produced execution results, not readability, simplicity, debuggability, or framework feature depth as independent virtues.

This benchmark does not install or run each scripting library. That is intentional: MDScript is being tested as a readable workflow artifact for an LLM to execute, so the comparison holds the execution environment constant and varies the artifact representation.

## Latest Result

The current run used OpenAI `gpt-5.5` with `--blind-labels`. It completed 36 executions and 108 judgments with zero failed executions or judgments.

<!-- latest LLM scripting benchmark summary from results/latest.json -->

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

## Run

```bash
python3 benchmarks/llm-scripting/benchmark.py
```

Frontier judge run:

```bash
python3 benchmarks/llm-scripting/benchmark.py \
  --backend openai \
  --model gpt-5.5 \
  --blind-labels \
  --system-group probabilistic \
  --execution-runs 3 \
  --judgments-per-run 3 \
  --env-file ../cortext/.env
```

Useful overrides:

```bash
python3 benchmarks/llm-scripting/benchmark.py --backend ollama --model gemma4:e4b
python3 benchmarks/llm-scripting/benchmark.py --model gemma4:e4b
python3 benchmarks/llm-scripting/benchmark.py --cases release_notes,deploy_branch
python3 benchmarks/llm-scripting/benchmark.py --systems mdscript,guidance,lmql
python3 benchmarks/llm-scripting/benchmark.py --system-group all
python3 benchmarks/llm-scripting/benchmark.py --execution-runs 1 --judgments-per-run 1
python3 benchmarks/llm-scripting/benchmark.py --dry-run
```

Outputs are written under `benchmarks/llm-scripting/results/`:

- `latest.json`: full run data, rendered artifacts, raw judge responses, and aggregate scores.
- `latest-summary.md`: compact markdown summary.
- timestamped JSON: immutable copy for each run.

## Cases And Systems

<!-- benchmark systems and cases from benchmark.py -->

Cases:

- `release_notes`: collect commits from a git range, categorize them, and write `CHANGELOG.md`.
- `deploy_branch`: select a branch, run checks, build an artifact, deploy it, and verify health.
- `onboard_service`: interactively scaffold a new service with language, infrastructure, and deployment choices.

Systems:

- `mdscript`: Markdown state machine for coding agents.
- `guidance`: prompt programming language embedded in Python.
- `lmql`: language-model query language.
- `ell`: Python LMP functions for model programs.

Additional exploratory renderers available with `--system-group all`:

- `langgraph`: Python graph workflow for stateful agents.
- `llamaindex_workflows`: Python event-driven agent workflow.
- `microsoft_agent_framework`: Python/.NET agent workflow framework.
- `openai_agents`: Python agent loop with tools, guardrails, and tracing.
- `pydantic_ai`: typed Python agent framework.
- `dspy`: Python LM programming framework with signatures/modules.
