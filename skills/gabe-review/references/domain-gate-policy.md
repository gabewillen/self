# Domain gate policy

Hold these require/reject rules while applying domain gates. The packet workflow classifies the artifact, then adds a finding for each unmet require or violated reject.

## Skill, instruction, validator, scorer, harness, or agent workflow

Claim: future agents will behave correctly.

**Require**

- executable or black-box proof against exact contract fields and current durable artifacts

**Reject**

- source inspection alone
- coached prompts
- substring matches
- keyword hits
- author-written examples as sole proof

## Model training, data extraction, eval harnesses, or adapter selection

**Require**

- current source-corpus identity
- structured decision-case or held-out eval contracts
- provenance
- fail-closed blockers for stale sources, missing adapters, empty artifacts, or promotion claims unsupported by real candidate proof

## Dependency, provider, release, hardware path, runtime backend, or patch-level swap

Applies when API shape stayed similar.

**Require**

- actual runtime path, platform, package diff
- owner-surface contract
- known-good fallback
- rollout state
- release or merge owner
- upstream/downstream cause separation when a resolver, adapter, dashboard, eval, or review surface could mask the source failure

**Reject as production/live-proof acceptance**

- local green proof alone
- unchanged names alone
- successful setup evidence alone

## Subtree, vendored import, embedded repository, mirror, or source-sync

**Require**

- source-owning repository and intended source baseline explicit and current

**Treat as source-health only**

- parent or integration checkout sync, unless upstream owner review, CI, history decision, and release or merge record prove a broader claim

**Reject**

- resolving local overlays, divergent histories, or child-source conflicts in the parent checkout when that would bypass the source owner or choose history on the owner's behalf

## Narration vs owner records

Applies when model narration, transcript text, digests, summaries, or inferred labels compete with typed product state, tool logs, tracker state, review state, metrics, dashboards, or other owner records.

**Require**

- the owner record decides or mutates state
- narrative may explain only when bound to that record

## Observation-only, telemetry-only, shadow-mode, dry-run, or measurement-first

**Require the contract to prove**

- what data is observed
- what inputs are snapshotted
- what delivery, mutation, user-facing, or downstream side effects are excluded
- which broader delivery or live-proof gates remain outside the claim

**Reject**

- observation proof that reads mutable live state after the boundary
- silent downstream actions
- reporting source-health evidence as caller-facing, delivery, deployment, or live-proof readiness

## Delegated model, adapter, subagent, navigator, or autonomous-driver work

**Require**

- chosen runtime or agent identity explicit, current, visible at the owning control surface, and bound to the authority grant
- setup failures, missing credentials, hidden or ineligible agents, unavailable adapters, stale cursors, and normal-stop handoffs fail closed or route through the same owner-input path a human would use

**Reject**

- silent fallback from a requested local model, hosted model, adapter, navigator, driver, or helper agent to a more convenient substitute
