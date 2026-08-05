# CORE-DET-001 MUST Deterministic Behavior

Systems MUST produce identical observable behavior when provided identical inputs, initial state, configuration, and runtime environment.

Runtime code MUST NOT depend on hidden mutable global state, ambient clocks, random sources, or external systems except through explicit boundaries.

# CORE-MEM-001 MUST Explicit Ownership

Ownership and lifetime MUST be obvious from code.

Mutable state, resources, tasks, subscriptions, and handles MUST have a clearly defined owner.

Hidden ownership transfer is forbidden.

# CORE-WORK-001 MUST Bounded Runtime Work

Runtime execution paths MUST have a provable upper bound.

Unbounded loops, recursion, retries, queues, waits, or retries-until-success are forbidden.

# CORE-CONC-001 MUST Thread Safety

Mutable state MUST have exactly one logical writer or a documented synchronization contract.

Data races are release-blocking defects.

# CORE-STATE-001 MUST Single Source Of Truth

Each fact MUST have one source of truth.

Derived state SHOULD be computed from source state instead of stored and synchronized.

Impossible states SHOULD be made unrepresentable.

# CORE-ERR-001 MUST Explicit Failure Handling

Expected failures MUST be represented explicitly with result types, status values, error objects, or domain failure states.

Silent failure handling is forbidden.

# CORE-API-001 MUST Explicit API Contracts

Public APIs MUST document inputs, outputs, ownership, lifetime, concurrency safety, failure modes, and units.

Boundary APIs MUST classify initialization-only, runtime-safe, and external-system behavior.

# CORE-GEN-001 MUST Prefer Agnostic Mechanisms Over Ad-Hoc Special Cases

When a contract applies to a whole class of values (every event schema, every serialization hop, every selection), the fix MUST live on the shared mechanism.

Ad-hoc branches, name checks, or one-product rebuilds that only make a single case work are forbidden when a typed schema, shared projection, or common validator already owns the boundary.

Ceremony-only helpers that merely rename an obvious construction of an existing type MUST NOT be introduced; write the construction at the call site or fix the generic path.

# CORE-BOUND-001 MUST Explicit Platform Boundaries

Filesystems, networks, clocks, random sources, environment variables, operating systems, hardware, and external services MUST be isolated behind explicit boundary layers.

Core logic MUST receive external data as inputs instead of reading external systems directly.

# CORE-CFG-001 MUST Prefer Explicit Flags Over Environment Variables

A setting a user is expected to choose MUST be reachable as an explicit command flag.

An environment variable MAY carry the same setting.

When a flag and an environment variable name the same setting, the flag MUST take precedence.

# CORE-SEC-001 MUST Validate Untrusted Input

All untrusted input MUST be validated before use.

Secrets MUST NOT be stored in source control, logged, embedded in client code, or exposed through diagnostics.

# CORE-BUILD-001 MUST Reproducible Toolchains

Toolchains, language versions, generators, and package managers MUST be pinned or otherwise reproducible.

Build outputs SHOULD be reproducible from committed sources.

# CORE-TEST-001 MUST Deterministic Tests

Tests MUST be deterministic and hermetic.

Tests MUST NOT depend on wall-clock sleeps, live networks, ambient filesystems, or external mutable state unless the test is explicitly classified as an integration boundary test.

# CORE-PERF-001 MUST Measure Performance Claims

Performance claims MUST be measured.

Optimization decisions MUST be justified with profiling, benchmarks, or production telemetry.

# CORE-OBS-001 MUST OpenTelemetry Telemetry

Telemetry via OpenTelemetry (OTEL) is non-negotiable for code implementation.

Runtime and service code MUST emit telemetry through OpenTelemetry APIs for the changed control paths, failure paths, and external boundaries.

Implementers MUST NOT complete code work without OTEL instrumentation covering those paths, and MUST NOT substitute a non-OTEL custom telemetry stack for the same signals when an OTEL API or SDK exists for the language.

Logging, tracing, metrics, and diagnostics MUST be bounded, non-blocking, and cardinality-controlled.

See:
- [CORE-OBS-002](core.rules.md#core-obs-002-must-analyze-telemetry-cardinality)

Diagnostics MUST NOT change functional behavior.

# CORE-OBS-002 MUST Analyze Telemetry Cardinality

Cardinality MUST be analyzed for every new or changed OpenTelemetry (OTEL) signal.

Implementers and reviewers MUST analyze metric dimensions, span attributes, resource attributes, log attributes, and event labels for each OTEL instrumentation change.

The analysis MUST state whether each label or attribute key is bounded or unbounded, identify high-cardinality or unbounded keys (for example request ids, user ids, free text, raw URLs, or timestamps used as labels), and bound or reject unbounded dimensions before ship.

Missing cardinality analysis for OTEL instrumentation is a release-blocking defect.

# CORE-DOC-001 MUST NOT Keep Change History In Comments And Docs

Comments, docstrings, and documentation MUST state the contract that governs the code now.

Change history MUST NOT be carried in comments or documentation. Prior revisions, earlier attempts, what a previous author tried, and what changed and when belong to version control, which preserves them.

# CORE-EXC-001 MUST Document Rule Exceptions

Rule exceptions MUST identify the violated rule, owner, rationale, tests covering the risk, expiration condition, and removal plan.

Temporary exceptions MUST expire.
