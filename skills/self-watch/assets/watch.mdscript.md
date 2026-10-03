---
artifact_type: self-watch
watch_active: true
status: active
resume_heading: resume-watch
project_name: "{{project_name}}"
pr_number: "{{pr_number}}"
pr_url: "{{pr_url}}"
repo: "{{repo}}"
repo_root: "{{repo_root}}"
head_ref: "{{head_ref}}"
base_ref: "{{base_ref}}"
interval: "{{interval}}"
interval_seconds: "{{interval_seconds}}"
sentinel: "{{sentinel}}"
owner_pid: "{{owner_pid}}"
ticker_pid: "{{ticker_pid}}"
ticker_pgid: "{{ticker_pgid}}"
ticker_pid_file: "{{ticker_pid_file}}"
tick_spool: "{{tick_spool}}"
stop_file: "{{stop_file}}"
agent_heartbeat: "{{agent_heartbeat}}"
max_idle_seconds: "{{max_idle_seconds}}"
wake_path: listener
last_processed_seq: 0
watch_grant: "{{watch_grant}}"
grant_excludes: "{{grant_excludes}}"
skill_root: "{{skill_root}}"
easy_model: "{{easy_model}}"
easy_effort: "{{easy_effort}}"
hard_model: "{{hard_model}}"
hard_effort: "{{hard_effort}}"
model_selection_basis: "{{model_selection_basis}}"
tick_count: 0
last_head_sha: ""
last_tick_at: ""
last_seen_at: ""
armed_at: "{{armed_at}}"
stopped_at: ""
stop_reason: ""
blocker: ""
owner_conversation_id: "{{owner_conversation_id}}"
owner_dialect: "{{owner_dialect}}"
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Watch Contract

* treat the YAML front matter of this file as the only source of truth for the watch state

* watch `{{pr_url}}` at each `{{interval}}` for unresolved review comments, CI/CD failures, and base-branch drift

* repair routine findings with `{{easy_model}}` at `{{easy_effort}}`

* repair hard findings with `{{hard_model}}` at `{{hard_effort}}`

* do the work in `{{watch_grant}}` and do not ask again

* if a finding is inside the grant
  * do the work in this tick
  * do not make it a proposal

* send only the items in `{{grant_excludes}}` to the user

* if a decision is not clear
  * run `/mdscript-exec {{skill_root}}/../self/SKILL.md`
  * decide from the current evidence
  * do not pause the watch to ask the user

* stop only on `/self-unwatch` or on PR `MERGED` / `CLOSED`

* report a merge-ready PR and do not stop

* keep exactly one armed ticker: `{{sentinel}}` at PID `{{ticker_pid}}`

* the ticker is self-detached into its own process group under PID 1

* because of this, the cleanup of an agent turn or a session cannot kill the ticker

* the ticker stops only on `/self-unwatch`, a terminal PR state, the end of owner process `{{owner_pid}}`, or the idle guard

* never kill the ticker from a tick, a resume, a subagent, or a cleanup pass

* the tick listener is disposable

* if the harness kills the tick listener
  * attach the listener again
  * keep the same ticker

## Resume Goal

* [Resume Watch](#resume-watch)

## Resume Watch

* restore each variable from the front matter of this file

* set `{{watch_mdscript}}` to the absolute path of this file

* if `watch_active` is not `true`
  * report that the watch is not active
  * tell the user to use `/self-watch` to start again
  * stop

* touch `{{agent_heartbeat}}` to tell the ticker idle guard that this agent still reads the ticks

* if `{{ticker_pid}}` is dead or its command line does not contain `{{sentinel}}`
  * run `mdscript-exec {{skill_root}}/workflows/ticker-process.mdscript.md#check-ticker-liveness`
  * if `{{owner_pid}}` is still alive
    * arm the ticker again one time through `mdscript-exec {{skill_root}}/SKILL.md#arm-persistent-interval-loop`
  * if `{{owner_pid}}` is gone
    * [Stop Watch](#stop-watch)

* if no tick listener is attached
  * run `mdscript-exec {{skill_root}}/workflows/ticker-process.mdscript.md#reattach-tick-listener`

* do not start a second ticker while one is alive

* [Watch Tick](#watch-tick)

## Watch Tick

* run `mdscript-exec {{skill_root}}/workflows/watch-tick.mdscript.md#watch-tick`

* set the front-matter `tick_count`, `last_head_sha`, `last_tick_at`, and `last_processed_seq` from that tick

* while the watch stays armed, set the front-matter `resume_heading` to `resume-watch`

* do not re-arm the ticker and do not set a one-shot wake

* end the turn

## Report Blocker

* run `mdscript-exec {{skill_root}}/workflows/watch-tick.mdscript.md#report-blocker`

* set the front-matter `blocker` to the exact human decision that is necessary

* keep `watch_active: true`

* keep the loop armed until the user runs `/self-unwatch`

## Stop Watch

* run `mdscript-exec {{skill_root}}/../self-unwatch/SKILL.md#stop-watch-loop`

* set the front-matter `watch_active: false`, `status` to the terminal state, `stopped_at`, and `stop_reason`

* set the front-matter `resume_heading` to `stop-watch`

## Loop Resume Command

```text
mdscript-exec {{watch_mdscript}}#resume-watch
```
