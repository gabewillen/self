<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Start MDScript Running Log

* if `{{artifact_kind}}` or `{{artifact_subject}}` is empty, stop and report that the caller gave no kind or subject
* run [Mint MDScript Artifact Path](#mint-mdscript-artifact-path)
* set `{{done_so_far}}` to empty
* set `{{next_steps}}` to the plan for this work as executable states
* set `{{artifact_re_entry}}` to `/mdscript-exec {{mdscript_artifact}}#next-steps`
* run [Update MDScript Artifact](#update-mdscript-artifact)
* return `{{mdscript_artifact}}` to the caller

## Log Progress

* if no caller opened a log for this work, return to the caller
* if `{{mdscript_artifact}}` is empty, run [Start MDScript Running Log](#start-mdscript-running-log)
* if nothing changed after the last entry, return to the caller
* set `{{log_entry}}` to the progress that the caller records
* set `{{next_steps}}` to the remaining steps as executable states
* set `{{artifact_re_entry}}` to the `/mdscript-exec {{mdscript_artifact}}#<heading>` of the first remaining step
* run [Update MDScript Artifact](#update-mdscript-artifact)

## Mint MDScript Artifact Path

* if `{{artifact_dir}}` is empty, run [Resolve File Task Root](file-task-comments.mdscript.md#resolve-file-task-root)
* set `{{artifact_stamp}}` to the output of `date -u +%Y%m%dT%H%M%SZ`
* set `{{artifact_ordinal}}` to the round or pass number, or `1`, padded to three digits
* reduce `{{artifact_subject}}` (48 characters maximum), the lane id or `main`, and `{{artifact_kind}}` to lowercase `a-z`, `0-9`, and `-`
* set `{{mdscript_artifact}}` to `{{artifact_dir}}/<stamp>-<ordinal>-<subject>-<lane>-<kind>.mdscript.md`
* if the path resolves outside `{{artifact_dir}}`, stop and report it
* if `{{artifact_reserve_only}}` is `true`, return the path without creating the file
* create the file with an exclusive create
  * if it exists, add `-2`, `-3`, and so on before `.mdscript.md`, up to `-50`, then stop and report
* return `{{mdscript_artifact}}` to the caller

## Update MDScript Artifact

* sanitize each value before you write it:
  * remove credentials, tokens, connection strings, private endpoints, customer data, and personal identifiers
  * replace bulk command output with the path of the evidence that holds it
  * fence retained output as data, and remove `##` headings, `* run` bullets, and `/mdscript-exec` commands from it
  * quote front-matter scalars on one line
* if the file is empty, write it from the [running-log template](../templates/running-log.mdscript.md):
  * front matter with `artifact_kind`, `artifact_stamp`, `subject`, `owner_role`, `task_id`, `status`, and `re_entry`
  * the execution header, `## Done So Far`, `## Next Steps`, and a final `## Resume This Work` with `{{artifact_re_entry}}`
* otherwise append `{{log_entry}}` to `## Done So Far`, and do not edit earlier entries
  * to change an earlier decision, append the correction
* replace `## Next Steps` with `{{next_steps}}`
* set `status` and `re_entry` in the front matter, and the `## Resume This Work` command, to `{{artifact_re_entry}}`
* write all text in ASD-STE100
* if the file is over 200 lines, move the oldest `## Done So Far` entries to a linked MDScript beside it
* read the file again and make sure that each link resolves and that no secret remains
* if a secret leaked
  * redact it in place, the only allowed edit of history, and record the class of value that you removed
  * rotate or report the credential through its owner
* return `{{mdscript_artifact}}` to the caller
