# gabe-hsm-review — scratch requirements (review draft)

**Status:** scratch only — not the skill yet. Review this before MDScript authoring.

**Goal of the future skill:** `gabe-hsm-review` — MDScript skill that adversarially reviews HSM/SML work against Agent’s hard rules across `hsm.go` / multi-language HSM DSL, grantt, mjw-style usage, and emel.cpp SML actor rules.

---

## Sources consulted

| Source | Path | What it contributes |
|--------|------|---------------------|
| HSM core AGENTS | `~/VSCode/stateforward/hsm/AGENTS.md` | Cross-language hard ALWAYS/NEVER for HSM design |
| HSM DSL | `~/VSCode/stateforward/hsm/dsl.md` | API surface, constraints, no parallel regions, PascalCase DSL |
| hsm.go numbered rules | `~/VSCode/stateforward/hsm/hsm.go/rules.md` | HSM01–HSM54 implementation constraints |
| grantt CLAUDE | `~/VSCode/grantt-me/grantt/CLAUDE.md` | Product policies: when HSM is mandatory, completion/choice/timer/naming, version pin |
| grantt hsm.rules | `~/VSCode/grantt-me/grantt/.agents/rules/hsm.rules.md` | HSM01–HSM98 expanded grantt hard rules |
| emel.cpp AGENTS | `~/VSCode/stateforward/emel/emel.cpp/AGENTS.md` | SML actor RTC / no-queue / no-branch-in-actions contract |
| emel sml.rules | `~/VSCode/stateforward/emel/emel.cpp/docs/rules/sml.rules.md` | Authoritative SML semantics (wins over AGENTS on conflict) |
| mjw usage | `~/Development/mjw` | Live patterns: `Define`/`Choice`/`Activity`/`CompletionEventKind` in Go services |

**Note:** emel is **stateforward.SML** (C++), not `hsm.go`. Shared *intent* (RTC, pure guards, graph-owned control flow, no hidden queues) maps across; API names differ. Reviewer must select the **active dialect** from the target tree.

---

## 0. Reviewer operating contract (for the skill)

1. Infer `{{dialect}}`:
   - `hsm.go` — Go + `github.com/stateforward/hsm.go`
   - `hsm.*` — other language ports following `dsl.md` / `AGENTS.md`
   - `sml.cpp` — emel / stateforward.SML
2. Infer `{{project_policy}}` extras (grantt version pin, naming, NATS actor mandate, etc.) when present in target `AGENTS.md` / `CLAUDE.md` / `.agents/rules`.
3. Default severity:
   - **P0** — violates RTC, introduces mutex/queue instead of machine, hidden control flow in behavior, silent event drop, re-entrancy, allocation-in-dispatch (SML), wrong completion kind
   - **P1** — timers outside machine, branching via if/switch instead of Choice/guards, external mutation of machine state, missing initial/history/fallback structure
   - **P2** — naming (`hsm_` / `_hsm`), decomposition/state-explosion, activity vs entry misuse, missing trace/test waits
   - **P3** — style/docs (transition table formatting in SML, comment quality)
4. Every finding must cite: **rule id**, **location**, **evidence**, **required remediation**, **dialect**.
5. Do not sign off with residual P0–P2 unless user explicitly waives with recorded scope.
6. Prefer live code + tests over summaries. Snapshots/docs alone are not proof of HSM correctness.

---

## 1. When an HSM/SML is required (grantt / mjw product policy)

From grantt constraints (apply when reviewing grantt-like Go systems; soft-check elsewhere):

**MUST use HSM when ANY of:**
1. Needs mutex, atomics, or any synchronization primitive for its lifecycle
2. Is an actor
3. Is a NATS message consumer/producer

**MUST NOT** wrap pure stateless utilities (KV get/set, hash, compare) in an HSM “just because.”

**MUST** use `github.com/stateforward/hsm.go` — no substitute state-machine library.

