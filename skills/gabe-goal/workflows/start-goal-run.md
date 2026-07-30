<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Start Goal Run

* set `{{conversation_id}}` from injected goal/session context when present
* if `{{conversation_id}}` is empty, set it to a stable id for this chat (timestamp-safe slug is fine)
* set `{{session_dir}}` to `{{repo_root}}/.cursor/goal/sessions/{{conversation_id}}`
* create `{{session_dir}}` if missing
* if `{{session_dir}}/session.json` is missing, write it with `conversation_id` and `created_at`
* read `{{session_dir}}/active-run.json` when present
* if a prior run is still `active: true`
  * set that prior run's `goal.json` `"active"` to `false`
  * append `goal_superseded` to `{{session_dir}}/session-log.jsonl` and `{{repo_root}}/.cursor/goal/goal-log.jsonl`
* if a prior run already completed, do not log `goal_superseded`
* set `{{run_id}}` to a new unique id (`YYYYMMDDTHHMMSSZ` plus a short random suffix)
* set `{{run_dir}}` to `{{session_dir}}/runs/{{run_id}}`
* create `{{run_dir}}/artifacts/logs`, `captures`, `images`, `screenshots`, and `live`
* write `{{run_dir}}/goal.json` with `active: true`, `goal: {{goal_text}}`, `conversation_id`, `run_id`, `proof_kind`, `live_proof`, `primary_user_action` when set, and `started_at` ISO-8601
* write `{{session_dir}}/active-run.json` pointing at `{{run_id}}` and `{{run_dir}}`
* append `goal_started` to `{{session_dir}}/session-log.jsonl` and `{{repo_root}}/.cursor/goal/goal-log.jsonl`
* append `{"event":"run_started","goal":"{{goal_text}}","proof_kind":"{{proof_kind}}","live_proof":"{{live_proof}}"}` to `{{run_dir}}/progress.jsonl`
* never overwrite prior runs, logs, or artifact files
* return to the caller
