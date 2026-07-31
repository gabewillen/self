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

* state the lane objective for `{{claim_scope}}`

## Contract

* state preconditions, postconditions, invariants, proof path, local resource path, proof supplied, proof not claimed, and review gate

## Current State

* record the current lane state from live sources

## Evidence

* list current proof artifacts and command results

## Open Questions

* list unresolved decisions, or stop if none remain

## Next Action

* perform the next discrete action for this lane
* continue with `/mdscript-exec {{task_file}}#next-action` or stop when the claim is terminal
