# stateforward.SML / emel.cpp rules

Authoritative: `docs/rules/sml.rules.md` (wins over AGENTS.md).

## Invariants

| ID | Sev | Rule |
|----|-----|------|
| SML-RTC | P0 | Dispatch returns at quiescence |
| SML-NQ | P0 | No process_queue / defer_queue / mailbox |
| SML-DET | P0 | Deterministic given same inputs |
| SML-SW | P0 | Single-writer per actor in RTC |
| SML-ALLOC | P0 | No heap during dispatch |
| SML-BOUND | P0 | Bounded transitions/work per dispatch |
| SML-CORO | P0 | Async OK only with explicit completion handle, no hidden defer |

## Actions / guards

| ID | Sev | Rule |
|----|-----|------|
| SML-G1 | P0 | Guards pure (event, context); no wall clock |
| SML-A1 | P0 | Actions bounded; no I/O/mutex/sleep waits |
| SML-A2 | P0 | No runtime if/switch/?: in actions/members/callees |
| SML-A3 | P0 | No branch-emulating loops or handler tables |
| SML-A4 | P0 | Behavior selection only via guards/transitions |
| SML-A5 | P0 | Moving branch into detail helper still fails |
| SML-D1 | P0 | detail = shared non-routing helpers only |
| SML-RE | P0 | Never self process_event from behavior |
| SML-COMP | P0 | completion/anonymous phase-level only, not per-element |
| SML-UE | P1 | unexpected_event — never silent drop |

## Events / context / composition

| ID | Sev | Rule |
|----|-----|------|
| SML-E1 | P1 | Public events small/immutable; refs for required fields |
| SML-E2 | P1 | Per-dispatch data via typed internal events |
| SML-C1 | P1 | Context persistent only — no phase/request scratch |
| SML-C2 | P0 | No context mutate in guards; no direct SM member context IO |
| SML-X1 | P0 | Cross-machine via process_event only |
| SML-X2 | P0 | Callbacks same-RTC only; never store; never process_event inside |
| SML-T1 | P0 | External scheduler; time as event payload |
| SML-TT | P1 | Destination-first `dst <= src + event [guard] / action` |

## emel layout (overlay)

- Files: `context`, `actions`, `guards`, `events`, `errors`, `sm`, `detail`, `any`
- New symbols: `state_`, `event_`, `guard_`, `effect_`, `enter_`, `exit_`
- Kernel owns numeric ops; domains don’t leak model-family roots
