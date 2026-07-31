<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Capture Artifacts

* treat unit tests and partial UI steps as supporting evidence only
* when `{{live_proof}}` is `required`, exercise `{{primary_user_action}}` on the real stack and capture output under `{{run_dir}}/artifacts/live/` with a new timestamped filename
* if the real stack is down, start or fix it before substituting weaker proof
  * if it still cannot run, document the blocker in the manifest and do not claim ready for review
* for `proof_kind: tui`, capture at least one terminal/TUI capture under `artifacts/captures/` or `artifacts/screenshots/`
* for `proof_kind: ui`, capture at least one image under `artifacts/images/` or `artifacts/screenshots/`
* for `proof_kind: default`, capture at least one log under `artifacts/logs/`
* never overwrite an existing artifact file — always use a new timestamped path
* write or update `{{run_dir}}/artifacts/manifest.json` with `goal`, `conversation_id`, `primary_user_action` when required, `updated_at`, and an `artifacts` array
* every manifest entry must include `path`, `kind`, `reproduce`, and `proves`
* prefer explicit `tier: "live" | "unit" | "integration"` on each entry
* mark live-tier when path is under `artifacts/live/`, `tier` is `live`, or `reproduce` runs real-stack/E2E commands
* verify every referenced artifact file exists on disk under `{{run_dir}}`
* when live proof is required, confirm at least one live-tier artifact proves `{{primary_user_action}}`
* run the live reproduce command yourself and confirm pass/success output in the artifact file before review
* append artifact paths and reproduce results to `{{run_dir}}/progress.jsonl`
* return to the caller
