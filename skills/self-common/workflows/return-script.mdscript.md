<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Prepare Prompt Return Script

* use this workflow before an MDScript agent role asks for input while the execution is paused
  * this rule applies to a prompt to the user, a repository owner, or another authority surface
* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* find `{{return_source_workflow}}` from the current MDScript file that you execute
* find `{{return_resume_heading}}` from the caller heading that must continue after you apply the answer
* find `{{pending_question}}`, `{{pending_decision}}`, `{{blocker}}`, and `{{claim_scope}}`
* find `{{parent_agent}}` and `{{parent_reporting_path}}`
* set `{{return_dir}}` to `{{file_task_root}}/returns`
* set `{{return_id}}` to a stable lowercase slug
  * make the slug from `{{return_source_workflow}}`, `{{return_resume_heading}}`, and the current UTC timestamp
* set `{{return_script}}` to `{{return_dir}}/{{return_id}}.mdscript.md`
* before you write `{{return_script}}`, create `{{return_dir}}`
  * if the create operation fails, stop and report the exact path and error
* [Write Prompt Return Script](#write-prompt-return-script)

## Write Prompt Return Script

* write `{{return_script}}` as executable MDScript, not as a prose note
  * if the write fails, stop and report the exact path and error
* start `{{return_script}}` with the exact execution header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
* write each heading in `{{return_script}}` as a `##` state, never as `#`
* write a `## Resume` heading that restores the saved variables and context from this return script
* under `## Resume`, apply the latest answer of the user to `{{pending_decision}}`
* under `## Resume`, record the answered question, the blocker, the claim scope, and the parent reporting path
* under `## Resume`, record the stop and report fields that the caller needs
* under `## Resume`, continue with the execution of `{{return_source_workflow}}#{{return_resume_heading}}`
* include the durable context that is necessary to continue without a replay of earlier states:
  * the task id, the lane id, the goal MDScript, the ledger keys, and the event execution
  * the source workflow, the current heading, the proof scope, the proof path, and the local resource path
  * the proof given, the proof not claimed, the blocker, the next owner, and the reporting path
* include only sanitized state
* do not write secrets, credentials, private endpoints, token values, or private local paths into a return script
* set `{{return_resume_command}}` to the executable resume command for the current runner
  * for example, use `/mdscript-exec {{return_script}}` in Codex or `mdscript-exec {{return_script}}` in a CLI surface
* [Prompt With Return Command](#prompt-with-return-command)

## Prompt With Return Command

* if `{{return_script}}` does not exist
  * [Write Prompt Return Script](#write-prompt-return-script)
* ask the authority surface for `{{pending_decision}}`
  * use the smallest question that is ready for a decision and lets the workflow continue
* include the blocker, and the accepted options or the requested value
* include the result of each available path, and the proof or authority boundary that caused the prompt
* make `{{return_resume_command}}` the last line of the prompt that the user sees
* do not put text after the resume command
* do not ask from an agent MDScript workflow before you write `{{return_script}}`
* after the prompt, stop and wait for the answer
