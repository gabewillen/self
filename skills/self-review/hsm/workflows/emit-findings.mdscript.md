<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Emit Findings

* read `{{findings_log}}`
* normalize each entry to `severity`, `rule_id`, `overlay_id`, `location`, `summary`, `evidence`, `remediation`, `verdict`, and optional `binding_note`
* reject each entry whose `rule_id` is not in the loaded rule set
* reject each entry that has no `verdict`, because findings without a verdict do not ship
* remove the entries that match `{{enforced_patterns}}`, because the edit-time checks already block them
* remove the duplicates that have the same rule_id, location, and summary
* set `{{blocking_count}}` to the number of findings whose `verdict` is `stands` and whose `rule_id` is not in `{{waived_rule_ids}}`
* treat each rule as a blocker
* use the severity only to sort the report, and never to excuse a finding
* sort by severity `P0` to `P3`, then by path
* write `{{out_dir}}/findings.json` with these items:
  * the list, the scope, the dialect, and the dialect version
  * `{{graph_source}}`, `{{graph_confidence}}`, and `{{ownership_verdict}}`
  * the last gate that the review reached, the refuted findings, and the waivers
* write `{{out_dir}}/findings.md` as a table with these columns: severity, rule, location, summary, remediation
* set `{{findings_path}}` to `{{out_dir}}/findings.md`
* if `{{graph_confidence}}` is `low`, write in the two files that the structural results have no proof
* return to the caller