**grantt version pin:** every tracked `go.mod` requiring `hsm.go` must pin **exactly `v1.3.1`** (direct or indirect), no `replace`. Hand-picked module lists are insufficient for QA — enumerate all `go.mod`.

---

## 2. Cross-language HSM hard rules (`hsm/AGENTS.md` + `dsl.md`)

### 2.1 Control flow belongs in the graph

| ID | Rule |
|----|------|
| CORE-01 | NEVER encode branching with if/else (or switch) for transition-driving control flow |
| CORE-02 | ALWAYS model conditional flow with explicit `hsm.Choice` |
| CORE-03 | NEVER perform side effects in guards, effects, entry, or exit — keep them pure / free of external I/O |
| CORE-04 | NEVER while-loop or poll inside activities |
| CORE-05 | ALWAYS schedule time via `hsm.Every` / `hsm.After` / `hsm.At` (machine-owned time) |
| CORE-06 | NEVER store implicit/duplicated state that undermines the machine as source of truth |
| CORE-07 | ALWAYS express system state through explicit states, transitions, events |
| CORE-08 | NEVER access attributes/context from outside the machine |
| CORE-09 | ALWAYS interact by dispatching events and receiving outputs via language-appropriate channels |
| CORE-10 | ALWAYS use hierarchy to factor shared behavior |
| CORE-11 | NEVER depend on globals/singletons inside the machine |
| CORE-12 | ALWAYS inject external services/resources |
| CORE-13 | ALWAYS decompose into submachines to prevent state explosion |
| CORE-14 | ALWAYS use `hsm.Defer` for events that must wait until leaving current state |
| CORE-15 | NEVER model concurrency with parallel/orthogonal regions |
| CORE-16 | ALWAYS model concurrency as **submachines** communicating via events |
| CORE-17 | ALWAYS declare externally relevant data as `hsm.Attribute` |
| CORE-18 | ALWAYS observe attribute changes via `hsm.When` / `hsm.OnSet` (attributes only) |
| CORE-19 | NEVER mutate state/context/attributes from ordinary methods |
| CORE-20 | ALWAYS mutate only via transitions (internal transitions when no state change) |
| CORE-21 | NEVER allow ambiguous multi-match transitions without deterministic priority |
| CORE-22 | NEVER emit events implicitly from guards/effects/entry/exit as hidden side channels |
| CORE-23 | ALWAYS define explicit behavior for unhandled events (ignore / defer / error) — NEVER silent drop |
| CORE-24 | NEVER let submachines mutate each other’s context — events only |
| CORE-25 | NEVER manage timeouts outside the machine |
| CORE-26 | NEVER rely on nondeterministic inputs inside transition logic — inject clock/random/IO |
| CORE-27 | ALWAYS emit observable/traceable transition for every state change |
| CORE-28 | NEVER allow re-entrancy during a single step — **run-to-completion** |

### 2.2 DSL structural constraints (`dsl.md`)

| ID | Rule |
|----|------|
| DSL-01 | Models built with namespace-level `hsm.Define` / PascalCase DSL (cross-language) |
| DSL-02 | Names must not contain `/` (model, state, final, history, choice, ops, attrs) |
| DSL-03 | **No parallel regions** — use submachines |
| DSL-04 | `Choice` must have outgoing transitions; last should be unguarded fallback |
| DSL-05 | History (shallow/deep) needs default partials/target |
| DSL-06 | Final states are absorbing — no outgoing transitions / behaviors |
| DSL-07 | Timing triggers: `After`/`Every`/`At` only on real state sources |

---

## 3. hsm.go numbered rules (HSM01–HSM54 core + grantt HSM55–HSM98 themes)

### 3.1 Structure & initial

