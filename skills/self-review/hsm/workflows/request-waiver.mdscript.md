<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Request Waiver
* create `{{project_home}}/returns` before writing the return script

* set `{{return_script}}` to `{{project_home}}/returns/hsm-review-waiver-{{run_id}}.mdscript.md`
* write `{{return_script}}` as executable MDScript beginning with the exact header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
  * include a `## Resume` entrypoint
* restore `{{skill_root}}`, `{{review_skill_root}}`, `{{repo_root}}`, `{{run_id}}`, `{{out_dir}}`, `{{findings_log}}`, `{{findings_path}}`, `{{full_sweep}}`, `{{dialect}}`, `{{graph_source}}`, `{{graph_confidence}}`, `{{ownership_verdict}}`, `{{enforced_patterns}}`, `{{waiver_requested}}` as `true`, and the gate that stopped
  * record blocking findings by rule id, severity, and location
  * apply the user's answer to `{{waived_rule_ids}}`, leaving it empty when the user declines
  * continue with `/mdscript-exec {{review_skill_root}}/hsm/hsm.mdscript.md#emit-findings`
* ask the user which blocking rule ids, if any, they waive for this run, listing each with its
  location and consequence
* end the question with `/mdscript-exec {{return_script}}` as the
  final line, and write nothing after it
