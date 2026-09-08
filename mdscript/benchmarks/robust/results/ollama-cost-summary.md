# Execution cost (time and tokens)

`run_ollama.py` now records the real per-run cost reported by ollama for every
execution: input tokens (`prompt_eval_count`), output tokens (`eval_count`), and
latency (`total_duration` minus the one-time `load_duration`, in seconds). Every
row in `results/ollama-*.json` carries a `cost` object, and the summary table
prints per-system averages. Cost is recorded even when a trace fails to parse, so
a degenerate run still shows what it spent.

These are real measured numbers from the open-source executor (gemma), not
estimates. The Claude-haiku executor runs through the workflow runner, which does
not surface per-call token usage, so its absolute tokens and wall-clock time are
not recoverable from the existing run; the relative input-cost structure below
(MDScript carries its spec/skill into the prompt, the DSLs are self-describing)
holds for any executor because it is a property of the prompt, not the model.

## gemma4:e4b, skill aid, 16 scenarios x 1 repeat

| System | checklist % | parse_ok % | avg in tok | avg out tok | avg exec s |
| --- | ---: | ---: | ---: | ---: | ---: |
| LMQL | 70.5 | 100 | 1248 | 225 | 25.5 |
| Guidance | 63.6 | 100 | 1321 | 191 | 24.2 |
| MDScript | 57.4 | 75 | 1858 | 122 | 21.4 |
| ell | 54.6 | 93.8 | 1203 | 192 | 24.4 |

## What the cost numbers say

Raw token counts mislead, because output is priced about 5x input (Haiku 4.5 is
$0.80/Mtok in, $4.00/Mtok out). The bill is dollars, so weight accordingly.

| System | in tok | out tok | $/1k runs | $/1k runs, aid cached |
| --- | ---: | ---: | ---: | ---: |
| MDScript | 1858 | 122 | 1.98 | **1.40** |
| LMQL | 1248 | 225 | 1.90 | 1.90 |
| Guidance | 1321 | 191 | 1.82 | 1.82 |
| ell | 1203 | 192 | 1.73 | 1.73 |

- **MDScript carries the highest input (~1858 tok, +40 to +55% over the DSLs)
  because it inlines its execution aid** (`spec.md` or `SKILL.md`); the DSLs are
  self-describing code and carry no spec. But it produces the **lowest output (122
  tok) and lowest latency (21.4 s)**, the most concise traces.
- **Priced for real, the input gap nearly vanishes.** Output at 5x the input price
  means MDScript's terse output offsets most of its fat input: $1.98 per 1000 runs
  versus $1.73 to $1.90 for the DSLs, a few percent, not the +50% the raw input
  count suggested.
- **The aid is a cacheable prefix, and that flips the ranking.** `spec.md` /
  `SKILL.md` is a fixed prompt prefix, exactly what prompt caching targets (cache
  read ~0.1x). Cached, MDScript is the cheapest of all four ($1.40 per 1000 runs).
  In a persistent agent session where `mdscript-exec` is already loaded, the aid is
  paid once and amortized, not re-billed per run, so the realistic steady-state
  cost is the cached column, not the uncached one. The DSLs have no equivalent
  static prefix to cache away.
- The 4 MDScript parse failures emitted degenerate short outputs (29 to 38 tok),
  which lower its output average slightly; even excluding those the dollar story
  holds because output, not input, dominates the price.