| ID | Rule |
|----|------|
| HSM01 | ALWAYS top-level `hsm.Initial(...)` for every model |
| HSM02 | ALWAYS explicit `Initial` for composite that should auto-enter nested substate |
| HSM03–04 | NEVER entry/exit on top-level machine |
| HSM05 | Initial target must nest under owner of that initial |
| HSM06 | NEVER guard on initial transition |
| HSM07 | NEVER more than one outgoing from initial |
| HSM08 | Source/Target/On/OnSet/OnCall/After/Every/When/Guard/Effect only inside `Transition` |
| HSM09 | Entry/Exit/Activity/Defer only inside `State` |
| HSM10 | NEVER bare triggerless transition expecting implicit completion — not implemented |
| HSM11 | ALWAYS explicit `CompletionEventKind` for entry/exit/activity follow-on protocol |
| HSM12 | NEVER wildcard event name strings — explicit events or `AnyEvent` |
| HSM13–14 | `On(AnyEvent)` only as catch-all; specific events win |
| HSM15 | Same-event transitions: highest-priority guarded → fallback; first pass wins |
| HSM16–18 | Conditional branching via `Choice`; never empty; last unguarded default |
| HSM19 | Valid relative/absolute paths; every vertex exists |
| HSM20 | Top-level transition must have both ends or neither |
| HSM21 | Internal transition MUST have `Effect` |
| HSM49–51 | Final: no transitions/activities/entry/exit; history inside composite only; history fallback when needed |
| HSM47 | Decompose to prevent state explosion |
| HSM48 | `Defer` for events waiting until leave state |

### 3.2 Data, attributes, identity

| ID | Rule |
|----|------|
| HSM22 | NEVER read/mutate internal context/state from outside |
| HSM23–25 | Expose via `Attribute` Get/Set; never durable state in `context.Context`; move external data in via events/attributes |
| HSM26 | Request/response via event payloads (channels in payload OK) |
| HSM27–28 | NEVER mutex for normal RTC context access; prefer events/attributes/transitions |
| HSM29–35 | Set/OnSet/Call/Operation naming and uniqueness rules; empty names forbidden; define Operation before OnCall |
| HSM39–41 | `ID()` for unique identity; `Name()` is model name only; `QualifiedName`/`State` for paths |

### 3.3 Dispatch, context lifetime, activities, time

| ID | Rule |
|----|------|
| HSM36–38 | Fire-and-forget: machine context vs `Background` vs transient behavior ctx — choose intentionally |
| HSM42–43 | After/Every/When only from real states; no negative duration if expected to fire |
| HSM44–46 | Activity = long-running only; not short sync work; must respect `ctx.Done()` promptly |
| HSM52 | Guard `AnyEvent` against internal lifecycle events unless intentional |
| HSM53 | Wait on channels from Dispatch/Set/Restart/Stop/DispatchAll/DispatchTo before asserting |
| HSM54 | NEVER use AfterProcess/AfterDispatch/AfterEntry/AfterExit/AfterExecuted as production sync |

### 3.4 Grantt policy overlays (CLAUDE + hsm.rules HSM80+)

| ID | Rule |
|----|------|
| G-COMP | Advance transient states with **`CompletionEventKind`** from entry/activity — never switch on state snapshots / nondeterministic process state |
| G-ERR | Failure progression uses **`ErrorEventKind`** when machine-owned error |
| G-BRANCH | Behavior must not choose among multiple transition-driving events with if/switch/loops/tables; one typed completion/error + `Choice`/guards |
| G-TIME | Behavior-owned time: `After`/`At`/`Every` only — not `time.After`, sleep, ticker inside behavior |
| G-NAME | New files/types/symbols/models named for **domain/lifecycle** — never `hsm_` prefix or `_hsm` suffix |
| G-PRIM | Prefer native primitives (`Defer`, timers, `Choice`, submachine, DispatchAll/To) before custom queues/replay buffers |
| G-DET | Dispatch-critical logic must not read wall clock, random, FS, network, env directly |
| G-OWN | Do not fake ownership boundaries by post-filtering `TakeSnapshot` tool lists — put ownership in HSM state/participants |
| G-TEST | Default real runtime/E2E; wait Dispatch channels in tests (HSM53) |

---

## 4. emel / stateforward.SML hard rules (dialect `sml.cpp`)

