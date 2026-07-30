# HSM core rules (cross-language)

Distilled from `stateforward/hsm/AGENTS.md` and `dsl.md`. Full scratch: `../scratch-hsm-requirements.md`.

## Control flow in the graph

| ID | Severity hint | Rule |
|----|---------------|------|
| CORE-01 | P0 | NEVER branch transition-driving control with if/else/switch |
| CORE-02 | P0 | ALWAYS use explicit `hsm.Choice` for conditional flow |
| CORE-03 | P1 | Guards/effects/entry/exit free of external I/O side effects (see completion-dispatch exception in skill) |
| CORE-04 | P0 | NEVER while-loop/poll inside activities |
| CORE-05 | P0 | ALWAYS machine-owned time: `After` / `Every` / `At` |
| CORE-06 | P1 | NEVER duplicate implicit state outside the machine |
| CORE-07 | P1 | Express system state via states/transitions/events |
| CORE-08 | P0 | NEVER access attributes/context from outside |
| CORE-09 | P1 | Interact via dispatch + language-appropriate outputs |
| CORE-10 | P2 | Use hierarchy to factor shared behavior |
| CORE-11 | P1 | No globals/singletons inside the machine |
| CORE-12 | P1 | Inject external services |
| CORE-13 | P2 | Decompose submachines to prevent explosion |
| CORE-14 | P1 | `hsm.Defer` for events that must wait |
| CORE-15 | P0 | NEVER parallel/orthogonal regions |
| CORE-16 | P0 | Concurrent behavior = submachines + events |
| CORE-17 | P1 | External data via `hsm.Attribute` |
| CORE-18 | P1 | Observe attrs via `When` / `OnSet` |
| CORE-19 | P0 | NEVER mutate from ordinary methods |
| CORE-20 | P0 | Mutate only via transitions |
| CORE-21 | P1 | Deterministic transition priority |
| CORE-22 | P1 | No hidden event emission from guards/effects |
| CORE-23 | P1 | Explicit unhandled-event policy — never silent drop |
| CORE-24 | P0 | Submachines never share/mutate each other’s context |
| CORE-25 | P0 | No external timeout managers |
| CORE-26 | P1 | Inject clock/random/IO — no nondeterministic reads in transition logic |
| CORE-27 | P2 | Observable/traceable transitions |
| CORE-28 | P0 | Run-to-completion — no re-entrancy in a step |

## DSL structure

| ID | Severity hint | Rule |
|----|---------------|------|
| DSL-01 | P1 | Namespace-level PascalCase `hsm.Define` DSL |
| DSL-02 | P1 | Names must not contain `/` |
| DSL-03 | P0 | No parallel regions — submachines only |
| DSL-04 | P0 | Choice has outs; last unguarded fallback |
| DSL-05 | P1 | History needs default target/partials |
| DSL-06 | P1 | Finals absorbing |
| DSL-07 | P1 | Timing triggers only on real state sources |
