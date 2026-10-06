<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Start Goal Run

* set `{{conversation_id}}` from the injected session context, or to a stable slug for this chat
* run [Resolve Agent Home](../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{session_dir}}` to `{{project_home}}/goal/sessions/{{conversation_id}}`, and create it
* set each earlier run of this session that is still `active: true` to `active: false`, and log `goal_superseded`
* set `{{run_id}}` to `YYYYMMDDTHHMMSSZ` plus a short random suffix, and `{{run_dir}}` to `{{session_dir}}/runs/{{run_id}}`
* create `{{run_dir}}/artifacts/` with `logs`, `captures`, `images`, `screenshots`, and `live`
* set `{{goal_mdscript}}` to `{{run_dir}}/goal.mdscript.md`, the only run tracker, as executable MDScript:
  * front matter as in [goal contracts](../references/goal-contracts.md), with `skip_hooks: {{skip_goal_hooks}}`, `loop_driver: {{loop_driver}}`, `self_review`, and `self_review_answer`
  * the execution header, then `## Goal Contract`, `## Resume Goal`, `## Pursue Goal`, `## Complete Goal`, `## Manual Stop`, and `## Stop Hook Resume Command`
  * `## Stop Hook Resume Command` holds `mdscript-exec {{goal_mdscript}}#pursue-goal`
* make sure that `#pursue-goal` resolves
* append `goal_started` to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`, and `run_started` to `{{run_dir}}/progress.jsonl`
* never overwrite earlier runs, logs, or artifacts
* return to the caller
