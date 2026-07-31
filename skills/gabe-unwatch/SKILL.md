---
name: gabe-unwatch
description: "ALWAYS use this skill when the user runs /gabe-unwatch, asks to stop watching a PR, or cancels gabe-watch: kill the detached ticker/sentinel, mark watch state inactive, and update the watch goal MDScript."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Unwatch

* infer `{{pr}}` from the user message when present; otherwise list watches under `~/.agents/projects/*/goals/gabe-watch-*.mdscript.md` whose front matter has `watch_active: true`, including any legacy `~/.agents/projects/*/gabe-watch/pr-*.json` still marked active
* if multiple active watches and `{{pr}}` is empty
  * ask which PR to unwatch (show pr number, url, interval, loop_pid)
* if no active watches
  * report nothing to unwatch and stop
* resolve `{{pr_number}}`, `{{repo}}`, `{{project_name}}`, and `{{watch_mdscript}}`
* [Stop Watch Loop](#stop-watch-loop)
* report that `/gabe-watch` for `{{pr_url}}` is stopped and the persistent loop will not tick again
* stop

## Stop Watch Loop

* read `{{watch_mdscript}}` front matter when not already loaded, falling back to a legacy `gabe-watch/pr-{{pr_number}}.json` only when no MDScript exists
* set `{{sentinel}}` from front matter (default `AGENT_LOOP_TICK_gabe_watch_{{pr_number}}`)
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
