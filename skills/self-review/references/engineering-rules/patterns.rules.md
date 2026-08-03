# PAT-ACTOR-001 MUST Actor State Ownership

See:
- [CORE-CONC-001](core.rules.md#core-conc-001-must-thread-safety)
- [CORE-MEM-001](core.rules.md#core-mem-001-must-explicit-ownership)

Actors MUST exclusively own their mutable state.

Actors MUST NOT directly mutate another actor's state.

Cross-actor communication MUST occur through explicit messages, events, or snapshots.

# PAT-RTC-001 MUST Run To Completion Dispatch

See:
- [CORE-WORK-001](core.rules.md#core-work-001-must-bounded-runtime-work)
- [PAT-ACTOR-001](#pat-actor-001-must-actor-state-ownership)

A run-to-completion dispatch MUST process one event to quiescence before the next event mutates the same actor or machine.

Internal transitions and completion events MUST be bounded.

# PAT-HSM-001 MUST Explicit Hierarchical State Modeling

See:
- [CORE-STATE-001](core.rules.md#core-state-001-must-single-source-of-truth)
- [PAT-RTC-001](#pat-rtc-001-must-run-to-completion-dispatch)

Hierarchical state machines MUST represent behavioral modes as states and transitions.

Behavioral branching MUST be modeled with transitions, guards, choices, or explicit events rather than hidden routing inside actions.

# PAT-HSM-002 MUST Model Behavior Explicitly In The Graph

See:
- [PAT-HSM-001](#pat-hsm-001-must-explicit-hierarchical-state-modeling)
- [PAT-ASYNC-002](#pat-async-002-must-decompose-multi-step-async-work-into-states)
- [PAT-GUARD-002](#pat-guard-002-must-prefer-states-over-guards-for-action-gating)

All meaningful behavior MUST be explicit in the state machine graph.

States, transitions, guards, choices, and typed events MUST carry modes, sequencing, branching, waiting, retries, cancellation, and allowed actions.

Entry actions, exit actions, effects, and activities MUST NOT hide control flow, next-step selection, or multi-phase workflows.

# PAT-HSM-003 MUST Lift Shared Workflow Behavior Into Parents

See:
- [PAT-HSM-001](#pat-hsm-001-must-explicit-hierarchical-state-modeling)
- [PAT-HSM-002](#pat-hsm-002-must-model-behavior-explicitly-in-the-graph)

Multi-step workflows MUST be nested under a hierarchical parent/composite state.

Shared workflow handlers such as defer, cancel, abort, timeout, and common completion routing MUST live on that parent.

Sibling step states MUST NOT copy the same defer or shared transition/handler a parent can own.

# PAT-GUARD-001 MUST Pure Guards

See:
- [CORE-DET-001](core.rules.md#core-det-001-must-deterministic-behavior)

Guards MUST be pure predicates.

Guards MUST NOT perform I/O, mutate state, allocate unexpectedly, or trigger side effects.

# PAT-GUARD-002 MUST Prefer States Over Guards For Action Gating

See:
- [PAT-HSM-001](#pat-hsm-001-must-explicit-hierarchical-state-modeling)
- [PAT-GUARD-001](#pat-guard-001-must-pure-guards)

Guards MUST only prevent transitions.

States MUST be preferred over guards for preventing actions or selecting which behavior may run.

When multiple transitions from the same source require multiple guards to choose outcomes or allowed actions, the design MUST use an explicit state instead of a multi-guard fan-out.

# PAT-EVENT-001 MUST Typed Event Boundaries

See:
- [CORE-API-001](core.rules.md#core-api-001-must-explicit-api-contracts)
- [CORE-SEC-001](core.rules.md#core-sec-001-must-validate-untrusted-input)

Events crossing actor, machine, process, or transport boundaries MUST be typed or validated before dispatch.

Event payload ownership and lifetime MUST be explicit.

# PAT-ASYNC-001 MUST Async Work Return Events

See:
- [CORE-BOUND-001](core.rules.md#core-bound-001-must-explicit-platform-boundaries)
- [PAT-RTC-001](#pat-rtc-001-must-run-to-completion-dispatch)

Asynchronous work started by a state machine or actor MUST report completion, cancellation, and failure through explicit events or messages.

Async work MUST have an owner and cancellation path.

# PAT-ASYNC-002 MUST Decompose Multi-Step Async Work Into States

See:
- [PAT-HSM-001](#pat-hsm-001-must-explicit-hierarchical-state-modeling)
- [PAT-ASYNC-001](#pat-async-001-must-async-work-return-events)

Multi-step asynchronous or long-running work MUST be modeled as a state sequence.

Activities MUST NOT hide sequential phases, retries, handoffs, or alternative next steps inside one body.

Progression between those steps MUST be driven by typed completion events (and error events), not internal activity control flow.

# PAT-SNAPSHOT-001 MUST Snapshot Observation

See:
- [CORE-STATE-001](core.rules.md#core-state-001-must-single-source-of-truth)

External observers MUST observe actors and machines through snapshots, subscriptions, or query APIs.

External code MUST NOT inspect internal state to drive hidden workflow progression.
