<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Start Goal Run

* if the injected goal/session context has a conversation id, set `{{conversation_id}}` from it
* if `{{conversation_id}}` is empty, set it to a stable id for this chat (a timestamp-safe slug is fine)
* run [Resolve Agent Home](../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{session_dir}}` to `{{project_home}}/goal/sessions/{{conversation_id}}`
* if `{{session_dir}}` does not exist, create it
* read the front matter of each `{{session_dir}}/runs/*/goal.mdscript.md`
* if an earlier run is still `active: true`
  * set the front matter of that run MDScript to `active: false` / terminal status
  * append `goal_superseded` to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`
* if an earlier run is already complete, do not log `goal_superseded`
* set `{{run_id}}` to a new unique id (`YYYYMMDDTHHMMSSZ` and a short random suffix)
* set `{{run_dir}}` to `{{session_dir}}/runs/{{run_id}}`
* set `{{goal_mdscript}}` to `{{run_dir}}/goal.mdscript.md`
* create `{{run_dir}}/artifacts/logs`, `captures`, `images`, `screenshots`, and `live`
* if `{{skip_goal_hooks}}` is empty
  * set `{{skip_goal_hooks}}` to `false`
* if `{{loop_driver}}` is empty and `{{skip_goal_hooks}}` is false
  * set `{{loop_driver}}` to `self-hooks`
* if `{{loop_driver}}` is empty and `{{skip_goal_hooks}}` is not false
  * set `{{loop_driver}}` to `harness-goal`
* write `{{goal_mdscript}}` as the only durable run tracker, in executable MDScript
* give `{{goal_mdscript}}` YAML front matter with these fields:
  * `active`, `status`, `goal`, paths, proof fields, and `resume_heading`
  * `iteration`, `started_at`, `skip_hooks`, and `loop_driver`
* after the front matter, write the exact execution header `<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->`
* write each heading in `{{goal_mdscript}}` as a `##` state, never as `#`
* include the `##` states `Goal Contract`, `Resume Goal`, `Pursue Goal`, `Complete Goal`, `Manual Stop`, and `Stop Hook Resume Command`
* write each state body as executable bullets with explicit `[State](#anchor)` branches
* if `{{skip_goal_hooks}}` is `true`, write in Goal Contract that harness `/goal` drives multi-round continuation
  * also write that the self-goal hooks are skipped
* before you report that the run started, make sure that `mdscript-exec {{goal_mdscript}}#pursue-goal` resolves to a real `##` state
* put the exact resume command `mdscript-exec {{goal_mdscript}}#pursue-goal` in `Stop Hook Resume Command`
  * hooks use it only when `skip_hooks` is false
  * when the harness drives the run, it is still the durable re-entry
* append `goal_started` to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`
  * include `goal_mdscript`, `loop_driver`, and `skip_hooks` in that entry
* append `{"event":"run_started","goal":"{{goal_text}}","proof_kind":"{{proof_kind}}","live_proof":"{{live_proof}}","goal_mdscript":"{{goal_mdscript}}","loop_driver":"{{loop_driver}}","skip_hooks":{{skip_goal_hooks}}}` to `{{run_dir}}/progress.jsonl`
* never overwrite earlier runs, logs, or artifact files
* return to the caller
