---
id: {{task_id}}
title: {{title}}
type: {{type}}
status: {{status}}
parent: {{parent}}
owner_role: {{owner_role}}
lane_id: {{lane_id}}
claim_scope: {{claim_scope}}
proof_path: {{proof_path}}
source_of_truth: {{source_of_truth}}
created_at: {{created_at}}
updated_at: {{updated_at}}
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Objective

* state the objective of the lane for `{{claim_scope}}`
* write all text in ASD-STE100, as the `mdscript-write` conventions tell you

## Contract

* state the preconditions, the postconditions, and the invariants
* state the proof path and the local resource path
* state the proof that you give and the proof that you do not claim
* state the review gate

## Current State

* record the current state of the lane from live sources

## Evidence

* list the current proof artifacts and the command results

## Open Questions

* list the open decisions
* if no open decisions remain, stop

## Next Action

* do the next single action for this lane
* if the claim is terminal, stop
* if the claim is not terminal, continue with `/mdscript-exec {{task_file}}#next-action`
