---
name: mdscript-review
description: >-
  Reviews MDScript workflows and MDScript skills for authoring violations and
  execution-contract violations. Circuit breakers open on a P0 finding or a P1
  threshold, and stop the gates that follow. Use this skill when the user types
  /mdscript-review or asks you to review or lint MDScript. It finds headers that
  are not there, bullets with many actions, implied recovery branches, dead
  links, and path variables that are not set. It also finds prompt
  return-script gaps and line counts above the limits (soft 200, hard 500,
  measured with wc -l). It also finds text that is not ASD-STE100 Simplified
  Technical English.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Find Target

* if `{{target}}` is empty
  * find `{{target}}` in the user request (a file path, skill name, or directory)
* if `{{target}}` is still empty
  * ask the user for `{{target}}` (the path of an MDScript file, a skill directory, or a glob)
* set `{{skill_root}}` to this skill directory
* set `{{review_mode}}` to `full`
* if the user gave one gate name, for example structure, actions, branches, links, variables, line-budget, prompts, or language
  * set `{{review_mode}}` to that gate name
* if `{{target}}` is a file, set `{{target_paths}}` to that file
* if `{{target}}` is a directory, set `{{target_paths}}` to its `SKILL.md`, its `*.md` files, and its linked workflows
* if `{{target_paths}}` is empty
  * tell the user that no MDScript files agree with `{{target}}`
  * stop
* read the [violations catalog](references/violations.md) and keep its severities, rule ids, and trip rules
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
* if `{{review_mode}}` is `language`
  * [Gate Language](#gate-language)
* tell the user that `{{review_mode}}` is not a known gate
* stop

## Gate Structure

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `structure`
* run [Check Structure](checks/structure.md#check-structure)
* run [Examine Circuit](checks/circuit.md#examine-circuit)
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
* run [Examine Circuit](checks/circuit.md#examine-circuit)
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
* run [Examine Circuit](checks/circuit.md#examine-circuit)
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
* run [Examine Circuit](checks/circuit.md#examine-circuit)
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
* run [Examine Circuit](checks/circuit.md#examine-circuit)
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
* run [Examine Circuit](checks/circuit.md#examine-circuit)
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
* run [Examine Circuit](checks/circuit.md#examine-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* if `{{review_mode}}` is `prompts`
  * run [Grade Pass](checks/circuit.md#grade-pass)
* [Gate Language](#gate-language)

## Gate Language

* if `{{circuit}}` is `open`
  * run [Report Verdict](checks/circuit.md#report-verdict)
* set `{{current_gate}}` to `language`
* run [Check Language](checks/language.md#check-language)
* run [Examine Circuit](checks/circuit.md#examine-circuit)
* if `{{circuit}}` is `open`
  * run [Trip Circuit Breaker](checks/circuit.md#trip-circuit-breaker)
* run [Grade Pass](checks/circuit.md#grade-pass)
