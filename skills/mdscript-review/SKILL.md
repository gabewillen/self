---
name: mdscript-review
description: >-
  Review MDScript workflows and MDScript-backed skills for authoring and
  execution-contract violations, with circuit breakers that open on P0 findings
  or a P1 threshold and stop remaining gates. Use when the user invokes
  /mdscript-review, asks to review MDScript, lint an MDScript skill, or check a
  workflow for missing headers, multi-action bullets, implied recovery branches,
  dead links, unset path variables, hard line-count limits (under 200 soft / 500
  hard, measured with wc -l), or prompt return-script gaps.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Target

* if `{{target}}` is empty
  * infer `{{target}}` from the user request (file path, skill name, or directory)
* if `{{target}}` is still empty
  * ask the user for `{{target}}` (path to an MDScript file, skill directory, or glob)
* set `{{skill_root}}` to this skill directory
* set `{{review_mode}}` to `full` unless the user asked for a single gate
* if the user named a single gate such as structure, actions, branches, links, variables, line-budget, or prompts
  * set `{{review_mode}}` to that gate name
* resolve `{{target_paths}}` to every Markdown MDScript under `{{target}}` (the file itself when `{{target}}` is a file; otherwise `SKILL.md`, `*.md`, and linked workflows under that path)
* if `{{target_paths}}` is empty
  * stop and report that no MDScript files matched `{{target}}`
* read [violations catalog](references/violations.md) and hold severities, rule ids, and trip rules for every gate
* [Initialize Circuit](#initialize-circuit)

## Initialize Circuit

* set `{{circuit}}` to `closed`
* set `{{findings}}` to an empty list
* set `{{p0_count}}` to `0`
* set `{{p1_count}}` to `0`
* set `{{p2_count}}` to `0`
* set `{{trip_gate}}` to empty
* set `{{trip_reason}}` to empty
* if `{{p1_trip_threshold}}` is empty
  * set `{{p1_trip_threshold}}` to `5`
* if `{{soft_line_limit}}` is empty
  * set `{{soft_line_limit}}` to `200`
* if `{{hard_line_limit}}` is empty
  * set `{{hard_line_limit}}` to `500`
* if `{{review_mode}}` is not `full`
  * [Run Single Gate](#run-single-gate)
* [Gate Structure](#gate-structure)

## Run Single Gate

* if `{{review_mode}}` is `structure`
  * [Gate Structure](#gate-structure)
* if `{{review_mode}}` is `actions`
  * [Gate Actions](#gate-actions)
* if `{{review_mode}}` is `branches`
  * [Gate Branches](#gate-branches)
* if `{{review_mode}}` is `links`
  * [Gate Links](#gate-links)
* if `{{review_mode}}` is `variables`
  * [Gate Variables](#gate-variables)
* if `{{review_mode}}` is `line-budget`
  * [Gate Line Budget](#gate-line-budget)
* if `{{review_mode}}` is `prompts`
  * [Gate Prompts](#gate-prompts)
* stop and report that `{{review_mode}}` is not a known gate

## Gate Structure

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `structure`
* run [Check Structure](checks/structure.md#check-structure)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `structure`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Line Budget](#gate-line-budget)

## Gate Line Budget

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `line-budget`
* run [Check Line Budget](checks/line-budget.md#check-line-budget)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `line-budget`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Actions](#gate-actions)

## Gate Actions

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `actions`
* run [Check Actions](checks/actions.md#check-actions)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `actions`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Branches](#gate-branches)

## Gate Branches

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `branches`
* run [Check Branches](checks/branches.md#check-branches)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `branches`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Links](#gate-links)

## Gate Links

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `links`
* run [Check Links](checks/links.md#check-links)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `links`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Variables](#gate-variables)

## Gate Variables

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `variables`
* run [Check Variables](checks/variables.md#check-variables)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `variables`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Prompts](#gate-prompts)

## Gate Prompts

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `prompts`
* run [Check Prompts](checks/prompts.md#check-prompts)
* run [Evaluate Circuit](checks/circuit.md#evaluate-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* run [Grade Pass](checks/circuit.md#grade-pass)
