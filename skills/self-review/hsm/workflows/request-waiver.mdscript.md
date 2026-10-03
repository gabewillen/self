<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Request Waiver
* create `{{project_home}}/returns` before you write the return script

* set `{{return_script}}` to `{{project_home}}/returns/hsm-review-waiver-{{run_id}}.mdscript.md`
* write `{{return_script}}` as executable MDScript that starts with the exact header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
  * include a `## Resume` entrypoint
* restore `{{skill_root}}`, `{{review_skill_root}}`, `{{repo_root}}`, `{{run_id}}`, `{{out_dir}}`, `{{findings_log}}`, and `{{findings_path}}`
* restore `{{full_sweep}}`, `{{dialect}}`, `{{graph_source}}`, `{{graph_confidence}}`, `{{ownership_verdict}}`, `{{enforced_patterns}}`, `{{waiver_requested}}` as `true`, and the gate that stopped
  * record the blocking findings by rule id, severity, and location
  * apply the answer of the user to `{{waived_rule_ids}}`
  * if the user declines, keep `{{waived_rule_ids}}` empty
  * continue with `/mdscript-exec {{review_skill_root}}/hsm/hsm.mdscript.md#emit-findings`
* ask the user which blocking rule ids they waive for this run, if any
  * in the question, list each rule id with its location and consequence
* end the question with `/mdscript-exec {{return_script}}` as the
  last line
* write nothing after that line
