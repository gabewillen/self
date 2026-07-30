---
artifact_type: gabe-watch
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
skill_root: "{{skill_root}}"
easy_model: "{{easy_model}}"
hard_model: "{{hard_model}}"
tick_count: 0
last_head_sha: ""
last_tick_at: ""
armed_at: "{{armed_at}}"
stopped_at: ""
stop_reason: ""
blocker: ""
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Watch Contract

* treat this file's YAML front matter as the sole authoritative watch state

* keep `{{pr_url}}` watched every `{{interval}}` for unresolved review comments, CI/CD failures, and base-branch drift

* repair routine findings with `{{easy_model}}` and hard findings with `{{hard_model}}`

* stop only on `/gabe-unwatch` or PR `MERGED` / `CLOSED`; merge-ready is reported without stopping

* keep exactly one armed ticker: `{{sentinel}}` at PID `{{ticker_pid}}`, detached with `setsid` so agent-turn and session cleanup cannot reap it

* the ticker dies only on `/gabe-unwatch`, a terminal PR state, death of owner process `{{owner_pid}}`, or the idle guard; never reap it from a tick, resume, subagent, or cleanup pass

* the tick listener is disposable — if the harness kills it, re-attach it and keep the same ticker

## Resume Goal

* [Resume Watch](#resume-watch)

## Resume Watch

* restore every variable from this file's front matter

* if `watch_active` is not `true`
  * report that the watch is inactive and suggest `/gabe-watch` to start again
  * stop

* touch `{{agent_heartbeat}}` so the ticker's idle guard knows this agent is still consuming ticks

* if `{{ticker_pid}}` is dead or its command line no longer contains `{{sentinel}}`
  * run `mdscript-exec {{skill_root}}/SKILL.md#check-ticker-liveness`
  * re-arm once through `mdscript-exec {{skill_root}}/SKILL.md#arm-persistent-interval-loop` when owner process `{{owner_pid}}` is still alive
  * [Stop Watch](#stop-watch) when `{{owner_pid}}` is gone

* if no tick listener is attached
  * run `mdscript-exec {{skill_root}}/SKILL.md#reattach-tick-listener`

* do not start a second ticker while one is alive

* [Watch Tick](#watch-tick)

## Watch Tick

* run `mdscript-exec {{skill_root}}/SKILL.md#watch-tick`

* set front-matter `tick_count`, `last_head_sha`, `last_tick_at`, and `last_processed_seq` from that tick

* set front-matter `resume_heading` to `resume-watch` while the watch stays armed

* end the turn without re-arming and without a one-shot wake

## Report Blocker

* run `mdscript-exec {{skill_root}}/SKILL.md#report-blocker`

* set front-matter `blocker` to the exact human decision needed

* keep `watch_active: true` and leave the loop armed unless the user runs `/gabe-unwatch`

## Stop Watch

* run `mdscript-exec ~/.agents/skills/gabe-unwatch/SKILL.md#stop-watch-loop`

* set front-matter `watch_active: false`, `status` to the terminal state, `stopped_at`, and `stop_reason`

* set front-matter `resume_heading` to `stop-watch`

## Loop Resume Command

```text
mdscript-exec {{watch_mdscript}}#resume-watch
```
