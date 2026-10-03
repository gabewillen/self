---
name: self-unwatch
description: "ALWAYS use this skill when the user runs /self-unwatch, asks to stop a PR watch (`stop watching a PR`), or cancels self-watch. If loop_driver is harness-native, stop the harness-native loop. Otherwise, kill the detached ticker/sentinel. Mark the watch state inactive. Change the watch goal MDScript."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Unwatch

* if the user message names a PR
  * find `{{pr}}` in the user message
* otherwise list the watches under `~/.agents/projects/*/goals/self-watch-*.mdscript.md` whose front matter has `watch_active: true`
  * also list each legacy `~/.agents/projects/*/self-watch/pr-*.json` that is still marked active
* if more than one watch is active and `{{pr}}` is empty
  * ask which PR to unwatch (show the pr number, url, interval, and loop_pid)
* if no watch is active
  * report that there is nothing to unwatch
  * stop
* find `{{pr_number}}`, `{{repo}}`, `{{project_name}}`, and `{{watch_mdscript}}`
* [Stop Watch Loop](#stop-watch-loop)
* report that `/self-watch` for `{{pr_url}}` stopped and that the persistent loop will not tick again
* stop

## Stop Watch Loop

* if the `{{watch_mdscript}}` front matter is not loaded
  * if `{{watch_mdscript}}` exists, read its front matter
  * otherwise read the legacy `self-watch/pr-{{pr_number}}.json`
* if the front matter has a loop driver, set `{{loop_driver}}` from it
* if `{{loop_driver}}` is `harness-native`
  * cancel or disable the harness-native automation/loop/reminder recorded for this watch
  * if no custom ticker was armed, a ticker PID kill path is not necessary
  * set these front matter fields on `{{watch_mdscript}}`: `watch_active: false`, terminal `status`, `resume_heading: stop-watch`, and `stopped_at`
    * if the caller set `{{stop_reason}}`, set `stop_reason` to it
    * otherwise set `stop_reason` to `user-unwatch`
  * return to the caller
* set `{{sentinel}}` from the front matter (default `AGENT_LOOP_TICK_self_watch_{{pr_number}}`)
* if the front matter has them, set `{{ticker_pid}}`, `{{ticker_pgid}}`, `{{ticker_pid_file}}`, `{{tick_spool}}`, and `{{stop_file}}` from it
* create `{{stop_file}}` first. The detached ticker then exits at the next interval, also if the kill path fails or the PID is stale.
* if `{{ticker_pid}}` is set and that process still runs
  * kill that PID
  * kill its process group with `kill -- -{{ticker_pgid}}`
* kill each remaining process whose command line contains `{{sentinel}}`. This stops orphaned tickers that continue to spool.
* if a disposable tick listener shell is attached, stop it
* if no process for this watch is alive, remove `{{ticker_pid_file}}`
* keep `{{tick_spool}}` in place as the tick record
* wait for the killed shell tasks, so that the harness consumes their stale completion notifications
* before you report that the watch stopped, make sure that no process for `{{sentinel}}` remains
* set these front matter fields on `{{watch_mdscript}}`: `watch_active: false`, terminal `status`, `resume_heading: stop-watch`, and `stopped_at`
  * if the caller set `{{stop_reason}}`, set `stop_reason` to it
  * otherwise set `stop_reason` to `user-unwatch`
* clear the `notify_on_output` expectations for this sentinel
* return to the caller
