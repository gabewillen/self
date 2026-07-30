---
name: gabe-unwatch
description: >-
  Stop a persistent gabe-watch PR interval loop. Kills the while-true sentinel
  process, marks watch state inactive, and updates the goal MDScript. Use when
  the user runs /gabe-unwatch, asks to stop watching a PR, or cancel gabe-watch.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Unwatch

* infer `{{pr}}` from the user message when present; otherwise list active watches under `~/.agents/projects/*/gabe-watch/pr-*.json` with `watch_active=true`
* if multiple active watches and `{{pr}}` is empty
  * ask which PR to unwatch (show pr number, url, interval, loop_pid)
* if no active watches
  * report nothing to unwatch and stop
* resolve `{{pr_number}}`, `{{repo}}`, `{{project_name}}`, and `{{watch_state_path}}`
* [Stop Watch Loop](#stop-watch-loop)
* report that `/gabe-watch` for `{{pr_url}}` is stopped and the persistent loop will not tick again
* stop

## Stop Watch Loop

* load `{{watch_state_path}}` when not already loaded
* set `{{sentinel}}` from state (default `AGENT_LOOP_TICK_gabe_watch_{{pr_number}}`)
* set `{{loop_pid}}` from state when present
* if `{{loop_pid}}` is set and still running
  * kill that PID and its process group when safe
* also kill any remaining shell whose command line contains `{{sentinel}}` so orphaned loops cannot keep waking the agent
* await killed shell tasks so stale completion notifications are consumed
* set `watch_active=false`, `stopped_at`, and `stop_reason` on `{{watch_state_path}}` (`user-unwatch` unless caller already set `{{stop_reason}}`)
* update `{{goal_mdscript}}` status to terminal when the path is known
* clear `notify_on_output` expectations for this sentinel
* return to the caller
