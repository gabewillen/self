<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Request Waiver

Write the return script before asking. The prompt is invalid without it.

* write `.mdscript/returns/hsm-review-waiver-{{run_id}}.md` containing:
  * this skill's path and the resume heading `Emit Findings`
  * `{{run_id}}`, `{{out_dir}}`, `{{findings_log}}`, `{{findings_path}}`, `{{full_sweep}}`,
    `{{dialect}}`, `{{graph_source}}`, and the gate that stopped
  * the blocking findings by rule id, severity, and location
  * the instruction to set `{{waived_rule_ids}}` from the user's answer, leave it empty if the user
    declines, and resume at [Emit Findings](../SKILL.md#emit-findings)
* ask the user which blocking rule ids, if any, they waive for this run, listing each with its
  location and consequence
* end the question with `mdscript-exec .mdscript/returns/hsm-review-waiver-{{run_id}}.md` as the
  final line, and write nothing after it
