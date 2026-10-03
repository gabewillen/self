<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Run File Task Reviewer Fallback

* use this path only if the subagent tools are not available in a project control-plane workflow
* create one reviewer file task for each selected lane
* give each reviewer file task a distinct task id, a distinct author, and the implementer task as its parent
* add a file comment on the implementer task with these items:
  * `subagent_tooling: unavailable` and the neutral packet artifact
  * the selected `{{blind_lanes}}`, the reviewer task ids, and the fallback boundary
* for each lane in `{{blind_lanes}}`
  * resolve `{{lane_entry}}` from `{{lane_entrypoints}}.<lane>`
  * run that lane MDScript in this process with `/mdscript-exec {{lane_entry}}`
  * make sure that the lane pass writes the `{{signoff_path}}` that this round minted for that lane under `{{review_signoff_dir}}`
* never run the full `self-review` skill as a nested “reviewer role” substitute for multi-lane fanout
* after each selected lane has a sign-off file, run [Aggregate Triple Signoffs](../../self-review/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs) in this process
* if the repository or tracker must have live blind subagents
  * do not claim public MR/PR merge-readiness through this fallback
* use this fallback only for project control-plane source-health proof, and only if no subagent surface exists
* return to the caller
