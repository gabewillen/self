---
name: self-unwatch
description: "ALWAYS use this skill when the user runs /self-unwatch, asks to stop watching a PR, or cancels self-watch: stop the harness-native loop when loop_driver is harness-native, otherwise kill the detached ticker/sentinel; mark watch state inactive; and update the watch goal MDScript."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Unwatch

* infer `{{pr}}` from the user message when present; otherwise list watches under `~/.agents/projects/*/goals/self-watch-*.mdscript.md` whose front matter has `watch_active: true`, including any legacy `~/.agents/projects/*/self-watch/pr-*.json` still marked active
* if multiple active watches and `{{pr}}` is empty
  * ask which PR to unwatch (show pr number, url, interval, loop_pid)
* if no active watches
  * report nothing to unwatch and stop
* resolve `{{pr_number}}`, `{{repo}}`, `{{project_name}}`, and `{{watch_mdscript}}`
* [Stop Watch Loop](#stop-watch-loop)
* report that `/self-watch` for `{{pr_url}}` is stopped and the persistent loop will not tick again
* stop

## Stop Watch Loop

* read `{{watch_mdscript}}` front matter when not already loaded, falling back to a legacy `self-watch/pr-{{pr_number}}.json` only when no MDScript exists
* set `{{loop_driver}}` from front matter when present
* if `{{loop_driver}}` is `harness-native`
  * cancel or disable the harness-native automation/loop/reminder recorded for this watch
  * do not require a ticker PID kill path when no custom ticker was armed
  * set front matter on `{{watch_mdscript}}` to `watch_active: false`, terminal `status`, `resume_heading: stop-watch`, `stopped_at`, and `stop_reason` (`user-unwatch` unless the caller already set `{{stop_reason}}`)
  * return to the caller
* set `{{sentinel}}` from front matter (default `AGENT_LOOP_TICK_self_watch_{{pr_number}}`)
* set `{{ticker_pid}}`, `{{ticker_pgid}}`, `{{ticker_pid_file}}`, `{{tick_spool}}`, and `{{stop_file}}` from front matter when present
* create `{{stop_file}}` first — the detached ticker exits on its own at the next interval even if the kill path fails or the PID is stale
* if `{{ticker_pid}}` is set and still running
  * kill that PID, and kill its process group with `kill -- -{{ticker_pgid}}`
* also kill any remaining process whose command line contains `{{sentinel}}` so orphaned tickers cannot keep spooling
* stop the disposable tick listener shell when one is attached
* remove `{{ticker_pid_file}}` once no process for this watch survives, and leave `{{tick_spool}}` in place as the tick record
* await killed shell tasks so stale completion notifications are consumed
* verify no process for `{{sentinel}}` remains before reporting the watch stopped
* set front matter on `{{watch_mdscript}}` to `watch_active: false`, terminal `status`, `resume_heading: stop-watch`, `stopped_at`, and `stop_reason` (`user-unwatch` unless the caller already set `{{stop_reason}}`)
* clear `notify_on_output` expectations for this sentinel
* return to the caller
