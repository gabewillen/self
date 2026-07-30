<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Owner Process

* set `{{owner_pid}}` to the editor, IDE, harness, or agent-session process that owns this chat
* find it by walking the parent chain of the current shell
* take the outermost ancestor that is still the harness or editor process, not the transient tool shell running this command
* if the harness exposes its own session or supervisor PID
  * set `{{owner_pid}}` to that value
* if no owner process can be identified
  * set `{{owner_pid}}` to `0`
  * rely on the idle guard alone
* set `{{max_idle_seconds}}` to at least six times `{{interval_seconds}}`

## Check Ticker Liveness

* if `{{ticker_pid_file}}` holds a PID that is running and whose command line contains `{{sentinel}}`
  * set `{{ticker_alive}}` to `true`
  * return to the caller
* scan for any running process whose command line contains `{{sentinel}}`
* discard any match whose parent is not `1` or a reparenting supervisor
* if exactly one match remains
  * adopt it as `{{ticker_pid}}`
  * refresh `{{ticker_pid_file}}`
  * set `{{ticker_alive}}` to `true`
  * return to the caller
* if more than one match remains
  * keep the oldest as `{{ticker_pid}}`
  * kill the rest
  * record the duplicate cleanup in the ledger
  * set `{{ticker_alive}}` to `true`
  * return to the caller
* set `{{ticker_alive}}` to `false`

## Reattach Tick Listener

* start one background shell that follows the spool:

```bash
tail -n0 -F {{tick_spool}}
```

* set `notify_on_output` on that shell with pattern `^{{sentinel}}`
* resume `/mdscript-exec {{watch_mdscript}}#resume-watch` when that pattern fires
* if the harness offers a durable native scheduler that survives session cleanup
  * use it instead of this listener
  * record which wake path is in use
* do not treat a dead listener as a dead watch
* run the first [Watch Tick](../SKILL.md#watch-tick) immediately after arming
* end the turn after that tick
* do not sleep, do not re-arm, and do not schedule a one-shot fallback
