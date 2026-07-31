<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Start Goal Run

* set `{{conversation_id}}` from injected goal/session context when present
* if `{{conversation_id}}` is empty, set it to a stable id for this chat (timestamp-safe slug is fine)
* run [Resolve Agent Home](../../gabe-common/workflows/agent-home.md#resolve-agent-home)
* set `{{session_dir}}` to `{{project_home}}/goal/sessions/{{conversation_id}}`
* create `{{session_dir}}` if missing
* read the front matter of each `{{session_dir}}/runs/*/goal.mdscript.md`
* if a prior run is still `active: true`
  * set that prior run MDScript front matter `active: false` / terminal status
  * append `goal_superseded` to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`
* if a prior run already completed, do not log `goal_superseded`
* set `{{run_id}}` to a new unique id (`YYYYMMDDTHHMMSSZ` plus a short random suffix)
* set `{{run_dir}}` to `{{session_dir}}/runs/{{run_id}}`
* set `{{goal_mdscript}}` to `{{run_dir}}/goal.mdscript.md`
* create `{{run_dir}}/artifacts/logs`, `captures`, `images`, `screenshots`, and `live`
* if `{{skip_goal_hooks}}` is empty
  * set `{{skip_goal_hooks}}` to `false`
* if `{{loop_driver}}` is empty
  * set `{{loop_driver}}` to `gabe-hooks` when `{{skip_goal_hooks}}` is false, otherwise `harness-goal`
* write executable `{{goal_mdscript}}` as the sole durable run tracker with YAML front matter (`active`, `status`, `goal`, paths, proof fields, `resume_heading`, `iteration`, `started_at`, `skip_hooks`, `loop_driver`) plus the exact execution header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
* write every heading in `{{goal_mdscript}}` as a `##` state, never `#`
* include the `##` states `Goal Contract`, `Resume Goal`, `Pursue Goal`, `Complete Goal`, `Manual Stop`, and `Stop Hook Resume Command`
* write each state body as executable bullets with explicit `[State](#anchor)` branches
* when `{{skip_goal_hooks}}` is `true`, document in Goal Contract that harness `/goal` drives multi-round continuation and gabe-goal hooks are skipped
* verify `mdscript-exec {{goal_mdscript}}#pursue-goal` resolves to a real `##` state before reporting the run started
* put the exact resume command `mdscript-exec {{goal_mdscript}}#pursue-goal` in `Stop Hook Resume Command` (used by hooks only when `skip_hooks` is false; still the durable re-entry when harness-driven)
* append `goal_started` (include `goal_mdscript`, `loop_driver`, `skip_hooks`) to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`
* append `{"event":"run_started","goal":"{{goal_text}}","proof_kind":"{{proof_kind}}","live_proof":"{{live_proof}}","goal_mdscript":"{{goal_mdscript}}","loop_driver":"{{loop_driver}}","skip_hooks":{{skip_goal_hooks}}}` to `{{run_dir}}/progress.jsonl`
* never overwrite prior runs, logs, or artifact files
* return to the caller
