<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage

* set `{{skill_root}}` to this skill directory
* set `{{review_skill_root}}` to the installed self-review skill root
* set `{{repo_root}}` to the current repository root, or to the path that the user named
* run [Resolve Agent Home](../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{review_scope}}` from the user request
* if `{{review_scope}}` is empty
  * set `{{review_scope}}` to the current diff
* if the user asked for a complete or whole-tree review
  * set `{{full_sweep}}` to `true`
* read [anti-patterns.md](references/anti-patterns.md)
* use these anti-patterns in all gates
* run [Triage](workflows/triage.mdscript.md#triage)
* if `{{full_sweep}}` is not `true`
  * remove from `{{machine_inventory}}` each machine that the change does not touch
* [Gate 0 Ownership](#gate-0-ownership)

## Gate 0 Ownership

* run [Audit Ownership](workflows/audit-ownership.mdscript.md#audit-ownership)
* if an audit in this gate recorded a finding
  * [Verify](#verify)
* [Gate 1 Graph](#gate-1-graph)

## Gate 1 Graph

* run [Extract Model](workflows/extract-model.mdscript.md#extract-model)
* run [Audit Structure](workflows/audit-structure.mdscript.md#audit-structure)
* run [Audit Reachability](workflows/audit-reachability.mdscript.md#audit-reachability)
* if an audit in this gate recorded a finding
  * [Verify](#verify)
* [Gate 2 Actor Boundary](#gate-2-actor-boundary)

## Gate 2 Actor Boundary

* run [Audit Actor Boundary](workflows/audit-actor-boundary.mdscript.md#audit-actor-boundary)
* if an audit in this gate recorded a finding
  * [Verify](#verify)
* [Gate 3 Behavior](#gate-3-behavior)

## Gate 3 Behavior

* run [Audit Control Flow](workflows/audit-control-flow.mdscript.md#audit-control-flow)
* run [Audit Time And Determinism](workflows/audit-time-determinism.mdscript.md#audit-time-and-determinism)
* if an audit in this gate recorded a finding
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
  * report `fail`, the gate that stopped, the counts by severity, the top findings, the waivers, and `{{findings_path}}`
  * stop
* set `{{verdict}}` to `pass`
* report `pass`, the last gate that the review reached, the refuted findings, the waivers, and `{{findings_path}}`
* stop

## Request Waiver

* set `{{waiver_requested}}` to `true`
* if the user already named the waived rule ids
  * set `{{waived_rule_ids}}` to those rule ids
  * [Emit Findings](#emit-findings)
* run [Request Waiver](workflows/request-waiver.mdscript.md#request-waiver)
