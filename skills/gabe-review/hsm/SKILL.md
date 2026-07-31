---
name: gabe-review-hsm
description: "ALWAYS use this skill when the gabe-review hsm blind lane audits hierarchical state machines: apply UML 2.5 ownership, actor/RTC, control-flow, purity, activity, hierarchy, and reachability gates via mdscript-exec on this internal pack (not a top-level agent skill)."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage

* set `{{skill_root}}` to this skill directory
* set `{{repo_root}}` to the working repository root, or the path the user named
* run [Resolve Agent Home](../../gabe-common/workflows/agent-home.md#resolve-agent-home)
* set `{{review_scope}}` from the user request; if empty, default to the working diff
* set `{{full_sweep}}` to `true` only if the user asked for a complete or whole-tree review
* read [anti-patterns.md](references/anti-patterns.md) and hold it for every gate
* run [Triage](workflows/triage.mdscript.md#triage)
* if `{{machine_inventory}}` is empty and no changed component qualifies under the ownership gate
  * stop and report `n/a`: nothing in scope owns state
* if `{{full_sweep}}` is not `true`
  * narrow `{{machine_inventory}}` to machines the change touches
* [Gate 0 Ownership](#gate-0-ownership)

## Gate 0 Ownership

* run [Audit Ownership](workflows/audit-ownership.mdscript.md#audit-ownership)
* if any finding was recorded
  * [Verify](#verify)
* if `{{machine_inventory}}` is empty
  * stop and report `n/a`: no machine changed
* [Gate 1 Graph](#gate-1-graph)

## Gate 1 Graph

* run [Extract Model](workflows/extract-model.mdscript.md#extract-model)
* run [Audit Structure](workflows/audit-structure.mdscript.md#audit-structure)
* run [Audit Reachability](workflows/audit-reachability.mdscript.md#audit-reachability)
* if any finding was recorded
  * [Verify](#verify)
* [Gate 2 Actor Boundary](#gate-2-actor-boundary)

## Gate 2 Actor Boundary

* run [Audit Actor Boundary](workflows/audit-actor-boundary.mdscript.md#audit-actor-boundary)
* if any finding was recorded
  * [Verify](#verify)
* [Gate 3 Behavior](#gate-3-behavior)

## Gate 3 Behavior

* run [Audit Control Flow](workflows/audit-control-flow.mdscript.md#audit-control-flow)
* run [Audit Time And Determinism](workflows/audit-time-determinism.mdscript.md#audit-time-and-determinism)
* if any finding was recorded
  * [Verify](#verify)
* [Gate 4 Design](#gate-4-design)

## Gate 4 Design

* run [Audit Hierarchy](workflows/audit-hierarchy.mdscript.md#audit-hierarchy)
* run [Audit Tests](workflows/audit-tests.mdscript.md#audit-tests)
* [Verify](#verify)

## Verify

* run [Verify Findings](workflows/verify-findings.mdscript.md#verify-findings)
* [Emit Findings](#emit-findings)

## Emit Findings

* run [Emit Findings](workflows/emit-findings.mdscript.md#emit-findings)
* if `{{blocking_count}}` is greater than zero and `{{waiver_requested}}` is not `true`
  * [Request Waiver](#request-waiver)
* if `{{blocking_count}}` is greater than zero
  * set `{{verdict}}` to `fail`
  * stop and report `fail`, the gate that stopped, counts by severity, top findings, waivers, and `{{findings_path}}`
* set `{{verdict}}` to `pass`
* stop and report `pass`, the last gate reached, refuted findings, waivers, and `{{findings_path}}`

## Request Waiver

* set `{{waiver_requested}}` to `true`
* if the user already named waived rule ids, set `{{waived_rule_ids}}` and [Emit Findings](#emit-findings)
* run [Request Waiver](workflows/request-waiver.mdscript.md#request-waiver)
