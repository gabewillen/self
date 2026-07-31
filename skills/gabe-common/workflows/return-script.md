<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Prepare Prompt Return Script

* use this workflow before an MDScript agent role prompts Agent, the user, a repository owner, or another authority surface for input while execution is paused
* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root)
* infer `{{return_source_workflow}}` from the current MDScript file being executed
* infer `{{return_resume_heading}}` from the caller heading that should continue after the answer is applied
* infer `{{pending_question}}`, `{{pending_decision}}`, `{{blocker}}`, `{{claim_scope}}`, `{{parent_agent}}`, and `{{parent_reporting_path}}`
* set `{{return_dir}}` to `{{file_task_root}}/returns`
* set `{{return_id}}` to a stable, lowercase slug from `{{return_source_workflow}}`, `{{return_resume_heading}}`, and the current UTC timestamp
* set `{{return_script}}` to `{{return_dir}}/{{return_id}}.mdscript.md`
* create `{{return_dir}}` before writing `{{return_script}}`
  * if creation fails, stop and report the exact path and error
* [Write Prompt Return Script](#write-prompt-return-script)

## Write Prompt Return Script

* write `{{return_script}}` as executable MDScript, not a prose note
  * if the write fails, stop and report the exact path and error
* start `{{return_script}}` with the exact execution header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
* write every heading in `{{return_script}}` as a `##` state, never `#`
* write a `## Resume` heading that restores the saved variables and context from this return script
* under `## Resume`, apply the user's latest answer to `{{pending_decision}}`
* under `## Resume`, record the answered question, blocker, claim scope, parent reporting path, and any stop/report fields needed by the caller
* under `## Resume`, continue by executing `{{return_source_workflow}}#{{return_resume_heading}}`
* include the current durable context needed to continue without replaying earlier states: task id, lane id, goal MDScript, ledger keys, event execution, source workflow, current heading, proof scope, proof path, local resource path, proof supplied, proof not claimed, blocker, next owner, and reporting path
* include only sanitized state
* do not write secrets, credentials, private endpoints, token values, or private local paths into a return script
* set `{{return_resume_command}}` to the executable resume command for the current runner, such as `/mdscript-exec {{return_script}}` in Codex or `mdscript-exec {{return_script}}` in a CLI surface
* [Prompt With Return Command](#prompt-with-return-command)

## Prompt With Return Command

* if `{{return_script}}` does not exist
  * [Write Prompt Return Script](#write-prompt-return-script)
* prompt the authority surface for `{{pending_decision}}` with the smallest decision-ready question needed to continue
* include the blocker, accepted options or requested value, consequence of each available path, and the proof or authority boundary that forced the prompt
* end the user-facing prompt with `{{return_resume_command}}` as the final line
* do not put any text after the resume command
* do not prompt from a Agent MDScript workflow without first writing `{{return_script}}`
* stop after the prompt while waiting for the answer
