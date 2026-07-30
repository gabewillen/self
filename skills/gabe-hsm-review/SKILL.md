---
name: gabe-hsm-review
description: >-
  Adversarially review hierarchical state machines against UML 2.5 semantics
  (framework-agnostic): explicit guards/choice control flow, side-effect-free
  guards/entry/exit/effects, activities for long-running/async work, and
  hierarchy to eliminate duplicate same-event transitions. Use for
  /gabe-hsm-review, statechart design review, or before merge when HSM control
  flow must stay in the graph rather than in behavior code.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Parse Review Request

* set `{{skill_root}}` to this skill directory
* set `{{repo_root}}` to the working repository root (or the path the user named)
* set `{{review_scope}}` from the user request (paths, packages, PR, or “whole tree”)
* if `{{review_scope}}` is empty
  * ask the user which paths or packages to review as `{{review_scope}}`
  * [Parse Review Request](#parse-review-request)
* set `{{findings}}` to an empty list
* set `{{blocking_severities}}` to `P0,P1,P2` unless the user narrowed severity
* set `{{semantic_standard}}` to `UML 2.5`
* set `{{framework_agnostic}}` to `true`
* run [Identify Scope](workflows/identify-scope.mdscript.md#identify-scope)
* run [Load Rule Packs](workflows/load-rule-packs.mdscript.md#load-rule-packs)
* [Inventory Machines](#inventory-machines)

## Inventory Machines

* run [Inventory Machines](workflows/inventory-machines.mdscript.md#inventory-machines)
* if `{{machine_inventory}}` is empty
  * record a `P1` finding: no state machines / statecharts found in scope (or scope missed)
  * [Emit Findings](#emit-findings)
* [Run Audits](#run-audits)

## Run Audits

* run [Audit Structure](workflows/audit-structure.mdscript.md#audit-structure)
* run [Audit Control Flow](workflows/audit-control-flow.mdscript.md#audit-control-flow)
* run [Audit Concurrency](workflows/audit-concurrency.mdscript.md#audit-concurrency)
* run [Audit Data Boundaries](workflows/audit-data-boundaries.mdscript.md#audit-data-boundaries)
* run [Audit Time And Determinism](workflows/audit-time-determinism.mdscript.md#audit-time-determinism)
* run [Audit Tests And Deps](workflows/audit-tests-and-deps.mdscript.md#audit-tests-and-deps)
* [Emit Findings](#emit-findings)

## Emit Findings

* run [Emit Findings](workflows/emit-findings.mdscript.md#emit-findings)
* prefer UML rule ids (`CF/BH/HI/ST*`) on every finding; framework notes are secondary only
* if any finding severity is in `{{blocking_severities}}`
  * set `{{verdict}}` to `fail`
  * stop and report `fail`, blocking counts by severity, top findings, and `{{findings_path}}`
* set `{{verdict}}` to `pass`
* stop and report `pass`, residual `P3` if any, and `{{findings_path}}`

## Anti Patterns

* do not treat docs or SUMMARY files as proof the machine is correct
* do not waive P0–P2 without an explicit user waiver naming rule ids
* do not prioritize framework style over UML 2.5 control-flow semantics
* do not allow conditionals in entry/exit/effect/activity to choose control-flow outcomes
* do not accept duplicated same-event transitions on siblings when hierarchy can own them
* do not require long-running work in entry/exit/effect — activities only
* do not rewrite machines in this skill — findings and remediation only
