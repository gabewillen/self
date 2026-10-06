<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Implementation Rules

* set `{{engineering_rules_root}}` to `{{skills_root}}/self-review/references/engineering-rules`
* if that directory does not exist, stop and report that self-implement needs the self-review rule files
* set `{{in_scope_paths}}` from the file task, the claim, the diff, and the files that this lane will edit
* set `{{impl_rule_packs}}` to the packs of the [rule pack catalog](../references/implementation-rules-catalog.md) whose "Select when" matches the paths or the claim
  * for code work, always include `core` and `dbc`
  * add each pack in the "Also selects" column of a selected pack
  * add each pack in `{{forced_impl_packs}}`, and remove each pack in `{{excluded_impl_packs}}`
* if a selected pack has no rule file, stop and report the missing file
* if the work is code and `core` is not selected, stop and report the lost core pack
* record `{{impl_rule_packs}}` and the reason for each pack on the file task
* return to the caller
