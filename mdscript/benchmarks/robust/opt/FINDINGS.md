# Optimizing mdscript-exec for small models (gemma 2B/4B) -> frontier

Goal: recursively optimize `skills/mdscript-exec/SKILL.md` to maximize execution
effectiveness from a small open model (gemma 2B/4B) up to frontier, using the
robust benchmark's deterministic checklist as the fitness function.

## TL;DR

- **Tools are the dominant lever, not the skill text.** Giving gemma-e2b real
  tools (an agentic tool-call loop, the way mdscript-exec actually runs in Cursor
  / Claude Code) lifted it from **41.9% to 62.2%** on the same scenarios. No skill
  rewrite came close to that.
- **The original SKILL.md (v0) is already well-tuned.** Six deliberate rewrites
  (restructure, RFC keywords, imperative bullets, a worked example, an
  explicit one-event-per-action rule, tool-use emphasis) all scored AT or BELOW
  v0 in both the single-shot and tool settings. Wording was not the bottleneck.
- **Small models under-generate in a single shot.** Asked to return one JSON
  trace, gemma-e2b emits ~1 event and a "started" summary, then stops, regardless
  of wording. That is a capacity limit of one-shot serialization, not the skill.
- **One real-world skill fix is justified:** clarify that the executor IS the
  agent and there is no separate `mdscript-exec` tool, to prevent tool-using
  small models from "delegating" to a phantom tool instead of doing the work.

## Method

- Fitness: `benchmarks/robust` deterministic checklist over 16 branch-forcing
  scenarios, mdscript-only (the skill only affects mdscript). Executor at
  temperature 0, so single-run comparisons are near-deterministic (but real
  run-to-run variance from a 2B model is still several points; treat <5-point
  gaps as noise).
- Two harnesses:
  - `run_ollama.py` (single-shot): model returns one JSON trace. No tools.
  - `run_ollama_tools.py` (agentic): model is given mock tools (run_command,
    write_file, ask_user, request_confirmation, health_check, rollback, notify,
    goto_state, git_init, complete) and runs a turn-by-turn loop; tool calls
    become the event trace, graded by the same checklist. This mirrors real use.

## Results

Single-shot e2b (no tools), checklist % and events/run:

| skill | % | ev/run |
| --- | ---: | ---: |
| v0 original | 41.9 | 1.0 |
| v1 restructure (prose) | 36.6 | 1.0 |
| v3 bullets + RFC | 33.4 | 1.0 |
| v4 rich + RFC | 37.6 | 1.3 |
| v5 + worked example | 39.7 | 1.3 |
| v6 + one-event-per-action | 39.7 | 1.4 |

Tool-using e2b (hardened harness), checklist %:

| skill | overall | deploy | release | onboard | ev/run | phantom |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **v8 = v0 + executor fix** | **65.9** | 63.1 | 83.3 | 56.0 | 12.2 | 0 |
| v0 original | 62.2 | 63.1 | 68.3 | 56.0 | 10.5 | some |
| v6 lean RFC bullets | 58.6 | 51.2 | 87.5 | 46.0 | 13.4 | - |
| v7 best-of-both + tools | 47.2 | 44.0 | 68.3 | 34.7 | 12.1 | - |

The single biggest jump is harness, not skill: v0 went 41.9 -> 62.2 just by
adding tools. Among skills, only the surgical executor-clarification (v8) beat the
original; it eliminated phantom delegations (0) and lifted release_notes. The
full RFC/bullet/worked-example rewrites were neutral-to-worse.

## Track B: self-authoring + recursion

The model is given the goal but NO artifact: it must author MDScript, decompose
into sub-scripts, then execute its own workflow with tools (same checklist).

| mode (e2b, tools, v8) | checklist % |
| --- | ---: |
| execute a given workflow | 65.9 |
| author then execute (Track B) | 32.7 |

Authoring roughly halves effectiveness at 2B: the model executes a provided
workflow far better than it writes one. The authored MDScript is also non-
idiomatic (e.g. `## States` / `## variables` blocks instead of clean `## Heading`
states), so decomposition/recursion is beyond reliable e2b reach and needs a more
capable model. Self-authoring is a frontier-model capability, not a small-model
one; for small models, ship them a written workflow and let them execute it.

## Phantom-delegation failure

In the tool setting, the model sometimes emits a tool call to a nonexistent
`mdscript-exec` tool, then calls `complete`, doing no real work. It is trying to
delegate to "the skill" instead of executing. The skill's `/mdscript-exec
path#heading` invocation examples invite this. Fixes:

