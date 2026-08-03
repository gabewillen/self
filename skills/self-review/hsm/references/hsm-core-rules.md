# HSM review rules

Primary HSM contract for the self-review `hsm` blind lane. UML 2.5 hierarchical state machine semantics, actor-oriented.

**Library-agnostic.** No rule names a library, module, API, or version. Concrete frameworks are
implementation bindings only — see [bindings.md](bindings.md), used for remediation wording after a
finding exists, never as a source of rules.

Project overlays may add policy or raise severity. They may not weaken a rule or lower a severity.

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **Vertex** | State or pseudostate |
| **Transition** | Edge: optional trigger, guard, effect, source, target |
| **Guard** | Boolean constraint for transition selection |
| **Effect** | Behavior on the transition when taken |
| **Entry / exit** | Behavior on entering/exiting a state |
| **Activity** | Ongoing work while in a state; runs outside the step; interruptible on exit |
| **Choice** | Conditional branch pseudostate |
| **Actor** | One machine instance owning its state and data |
| **RTC step** | Run-to-completion: one event dispatched and fully processed, serialized per actor |

---

## OW — Ownership: should this be a machine at all

**This gate precedes design.** Ask it before a machine is written, and first in any review.
Three questions: does it need a mutex, atomics, or any synchronization primitive? Is it an actor
owning a lifecycle? Does it consume or produce messages? If any answer is yes, it is a machine.
If all are no, it stays a plain function.

| ID | Rule |
|----|------|
| OW-01 | An actor exists only with a named durable owner: its lifecycle, the data it owns, the events it accepts, the status it exposes. |
| OW-02 | Choose the **smallest enclosing long-lived actor**. A route, subject, handler, step, gate, or fixture is not an owner. |
| OW-03 | **NEVER** create machines for stateless stores, accessors, mappers, validators, builders, encoders, or renderers. The machine replaces a synchronization primitive; it does not wrap things that need none. |
| OW-04 | Before adding a second machine, justify why it is not nested states or a submachine of the first. |
| OW-05 | **NEVER** keep synchronization outside a machine that qualifies under the three questions. |

---

## AC — Actor boundary and RTC

The machine is the only writer and the only reader of its own data.

| ID | Rule |
|----|------|
| AC-01 | Machine state and attributes are read and written **only inside an RTC step** of that machine (its guards, effects, entry, exit). Never from outside. |
| AC-02 | An actor **NEVER reads** another actor's state or attributes directly. Request it with an event; receive the answer as an event or a response channel carried in the event payload. |
| AC-03 | An actor **NEVER writes** another actor's state or attributes directly. Send an event. |
| AC-04 | **NEVER guard on another actor's state.** If two machines need each other's state to decide, the boundary is wrong — merge them or exchange events. |
| AC-05 | Observation surfaces (snapshots, current-state queries) are for logging, persistence, status, and readiness only. **NEVER** use them to drive progression. |
| AC-06 | **Activities run outside the RTC step.** An activity must not read or mutate machine data directly; it returns results as **events**. |
| AC-07 | **NEVER** use locks/mutexes to protect machine data. RTC already serializes it — a lock is evidence of an out-of-step access (AC-01). |
| AC-08 | **NEVER** expose machine-owned data through getters, or mutate it through ordinary methods. Public surface is: dispatch an event, receive a result. |
| AC-09 | **NEVER** re-enter the same actor mid-step in a way that breaks RTC. |

---

## CN — Concurrency (P0)

| ID | Rule |
|----|------|
| CN-01 | Model concurrency as **separate actors**, started and supervised from an activity, coordinating by events. |
| CN-02 | **NEVER** use orthogonal / parallel regions. They cause state explosion and are not universally supported. |
| CN-03 | Cross-actor coordination is **event forwarding**, subject to AC-02..AC-04. |

---

## CF — Control flow is the graph (P0)

**Primary rule:** behavior is modeled explicitly in the graph. It is never hidden inside entry, exit, effect, or activity bodies.

| ID | Rule |
|----|------|
| CF-00 | **Model behavior explicitly.** Modes, sequencing, branching, waiting, retries, cancellation, and allowed actions live in states, transitions, guards, choices, and typed events — **never** concealed in entry, exit, effect, or activity code. |
| CF-01 | Model control flow with **transitions**, **guards**, and **choice**. |
| CF-02 | **NEVER** use a conditional in entry, exit, effect, or activity to choose which path, event, transition, or outcome runs next. |
| CF-03 | Conditionals inside behaviors are allowed **only** for local data work that does not change control flow. |
| CF-04 | Mutually exclusive outcomes go on **separate guarded transitions** or a **choice**, with an explicit **else/default** when guards are not exhaustive. |
| CF-05 | **NEVER** hide the graph in `if` / `switch` / lookup tables inside behaviors. |
| CF-06 | Guards on the **same trigger in the same state** must be provably disjoint, or the set must end in one unguarded default. |
| CF-07 | **NEVER** rely on guard evaluation order for correctness beyond that trailing default. UML leaves the order unspecified. |
| CF-08 | A **guard only prevents a transition**. Prefer an explicit **state** over a guard when preventing actions or selecting which behavior may run. |
| CF-09 | When **multiple transitions** from the same source need **multiple guards** to choose outcomes or allowed actions, that fan-out **MUST** become a state (or nested states under a choice), not a multi-guard edge set. |

