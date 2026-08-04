<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Mint MDScript Artifact Path

* run [Resolve File Task Root](file-task-comments.md#resolve-file-task-root) when `{{artifact_dir}}` is empty
* require `{{artifact_kind}}` from the caller, such as `rca`, `review-packet`, `review-verdict`, `signoff`, `implementation`, or `handoff`
* if `{{artifact_kind}}` is empty
  * set `{{blocker}}` to `mdscript artifact requested without a kind`
  * stop and report `{{blocker}}` to the caller
* run `date -u +%Y%m%dT%H%M%SZ` and set `{{artifact_stamp}}` to its output
* set `{{artifact_slug}}` to a lowercase path-safe slug of the subject: the symptom, the reviewed target, or the objective
* set `{{artifact_ordinal}}` to the round, pass, or iteration this artifact belongs to, or to `1`
* set `{{mdscript_artifact}}` to `{{artifact_dir}}/{{artifact_stamp}}-{{artifact_ordinal}}-{{artifact_slug}}-{{artifact_kind}}.mdscript.md`
* if `{{mdscript_artifact}}` already exists
  * [Resolve Artifact Collision](#resolve-artifact-collision)
* never overwrite or delete an earlier artifact to reuse its name, because the artifact set is append-only history
* return `{{mdscript_artifact}}` to the caller

## Resolve Artifact Collision

* set `{{artifact_suffix}}` to `2` when it is empty, otherwise to `{{artifact_suffix}}` plus `1`
* set `{{mdscript_artifact}}` to `{{artifact_dir}}/{{artifact_stamp}}-{{artifact_ordinal}}-{{artifact_slug}}-{{artifact_kind}}-{{artifact_suffix}}.mdscript.md`
* if `{{mdscript_artifact}}` already exists
  * [Resolve Artifact Collision](#resolve-artifact-collision)
* return `{{mdscript_artifact}}` to the caller

## Write MDScript Artifact

* if `{{mdscript_artifact}}` is empty
  * [Mint MDScript Artifact Path](#mint-mdscript-artifact-path)
* write `{{mdscript_artifact}}` as executable MDScript, never prose notes
  * if the write fails, stop and report the exact path and error
* start the file with the exact execution header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
* write YAML front matter with `artifact_kind`, `artifact_stamp`, `subject`, `owner_role`, `task_id`, `conversation_id` when known, `status`, and `re_entry`
* write every heading as a `##` state, never `#`, so another agent can enter at any of them
* write a first state that restores the durable context this artifact carries: subject, scope, evidence paths, and open questions
* write the body states as executable steps the next agent runs, not as a narrative of what already happened
* write a final state that names the exact `/mdscript-exec {{mdscript_artifact}}#<heading>` command to continue this work
* keep the file under 200 lines, extracting crowded states into linked MDScripts under `{{artifact_dir}}`
* include only sanitized state: no credentials, tokens, private endpoints, or customer data
* [Verify MDScript Artifact](#verify-mdscript-artifact)

## Verify MDScript Artifact

* read `{{mdscript_artifact}}` back and confirm the execution header, front matter, and `##` states are present
* confirm every in-file heading link in it resolves to one of its own `##` headings
* confirm every relative link it names exists
* measure it with `wc -l` and confirm it is under 200 lines
* if any check fails
  * [Repair MDScript Artifact](#repair-mdscript-artifact)
* record `{{mdscript_artifact}}` in the file task as the durable record for `{{artifact_kind}}`
* return `{{mdscript_artifact}}` to the caller

## Repair MDScript Artifact

* fix the exact failed check in `{{mdscript_artifact}}`: missing header, missing front matter field, dead anchor, missing link target, or line budget
* if the file is over 200 lines
  * extract its most crowded states into a linked MDScript beside it and link to that file
* [Verify MDScript Artifact](#verify-mdscript-artifact)

## Update MDScript Artifact

* if `{{mdscript_artifact}}` does not exist
  * [Write MDScript Artifact](#write-mdscript-artifact)
* append the new state, evidence, or decision to `{{mdscript_artifact}}` in place
* update its front matter `status` and `re_entry` to the current position
* do not rewrite history already recorded in it; supersede a state by appending the correction
* [Verify MDScript Artifact](#verify-mdscript-artifact)
