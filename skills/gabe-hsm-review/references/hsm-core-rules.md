# HSM review rules (framework-agnostic)

Primary contract for `gabe-hsm-review`. Tailored to **UML 2.5 hierarchical state machine** semantics. Concrete libraries (hsm.go, SML, XState, …) are only implementation bindings—never the source of control-flow rules.

Optional project overlays may add policy (deps, naming); they must not weaken the rules below.

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **Vertex** | State or pseudostate |
| **Transition** | Edge: optional trigger, guard, effect, source, target |
| **Guard** | Boolean constraint for transition selection |
| **Effect** | Behavior on the transition when taken |
| **Entry / exit** | Behavior on entering/exiting a state |
| **Activity (do-activity)** | Ongoing work while in a state; interruptible on exit |
| **Choice** | Conditional branch pseudostate (guards on outgoing transitions) |
| **Composite / hierarchy** | State containing nested substates |
| **RTC** | Run-to-completion |

---

## Control flow is the graph (P0)

| ID | Rule |
|----|------|
| CF-01 | **ALWAYS** model control flow with **transitions**, **guards**, and **choice** (or equivalent conditional pseudostates). |
| CF-02 | **NEVER** use conditionals in **entry, exit, effect, or activity** to choose which path, event, transition, or outcome runs next. |
| CF-03 | Conditionals inside behaviors are allowed **only** for pure local data work that does **not** change control flow. |
| CF-04 | **ALWAYS** put mutually exclusive outcomes on **separate guarded transitions** or a **choice** with guarded outs and an explicit **else/default** when guards are not exhaustive. |
| CF-05 | **NEVER** hide the state graph in `if` / `switch` / lookup tables inside behaviors. |

**Bad:** `effect: if ok { success } else { failure }`  
**Good:** transition to choice → `[ok] Succeeded` / `[else] Failed`

---

## Behavior roles and purity (P0)

| ID | Rule |
|----|------|
| BH-01 | **Guards MUST be side-effect free** (pure over event + machine data). |
| BH-02 | **Entry, exit, and effects MUST be side-effect free** w.r.t. external I/O, ambient time/RNG, network, FS, thread/timer creation. No long-running or async work. |
| BH-03 | **Activities** are for **long-running / async / continuous** work while the state is active; cancel on exit. |
| BH-04 | **NEVER** put long-running or async work in entry, exit, effect, or guard. |
| BH-05 | **NEVER** block the RTC step on external waits inside entry/exit/effect/guard. |
| BH-06 | **NEVER** re-enter the same machine mid-step in a way that breaks RTC. |

“Side-effect free” = no world side effects and no control-flow side effects. Pure local field updates that do not choose paths may be acceptable; prefer modeling durable change in the transition design.

---

## Hierarchy over duplicate transitions (P0/P1)

| ID | Rule |
|----|------|
| HI-01 | **Duplicate transitions for the same event** with the same (or largely same) response **MUST** be lifted into a **common hierarchical ancestor** (or submachine). |
| HI-02 | Prefer hierarchy over copy-pasted identical event handlers on sibling leaves. |
| HI-03 | Factor shared entry/exit/activity and common handlers upward; keep only state-specific differences at leaves. |
| HI-04 | **NEVER** explode leaves with repeated identical transitions a parent can own. |

**Bad:** A/B/C each `-- cancel --> Idle`  
**Good:** composite `Active` contains A/B/C; `Active -- cancel --> Idle`

---

## Structure

| ID | Sev | Rule |
|----|-----|------|
| ST-01 | P0 | Regions that auto-enter need a defined **initial**. |
| ST-02 | P0 | **Choice** has outgoing transitions; **else** when guards are not exhaustive. |
| ST-03 | P1 | **Final** is absorbing. |
| ST-04 | P1 | **History** only inside composites; default when no history yet. |
| ST-05 | P1 | Transition ends name existing vertices. |
| ST-06 | P0 | **Run-to-completion**. |
| ST-07 | P1 | Unhandled events: explicit ignore / defer / error—not silent intent loss. |
| ST-08 | P1 | Deferral is modeled explicitly, not with ad-hoc external buffers. |
| ST-09 | P2 | Domain vocabulary for states/events—not framework noise. |

Orthogonal regions: allowed by UML; if project policy bans them, require submachines + events instead (OR-01/OR-02 as project overlay).

---

## Time and asynchrony

| ID | Sev | Rule |
|----|-----|------|
| TM-01 | P0 | Timeouts/periodic behavior are **machine-owned** time events—not sleeps in behaviors. |
| TM-02 | P0 | Async completion returns as **events**; activities may run the work but must not branch outcomes in code. |
| TM-03 | P1 | No ambient wall-clock/RNG/IO in guards/entry/exit/effects without injection. |

---

## Finding priority

1. CF / BH / HI / ST-06 / TM control-flow and purity  
2. Other ST / TM  
3. Optional project overlay only  
4. Framework API wording only as a remediation note—not a separate standard  
