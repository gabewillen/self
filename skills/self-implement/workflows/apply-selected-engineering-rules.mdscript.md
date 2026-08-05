<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Selected Engineering Rules

* if `{{impl_rule_packs}}` is empty
  * run [Select Implementation Rules](select-implementation-rules.mdscript.md#select-implementation-rules)
* if `{{impl_rule_packs}}` is still empty and the work is not code
  * record that no engineering-rule packs apply to non-code work
  * return to the caller
* if `{{impl_rule_packs}}` is still empty and the work is code
  * set `{{blocker}}` to `no implementation rule packs selected for code work`
  * stop and report the empty selection
* set `{{impl_rules_phase}}` to `hold`
* set `{{impl_packs_remaining}}` to a copy of `{{impl_rule_packs}}`
* set `{{impl_packs_applied}}` to an empty list
* set `{{impl_rule_violations}}` to an empty list
* [Apply Next Pack](#apply-next-pack)

## Recheck Selected Engineering Rules

* if `{{impl_rule_packs}}` is empty
  * run [Select Implementation Rules](select-implementation-rules.mdscript.md#select-implementation-rules)
* if `{{impl_rule_packs}}` is still empty
  * return to the caller
* set `{{impl_rules_phase}}` to `recheck`
* set `{{impl_packs_remaining}}` to a copy of `{{impl_rule_packs}}`
* set `{{impl_rule_violations}}` to an empty list
* [Apply Next Pack](#apply-next-pack)

## Apply Next Pack

* if `{{impl_packs_remaining}}` is empty
  * [Finish Pack Pass](#finish-pack-pass)
* set `{{impl_pack}}` to the first id in `{{impl_packs_remaining}}`
* remove that id from `{{impl_packs_remaining}}`
* set `{{rules_file}}` to `{{impl_pack_rules_files}}.{{impl_pack}}`
* if `{{rules_file}}` is empty
  * set `{{rules_file}}` from [Implementation Rules Catalog](../references/implementation-rules-catalog.md) for `{{impl_pack}}`
* set `{{pack_entry}}` to `{{impl_pack_entrypoints}}.{{impl_pack}}`
* if `{{pack_entry}}` is empty
  * set `{{blocker}}` to `missing entrypoint for impl pack {{impl_pack}}`
  * stop and report the missing entrypoint
* run `/mdscript-exec {{pack_entry}}`
* append `{{impl_pack}}` to `{{impl_packs_applied}}` when not already present
* if the pack returned standing rule violations
  * append each violation to `{{impl_rule_violations}}`
* [Apply Next Pack](#apply-next-pack)

## Finish Pack Pass

* if `{{impl_rules_phase}}` is `hold`
  * record held packs `{{impl_packs_applied}}` and reasons `{{impl_pack_reasons}}` on the file task
  * carry the active MUST and MUST NOT constraints into Implement Narrowly
  * return to the caller
* if `{{impl_rules_phase}}` is `recheck` and `{{impl_rule_violations}}` is not empty
  * set `{{repair_target}}` to the first violation in `{{impl_rule_violations}}`
  * [Repair Rule Violations](#repair-rule-violations)
* if `{{impl_rules_phase}}` is `recheck` and `{{impl_rule_violations}}` is empty
  * record that every selected pack rechecked clean against the current diff
  * return to the caller
* return to the caller

## Repair Rule Violations

* fix the implementation narrowly so `{{repair_target}}` no longer violates its rule id
* do not broaden scope beyond the claim while repairing rule violations
* remove the repaired violation from `{{impl_rule_violations}}`
* if more violations remain in `{{impl_rule_violations}}`
  * set `{{repair_target}}` to the next violation
  * [Repair Rule Violations](#repair-rule-violations)
* set `{{impl_rules_phase}}` to `recheck`
* set `{{impl_packs_remaining}}` to a copy of `{{impl_rule_packs}}`
* set `{{impl_rule_violations}}` to an empty list
* [Apply Next Pack](#apply-next-pack)
