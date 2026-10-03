<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Owner Process

* set `{{owner_pid}}` to a **long-lived** editor or harness process
* never use the temporary tool shell for this turn as `{{owner_pid}}`
* on Cursor / VS Code, use the first item of this list that you can find:
  * `VSCODE_PID` or `CURSOR_PID` from the environment, if that PID is still alive
  * the process in the parent chain that is `Cursor.app/Contents/MacOS/Cursor` (the main app binary), not `Cursor Helper`, not `extension-host`, not `agent-exec`
  * the outermost live ancestor of the current shell that is still the IDE
* on macOS, examine the selected PID with `ps -o pid=,command= -p {{owner_pid}}`
* on macOS, reject Helper / plugin host PIDs
* if you cannot find a long-lived owner
  * set `{{owner_pid}}` to `0`, so that the ticker uses only the idle guard and the stop file
* if the harness is Cursor
  * set `{{max_idle_seconds}}` to a minimum of twelve times `{{interval_seconds}}`
  * the listener often dies on Cursor, and the stop-hook drain path must have time to resume
* if the harness is not Cursor
  * set `{{max_idle_seconds}}` to a minimum of six times `{{interval_seconds}}`
* record `owner_pid_basis` in the watch front matter (for example `vscode_pid`, `cursor-main`, `parent-walk`, or `none`)

## Check Ticker Liveness

* if `{{ticker_pid_file}}` has a PID that runs and whose command line contains `{{sentinel}}`
  * set `{{ticker_alive}}` to `true`
  * return to the caller
* find each process that runs and whose command line contains `{{sentinel}}`
* discard each match whose parent is not `1` or a supervisor that reparents processes
* if exactly one match remains
  * use it as `{{ticker_pid}}`
  * write it again to `{{ticker_pid_file}}`
  * set `{{ticker_alive}}` to `true`
  * return to the caller
* if more than one match remains
  * keep the oldest as `{{ticker_pid}}`
  * kill the other matches
  * record the duplicate cleanup in the ledger
  * set `{{ticker_alive}}` to `true`
  * return to the caller
* set `{{ticker_alive}}` to `false`

## Reattach Tick Listener

* if this harness is Cursor
  * set `{{wake_path}}` to `cursor-notify-on-output`
* if this harness is not Cursor
  * set `{{wake_path}}` to `listener`
* never set `{{wake_path}}` to `scheduler`, unless you armed and examined a real durable harness scheduler in this turn
* start one background shell with `block_until_ms: 0` / background true that follows the spool:

```bash
tail -n0 -F {{tick_spool}}
```

* set `notify_on_output` on that shell with the pattern `^{{sentinel}}`
* when the pattern fires, resume `/mdscript-exec {{watch_mdscript}}#resume-watch` with the `prompt` field of the tick line, if it is there
* on Cursor, the listener is disposable and often dies when the chat is idle
* on Cursor, the detached ticker continues to write ticks to the spool
* on Cursor, Stop hooks and session-start context must drain the unprocessed ticks through `#resume-watch`
* if the harness has a durable native scheduler that stays alive after a session cleanup
  * if you examined that scheduler in this turn
    * use it instead of this listener
    * set `{{wake_path}}` to the name of that scheduler
* do not treat a dead listener as a dead watch
* immediately after the arm, run the first [Watch Tick](../SKILL.md#watch-tick)
* end the turn after that tick
* do not sleep, do not re-arm, and do not schedule a one-shot fallback