**Bad:** `effect: if ok { success } else { failure }`
**Good:** transition to choice → `[ok] Succeeded` / `[else] Failed`

**Bad:** one source with several guarded transitions that gate which action may run
**Good:** enter a state that owns the allowed action set; use a guard only to block an illegal transition

---

## BH — Behavior roles and purity (P0)

| ID | Rule |
|----|------|
| BH-01 | **Guards are pure**: no world side effects, no dispatch, no control-flow side effects. |
| BH-02 | Entry, exit, and effect do **no** blocking, long-running, or async work, and no external I/O beyond BH-06. |
| BH-03 | **Activities** carry long-running, async, or continuous work; they are cancelled on exit and must observe cancellation promptly. |
| BH-04 | **NEVER** put long-running or async work in entry, exit, effect, or guard. |
| BH-05 | **NEVER** block an RTC step on an external wait. |
| BH-06 | **Permitted in entry/exit/effect:** mutate machine-owned data; emit structured logging/telemetry; dispatch **at most one** typed completion or error event. |
| BH-07 | Reporting an **external** operation's outcome as a typed event is allowed. Selecting between branches that are derivable from machine state or event payload is **not** — that is CF-02. |
| BH-08 | Progression events dispatched from behavior are declared with an explicit completion/error kind, not left implicit. |
| BH-09 | An activity does **one continuous unit of work** for its state. **NEVER** implement multi-step workflows, phase sequences, or mini machines inside an activity. |
| BH-10 | Multi-step work is **decomposed into states**. Progression between those steps is driven by typed **completion events** (and error events), not internal activity sequencing. |

---

## ST — Structure

| ID | Sev | Rule |
|----|-----|------|
| ST-01 | P0 | Any region that can be entered shallowly has a defined **initial**. |
| ST-02 | P0 | **Choice** has outgoing transitions, and an unguarded else when guards are not exhaustive. |
| ST-03 | P1 | **Final** is absorbing: no outgoing transitions, no entry/exit/activity. |
| ST-04 | P1 | **History** only inside composites, with a default target for first entry. |
| ST-05 | P0 | Every transition end names an existing vertex. |
| ST-06 | P0 | **Run-to-completion** is preserved. |
| ST-07 | P1 | Unhandled events are explicitly ignored, deferred, or raised — never silently dropped. |
| ST-08 | P1 | Deferral is modeled in the machine, not with an external buffer. |
| ST-09 | P1 | A reaction that only updates data or replies uses an **internal transition** (source, no target). |
| ST-10 | P1 | **NEVER** use a self-transition (target == source) unless entry/exit re-execution or activity restart is intended; say so. |
| ST-11 | P1 | **NEVER** rely on implicit completion semantics; declare the completion event. |
| ST-12 | P2 | Domain vocabulary for states and events — not implementation-technology noise. |

---

## RC — Reachability and completeness

Computed from the extracted graph, not from reading source.

| ID | Sev | Rule |
|----|-----|------|
| RC-01 | P0 | Every vertex is reachable from an initial pseudostate. |
| RC-02 | P0 | No non-final vertex is a dead end (no outgoing transition and no deferral). |
| RC-03 | P1 | Every declared event is consumed by at least one transition. |
| RC-04 | P1 | Every event dispatched from outside is handled somewhere in the target machine. |
| RC-05 | P2 | Every guarded outcome and every choice default is exercised by a test. |

---

## HI — Hierarchy over duplicate transitions (P0/P1)

| ID | Rule |
|----|------|
| HI-01 | Duplicate transitions for the same event with the same response are lifted into a common ancestor. |
| HI-02 | Prefer hierarchy over copy-pasted handlers on sibling leaves. |
| HI-03 | Factor shared entry/exit/activity/**defer** upward; keep only state-specific differences at leaves. |
| HI-04 | **NEVER** explode leaves with repeated transitions a parent can own. |
| HI-05 | Multi-step workflows use a **hierarchical parent/composite** for the shared workflow scope. Shared cancel/abort/timeout/completion routing lives there, not on every step. |
| HI-06 | **NEVER** duplicate the same `defer` (or equivalent deferred-event set) across sibling workflow states. Declare shared deferral once on the parent. |

**Bad:** A/B/C each `-- cancel --> Idle` **Good:** composite `Active` owns `-- cancel --> Idle`

**Bad:** every workflow step repeats `defer(UserInput)` / `hsm.defer(...)`
**Good:** composite `WorkflowActive` owns the shared defer; steps only model step-specific behavior

---

## TM — Time and asynchrony (P0/P1)

| ID | Sev | Rule |
|----|-----|------|
| TM-01 | P0 | Timeouts and periodic work are **machine-owned time events**, never sleeps or timers created inside behaviors. |
| TM-02 | P0 | Async completion returns as an **event**; the activity may run the work but must not branch the outcome in code. |
| TM-03 | P1 | No ambient clock, RNG, filesystem, network, or environment reads in guards, entry, exit, or effects. Inject them or carry them on the event. |
| TM-04 | P0 | Multi-step async work is a **state sequence** advanced by **completion events**, not one activity that performs several phases. |

---

## Verdict

**Every rule in this pack blocks.** There is no advisory tier. Severity orders the report; it does
not decide whether the review fails.

The only escape is an explicit user waiver naming the rule ids, recorded in the run. A waived
finding is reported as waived, never as passing.

Report the semantic verdict (OW/AC/CN/CF/BH/ST/RC/HI/TM) separately from any project-overlay verdict.