Authoritative: `docs/rules/sml.rules.md` wins over `AGENTS.md` on conflict.

### 4.1 Core invariants

| ID | Rule |
|----|------|
| SML-RTC | Top-level dispatch returns only at quiescence (including anonymous/completion chains) |
| SML-NQ | NEVER `process_queue`, `defer_queue`, mailbox, post-for-later |
| SML-DET | Identical initial + events + payloads ⇒ identical action/state sequence |
| SML-SW | Single-writer per actor during RTC |
| SML-ALLOC | NEVER dynamic allocation during dispatch (guards/actions/entry/exit/anonymous) |
| SML-BOUND | Provable upper bound on transitions and work per top-level dispatch |
| SML-CORO | Async/coroutine dispatch OK only if completion handle is explicit and no hidden deferred work |

### 4.2 Actions / guards / control flow

| ID | Rule |
|----|------|
| SML-G1 | Guards pure predicates of `(event, context)` — no side effects, no wall clock |
| SML-A1 | Actions bounded; no I/O waits, mutex waits, sleeps (limited RTC fork/join exception documented) |
| SML-A2 | NEVER runtime branching in actions, SM member methods, or their callees (`if`/`switch`/`?:`) |
| SML-A3 | NEVER emulate branching with single-pass/case loops or runtime handler tables |
| SML-A4 | Runtime behavior selection = guards + explicit transitions/choices only |
| SML-A5 | Moving `if` from actions into detail helpers is still a violation if helper chooses path |
| SML-D1 | detail helpers: shared non-control-flow only; used >1; no routing verbs; no “what happens next” |
| SML-RE | NEVER call own `process_event` from guard/action/entry/exit |
| SML-COMP | Internal multi-step via `completion<TEvent>` / anonymous / entry — phase-level, bounded, not per-element loops |
| SML-UE | Unexpected events: `sml::unexpected_event` — never silent drop; don’t misuse internal_event guards |

### 4.3 Events / context / composition

| ID | Rule |
|----|------|
| SML-E1 | Public events immutable/small; required fields as references; no owning dynamic containers on hot path |
| SML-E2 | Per-dispatch data via typed internal events — not context mirrors |
| SML-C1 | Context = persistent actor-owned only; empty if none; never phase/step/request/error scratch |
| SML-C2 | NEVER mutate context in guards; NEVER read/write context from SM member functions directly |
| SML-X1 | Cross-machine: events + `process_event` only; no direct action/guard/context poke |
| SML-X2 | Callbacks immediate same-RTC only; never store; never process_event inside callback |
| SML-T1 | External scheduler drives actors; time enters only as event payload |
| SML-TT | Transition tables destination-first `dst <= src + event [guard] / action`; leading commas; no macros |

### 4.4 emel layout / naming (project-specific)

- Component files: `any`, `context`, `actions`, `guards`, `errors`, `events`, `sm`, `detail`
- Prefixes: `state_`, `event_`, `guard_`, `effect_`, `enter_`, `exit_` for new SM symbols
- Domain boundaries / no model-family leaks (whisper etc.) — run domain boundary scripts when relevant
- Kernel owns numeric ops; higher layers orchestrate only

---

## 5. Positive patterns (from mjw)

Treat as **good examples** when reviewing Go HSM:

- `hsm.Define` + nested `State` + `Initial` + `Choice` + `Guard` + `Effect`
- `Activity` for connection listen loops with cancellation
- Completion events: `hsm.Event{Kind: hsm.CompletionEventKind, ...}`
- Domain-named models (`ConnectionModel`, client model) without `*_hsm` suffix
- Subsystem split across packages rather than one mega-machine

Anti-patterns to flag when seen opposite of above.

---

## 6. Review procedure (what the MDScript skill should do)

Proposed states for later `gabe-hsm-review` MDILL:

