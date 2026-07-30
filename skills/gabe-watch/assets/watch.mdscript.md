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
loop_pid: "{{loop_pid}}"
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

* keep exactly one armed loop: `{{sentinel}}` at PID `{{loop_pid}}`

## Resume Goal

* [Resume Watch](#resume-watch)

## Resume Watch

* restore every variable from this file's front matter

* if `watch_active` is not `true`
  * report that the watch is inactive and suggest `/gabe-watch` to start again
  * stop

* if `{{loop_pid}}` is dead or its command line no longer contains `{{sentinel}}`
  * set `{{blocker}}` to persistent watch loop died; run `/gabe-watch` to re-arm once
  * [Report Blocker](#report-blocker)

* do not start, re-arm, or schedule any loop from this state

* [Watch Tick](#watch-tick)

## Watch Tick

* run `mdscript-exec {{skill_root}}/SKILL.md#watch-tick`

* set front-matter `tick_count`, `last_head_sha`, and `last_tick_at` from that tick

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
