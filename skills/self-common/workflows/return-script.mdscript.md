<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Prepare Prompt Return Script

* use this state before an agent role asks the user or an owner for input
* run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* set `{{return_id}}` to a lowercase slug of `{{return_source_workflow}}`, `{{return_resume_heading}}`, and the UTC time
* set `{{return_script}}` to `{{return_dir}}/{{return_id}}.mdscript.md`
* write `{{return_script}}` as executable MDScript with the execution header and a `## Resume` state that:
  * restores the task id, lane id, goal, proof scope, proof path, blocker, next owner, and reporting path
  * applies the user's answer to `{{pending_decision}}`
  * continues at `{{return_source_workflow}}#{{return_resume_heading}}`
* keep secrets, credentials, private endpoints, and private local paths out of it
* ask the smallest decision question, with the blocker and the options
* make `/mdscript-exec {{return_script}}` the last line of the question
* stop, and wait for the answer
