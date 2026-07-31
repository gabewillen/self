<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Owner Process

* set `{{owner_pid}}` to a **long-lived** editor or harness process, never the transient tool shell for this turn
* on Cursor / VS Code, prefer in order:
  * `VSCODE_PID` or `CURSOR_PID` from the environment when that PID is still alive
  * the parent chain walk that lands on `Cursor.app/Contents/MacOS/Cursor` (the main app binary), not `Cursor Helper`, not `extension-host`, not `agent-exec`
  * otherwise the outermost living ancestor of the current shell that is still the IDE
* on macOS, verify the chosen PID with `ps -o pid=,command= -p {{owner_pid}}` and reject Helper / plugin host PIDs
* if no long-lived owner can be identified
  * set `{{owner_pid}}` to `0` so the ticker relies on the idle guard and stop file only
* set `{{max_idle_seconds}}` to at least twelve times `{{interval_seconds}}` on Cursor (listener death is common; give the stop-hook drain path time to resume)
* otherwise set `{{max_idle_seconds}}` to at least six times `{{interval_seconds}}`
* record `owner_pid_basis` in the watch front matter (for example `vscode_pid`, `cursor-main`, `parent-walk`, or `none`)

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

* set `{{wake_path}}` to `cursor-notify-on-output` when this harness is Cursor
* otherwise set `{{wake_path}}` to `listener`
* never set `{{wake_path}}` to `scheduler` unless a real durable harness scheduler was armed and verified this turn
* start one background shell that follows the spool with `block_until_ms: 0` / background true:

```bash
tail -n0 -F {{tick_spool}}
```

* set `notify_on_output` on that shell with pattern `^{{sentinel}}`
* when the pattern fires, resume `/mdscript-exec {{watch_mdscript}}#resume-watch` using the tick line's `prompt` field when present
* on Cursor, know that the listener is disposable and often dies when the chat goes idle — the detached ticker keeps writing ticks to the spool; Stop hooks and session-start context must drain pending ticks via `#resume-watch`
* if the harness offers a durable native scheduler that survives session cleanup and was verified this turn
  * use it instead of this listener
  * set `{{wake_path}}` to that scheduler's name
* do not treat a dead listener as a dead watch
* run the first [Watch Tick](../SKILL.md#watch-tick) immediately after arming
* end the turn after that tick
* do not sleep, do not re-arm, and do not schedule a one-shot fallback
