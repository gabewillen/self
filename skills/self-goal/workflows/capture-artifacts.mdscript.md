<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Capture Artifacts

* use unit tests and partial UI steps only as support evidence
* if `{{live_proof}}` is `required`
  * do `{{primary_user_action}}` on the real stack
  * capture the output under `{{run_dir}}/artifacts/live/` with a new timestamped filename
* if the real stack is down, start or fix it before you use weaker proof
  * if it still cannot run, write the blocker in the manifest
  * if it still cannot run, do not claim that it is ready for review
* for `proof_kind: tui`, capture one or more terminal/TUI captures under `artifacts/captures/` or `artifacts/screenshots/`
* for `proof_kind: ui`, capture one or more images under `artifacts/images/` or `artifacts/screenshots/`
* for `proof_kind: default`, capture one or more logs under `artifacts/logs/`
* never overwrite an artifact file that exists, and always use a new timestamped path
* write or change `{{run_dir}}/artifacts/manifest.json` with these fields:
  * `goal`, `conversation_id`, `updated_at`, and an `artifacts` array
  * `primary_user_action` if live proof is necessary
* make sure that each manifest entry has `path`, `kind`, `reproduce`, and `proves`
* prefer an explicit `tier: "live" | "unit" | "integration"` on each entry
* mark an entry as live-tier if one of these conditions is true:
  * the path is under `artifacts/live/`, or `tier` is `live`
  * `reproduce` runs real-stack/E2E commands
* make sure that each referenced artifact file exists on disk under `{{run_dir}}`
* if live proof is necessary, make sure that one or more live-tier artifacts prove `{{primary_user_action}}`
* before the review, run the live reproduce command yourself
* before the review, make sure that the artifact file shows pass/success output
* append the artifact paths and the reproduce results to `{{run_dir}}/progress.jsonl`
* return to the caller
