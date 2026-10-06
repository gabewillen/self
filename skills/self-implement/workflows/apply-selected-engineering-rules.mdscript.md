<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Selected Engineering Rules

* if `{{impl_rule_packs}}` is empty, run [Select Implementation Rules](select-implementation-rules.mdscript.md#select-implementation-rules)
* if it is still empty, return to the caller
* set `{{impl_rules_phase}}` to `hold`
* for each pack, run [Apply Engineering Rules](engineering-rules/apply-engineering-rules.mdscript.md#apply-engineering-rules) with its rule files
* carry each active `MUST` and `MUST NOT` rule into Implement Narrowly
* return to the caller

## Recheck Selected Engineering Rules

* if `{{impl_rule_packs}}` is empty, return to the caller
* set `{{impl_rules_phase}}` to `recheck`
* set `{{impl_rule_violations}}` to an empty list
* for each pack, run [Apply Engineering Rules](engineering-rules/apply-engineering-rules.mdscript.md#apply-engineering-rules) with its rule files
* if `{{impl_rule_violations}}` is not empty
  * fix each violation inside the claim scope
  * [Recheck Selected Engineering Rules](#recheck-selected-engineering-rules)
* record that each pack rechecked clean against the current diff
* return to the caller
