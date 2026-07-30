<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Emit Findings

* read `{{findings_log}}` and normalize each entry to `severity`, `rule_id`, `overlay_id`,
  `location`, `summary`, `evidence`, `remediation`, `verdict`, and optional `binding_note`
* reject any entry whose `rule_id` is not in the loaded rule set — a finding with no rule is a guess
* reject any entry with no `verdict`; unverified findings do not ship
* drop entries matching `{{enforced_patterns}}`; those are already blocked at edit time
* drop duplicates sharing rule_id, location, and summary
* set `{{blocking_count}}` to the number of findings whose `verdict` is `stands` and whose
  `rule_id` is not in `{{waived_rule_ids}}`
* every rule blocks — severity orders the report and never excuses a finding
* sort by severity `P0` to `P3`, then by path
* write `{{out_dir}}/findings.json` with the list, scope, dialect and version, `{{graph_source}}`,
  `{{graph_confidence}}`, `{{ownership_verdict}}`, the last gate reached, refuted findings, and waivers
* write `{{out_dir}}/findings.md` as a table: severity, rule, location, summary, remediation
* set `{{findings_path}}` to `{{out_dir}}/findings.md`
* if `{{graph_confidence}}` is `low`, state in both files that structural results are unverified
* return to the caller
