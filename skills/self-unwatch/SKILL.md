---
name: self-unwatch
description: "ALWAYS use this skill when the user runs /self-unwatch, asks to stop a PR watch, or cancels self-watch. Stop the harness-native loop or kill the detached ticker, and mark the watch goal MDScript inactive."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Unwatch

* set `{{pr}}` from the user message, if it names a PR
* otherwise list the files `~/.agents/projects/*/goals/self-watch-*.mdscript.md` with `watch_active: true`
  * if none is active, report that nothing is watched, and stop
  * if more than one is active, ask which PR to stop, with the number, URL, and interval
* set `{{watch_mdscript}}`, `{{pr_number}}`, and `{{pr_url}}` from the selected watch
* [Stop Watch Loop](#stop-watch-loop)
* report that the watch of `{{pr_url}}` stopped and will not tick again
* stop

## Stop Watch Loop

* read the front matter of `{{watch_mdscript}}`
* if `loop_driver` is `harness-native`, cancel the recorded harness loop
* otherwise stop the ticker:
  * create `stop_file` first, so the ticker exits at its next interval even if a kill fails
  * kill `ticker_pid` and its group `-{{ticker_pgid}}` if it still runs
  * kill each process whose command line has the `sentinel` (default `AGENT_LOOP_TICK_self_watch_{{pr_number}}`)
  * stop an attached tick listener, and clear its `notify_on_output` expectations
  * wait for the killed tasks, and make sure that no process for the sentinel remains
  * remove `ticker_pid_file`, and keep `tick_spool` as the record
* set `watch_active: false`, a terminal `status`, `resume_heading: stop-watch`, `stopped_at`, and `stop_reason` (`{{stop_reason}}`, or `user-unwatch`)
* return to the caller
