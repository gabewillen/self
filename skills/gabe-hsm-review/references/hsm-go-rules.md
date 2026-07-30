# hsm.go + grantt overlay rules

Sources: `hsm.go/rules.md` (HSM01–54), grantt `.agents/rules/hsm.rules.md` / CLAUDE.md.

## When HSM is mandatory (grantt overlay)

| ID | Sev | Rule |
|----|-----|------|
| G-REQ | P0 | HSM required if mutex/atomics lifecycle, actor, or NATS consumer/producer |
| G-NOT | P2 | Do not wrap pure stateless utilities in HSM |
| G-LIB | P0 | Only `github.com/stateforward/hsm.go` — no substitutes |
| G-PIN | P0 | grantt: every go.mod requiring hsm.go must be exactly `v1.3.1`, no replace |

## Structure (selected)

| ID | Sev | Rule |
|----|-----|------|
| HSM01 | P0 | Top-level `Initial` required |
| HSM02 | P1 | Composite auto-entry needs nested `Initial` |
| HSM03-04 | P1 | No entry/exit on top-level machine |
| HSM06-07 | P0 | No guard on initial; single outgoing initial |
| HSM10 | P0 | No implicit completion transitions |
| HSM11 | P0 | Explicit `CompletionEventKind` for progression from entry/activity |
| HSM12-14 | P1 | No wildcard strings; `AnyEvent` catch-all only; specific wins |
| HSM15 | P1 | Same-event order: guarded priority then fallback |
| HSM16-18 | P0 | `Choice` required for branches; last unguarded default |
| HSM21 | P1 | Internal transition needs `Effect` |
| HSM47-48 | P2/P1 | Decompose; use `Defer` |
| HSM49-51 | P1 | Final/history constraints |

## Data / RTC

| ID | Sev | Rule |
|----|-----|------|
| HSM22-25 | P0/P1 | No external mutate; attributes not context.Context durable state |
| HSM27-28 | P0 | No mutex for normal RTC context |
| HSM36-38 | P1 | Fire-and-forget context lifetime intentional |
| HSM44-46 | P2/P1 | Activity = long-running; honor `ctx.Done()` |
| HSM52 | P1 | Guard `AnyEvent` vs internal lifecycle |
| HSM53 | P1 | Tests wait Dispatch/Set/Stop channels |
| HSM54 | P0 | No AfterProcess/AfterEntry as production sync |

## Grantt policy overlays

| ID | Sev | Rule |
|----|-----|------|
| G-COMP | P0 | Advance with CompletionEventKind — not state snapshot switching |
| G-ERR | P1 | Machine-owned failures use ErrorEventKind |
| G-BRANCH | P0 | No if/switch choosing among transition-driving events |
| G-TIME | P0 | After/At/Every only — not time.Sleep/After/ticker in behavior |
| G-NAME | P2 | Domain/lifecycle names — never `hsm_` / `_hsm` |
| G-PRIM | P1 | Native Defer/timers/Choice/submachine before custom queues |
| G-DET | P1 | No wall clock/random/FS/net/env in dispatch-critical logic |
| G-OWN | P1 | Ownership in HSM model — not post-filter TakeSnapshot lists |

## Allowed exception

Machine-owned **single** completion/error event dispatch from entry/activity/effect is allowed when kind is correct. Still forbidden: branching dispatch, external I/O, and hidden multi-event choice tables in behavior.