1. Harness: reject unknown tool calls and tell the model it IS the executor.
2. Skill (real-world): one line stating there is no separate mdscript-exec tool;
   the agent performs the work itself.

## Small -> frontier curve (deploy_branch, the branchy case, v8 skill)

| model | setting | deploy_branch % | events/run |
| --- | --- | ---: | ---: |
| gemma-e2b | single-shot, no tools | ~31 | ~1 |
| gemma-e2b | tool loop | 63.1 | ~10 |
| claude-haiku | single-shot, no tools | **96.2** | ~16 |

The capability that small models lack is *serializing a whole multi-step run in
one shot*: e2b emits one event and stops; haiku emits the full 13-31 event trace
unaided and handles every recovery branch. A tool loop closes most of that gap
for the small model by letting it act one step at a time. The same v8 skill drives
all three rows, so the skill scales from small to frontier; the variable that
matters is the execution environment, sized to the model.

## Does exec language matter more at e4b? Yes.

Repeating the skill sweep on gemma4:e4b (tool harness) shows the wording spread
roughly doubles vs e2b, and the ranking changes:

| skill | e4b tools | e2b tools | per-case (e4b) deploy/release/onboard |
| --- | ---: | ---: | --- |
| v8 = v0 + executor fix | **71.8** | 65.9 | 65.5 / 90.0 / 66.0 |
| v9 = lean + executor fix | 71.6 | ~62 | 77.4 / 90.0 / 48.7 |
| v6 = lean RFC bullets | 69.3 | 58.6 | 70.2 / 81.7 / 58.0 |
| v0 = verbose original | 60.8 | 62.2 | 54.8 / 78.3 / 55.3 |

- **Spread is ~11 points at e4b vs ~4-7 at e2b.** On the capable model the exec
  language is a real lever; on the 2B model it is mostly noise around tools.
- **The ranking flips.** Verbose v0 is the WORST at e4b (60.8) - its length and
  `/mdscript-exec` invocation examples invite the capable model to delegate. Lean
  bullets (v6) went from worst-at-e2b to beating v0 by 8.5 at e4b.
- **The executor/anti-delegation fix is worth more at e4b** (it is the difference
  between v0 60.8 and v8 71.8, ~11 points, vs ~4 at e2b). A more capable model is
  more prone to delegate, so telling it "you are the executor, do it yourself"
  pays off more.
- **Style is case-dependent:** lean wins branchy deploy (v9 77.4), rich wins
  many-step onboard (v8 66.0). They tie overall, so v8 (rich + fix) stays the best
  all-around choice: best at e2b and co-best at e4b, balanced across cases. No
  reason to change the shipped skill.

## Real-harness validation (opencode + ollama)

To confirm the tools result is not an artifact of the mock harness, the same
skill was run in opencode (a real coding agent) against ollama, executing a real
MDScript workflow with real file/bash tools in a sandbox:

- **gemma4:e4b executes correctly.** Given the workflow and the executor rules it
  ran `mkdir`, wrote the file (resolving `{{topic}}`), and ran `ls`/`cat` with
  real tools, producing the actual file on disk.
- **The delegation failure is real, not a mock artifact.** On the first attempt
  e4b tried to hand the work to opencode's `task` (subagent) tool **6 times** and
  produced nothing, the same "delegate instead of execute" pattern seen as the
  phantom `mdscript-exec` call in the mock harness.
- **The skill fix resolves it.** Adding "You ARE the executor; do it yourself, do
  not delegate" dropped delegation attempts from 6 to 0 and the workflow
  completed and wrote the file. This is the one skill change the data supports,
  validated end-to-end in a real agent.
- **gemma4:e2b is on the edge in a heavy harness.** In opencode's full system
  prompt it tended to echo the prompt and leak raw tool-call tokens; it executes
  far better in the focused mock harness (62%). Practical guidance: the smaller
  the model, the leaner the surrounding harness/context should be.

## Decision

Keep SKILL.md ~= v0 (it is the best performer), add only the surgical
"you are the executor / no mdscript-exec tool" clarification. Do NOT adopt the
RFC-bullet rewrites: they did not beat the original on this fitness. The high-
leverage recommendation for users is environmental: run mdscript-exec in a
harness that gives the model tools (Cursor, Claude Code, or opencode + ollama for
local models), which is where small-model effectiveness actually comes from.
