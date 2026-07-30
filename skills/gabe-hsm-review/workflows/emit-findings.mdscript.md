<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Emit Findings

* normalize each item in `{{findings}}` to include: `severity`, `rule_id`, `dialect`, `location`, `summary`, `evidence`, `remediation`
* drop duplicates with the same rule_id+location+summary
* sort by severity P0→P3 then path
* write `{{out_dir}}/findings.json` with the full list, scope, dialect, and timestamp
* write `{{out_dir}}/findings.md` as a human table: severity, rule, location, summary, remediation
* set `{{findings_path}}` to `{{out_dir}}/findings.md`
* count blocking findings whose severity is in `{{blocking_severities}}`
* set `{{blocking_count}}` to that count
* return to the caller
