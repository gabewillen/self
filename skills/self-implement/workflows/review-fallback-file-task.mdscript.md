<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Run File Task Reviewer Fallback

* use this path only when subagent tooling is unavailable in a project control-plane workflow
* create one reviewer file task per selected lane with a distinct task id, author, and parent set to the implementer task
* add a file comment on the implementer task that records `subagent_tooling: unavailable`, the neutral packet artifact, selected `{{blind_lanes}}`, reviewer task ids, and the fallback boundary
* for each lane in `{{blind_lanes}}`
  * resolve `{{lane_entry}}` from `{{lane_entrypoints}}.<lane>`
  * run that lane MDScript in this process with `/mdscript-exec {{lane_entry}}`
  * require the lane pass to write the `{{signoff_path}}` this round minted for that lane, under `{{review_signoff_dir}}`
* never run the full `self-review` skill as a nested “reviewer role” substitute for multi-lane fanout
* after every selected lane has a sign-off file, run [Aggregate Triple Signoffs](../../self-review/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs) in this process
* do not claim public MR/PR merge-readiness through this fallback when the repository or tracker requires live blind subagents
* use this fallback only for project control-plane source-health proof when no subagent surface exists
* return to the caller