1. **Identify scope** — paths, dialect, project policy files present  
2. **Load rule packs** — CORE + dialect (hsm.go rules and/or sml.rules) + project overlays  
3. **Inventory machines** — every `Define` / `sm<model>` / transition table  
4. **Structural audit** — initials, choice fallbacks, finals, history, paths, naming  
5. **Control-flow audit** — branch in behavior? completion kinds? timers outside machine?  
6. **Concurrency audit** — mutex/atomics that should be HSM; queues; re-entrancy; parallel regions  
7. **Data/boundary audit** — external mutation, context abuse, cross-machine poke, attribute use  
8. **Time/determinism audit** — wall clock, sleep, random, env in dispatch-critical paths  
9. **Test/proof audit** — Dispatch channel waits, RTC/no-alloc tests (SML), real-path tests (grantt)  
10. **Version/deps audit** (grantt) — hsm.go pin  
11. **Emit findings** — P0–P3 with rule IDs  
12. **Verdict** — pass only if no blocking findings (or waived)

Checks should be **executable where possible** (rg/ast-grep patterns), not vibes:

### Suggested automated greps (hsm.go)

```text
# timers outside machine inside likely behavior files
time\.(Sleep|After|NewTicker|Tick)\(

# mutex smell near lifecycle
sync\.(Mutex|RWMutex)|atomic\.

# completion kind missing on follow-ups (heuristic)
Kind:\s*hsm\.EventKind|// TODO.*complet

# bad naming
type\s+\w*[Hh]sm\w*|hsm_\w+|_hsm\.go

# if/switch in effects/entry (heuristic — needs human confirm)
```

### Suggested automated greps (sml.cpp)

```text
process_queue|defer_queue
process_event\(
if\s*\(|switch\s*\(|\?.*:   # inside actions.hpp / detail — confirm manually
std::string|std::vector     # in events on hot path
sml::event<sml::_>
```

---

## 7. Open questions for you (before MDScript)

1. **Dialect default:** Should `gabe-hsm-review` auto-detect only, or require explicit `hsm.go` vs `sml.cpp`?
2. **Severity:** Confirm P0–P2 all block (like gabe-goal) or only P0–P1?
3. **Scope of “pure guards/effects”:** `hsm/AGENTS.md` says no side effects in effects/entry/exit; grantt allows dispatching CompletionEventKind from entry/activity. Treat **dispatch of machine-owned completion/error events** as allowed exception?
4. **JS HSM rules** (static model, absolute paths, namespace import) — fold in as third dialect `hsm.js`?
5. **grantt-only pins** (v1.3.1, NATS actor mandate) — always-on when `go.mod` path under grantt, else skip?
6. **Output artifact:** findings JSON + markdown under run dir, or just chat + optional file?
7. **Relation to gabe-review:** standalone skill vs check pack invoked from gabe-review?

---

## 8. Proposed skill shape (after approval)

```text
skills/gabe-hsm-review/
  SKILL.md                          # MDScript entry
  workflows/
    identify-scope.md
    load-rule-packs.md
    inventory-machines.md
    audit-structure.md
    audit-control-flow.md
    audit-concurrency.md
    audit-data-boundaries.md
    audit-time-determinism.md
    audit-tests-and-deps.md
    emit-findings.md
  references/
    hsm-core-rules.md               # distilled CORE + DSL
    hsm-go-rules.md                 # HSM01–54 + grantt overlays
    sml-cpp-rules.md                # SML invariants + emel layout
    check-patterns.md               # rg/ast patterns
  scratch-hsm-requirements.md       # this file
```

No Cursor adapter planned unless you want stop-hook style enforcement later.

---

## 9. Non-goals (for this skill)

- Rewriting machines (that’s implement lane)
- Full UML compliance beyond stateforward dialect
- Replacing package-native quality gates (emel `quality_gates.sh`, grantt `quality_gate.sh`) — skill **adds** adversarial HSM review, doesn’t replace CI
- Soft style nits outside listed P3s

---

*End of scratch. Next: you mark edits / answers to §7, then we write MDScript.*


## Update (UML-first)

Primary standard is now UML 2.5 via `references/hsm-core-rules.md`. Framework rules are secondary bindings only.
