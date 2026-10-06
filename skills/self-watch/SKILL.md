---
name: self-watch
description: "ALWAYS use this skill on /self-watch or for an interval PR watch (PR babysitting): review comments, CI repair, and base drift. Use the harness's own loop if one exists; otherwise arm one detached ticker. The user's arm is a standing grant to fix, push, reply, and resolve until /self-unwatch or the PR merges or closes. Make the smallest fix that clears each finding (Ponytail), with a fast model for easy fixes and a strong one for hard ones. State lives only in goals/self-watch-<N>.mdscript.md."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup Watch

* set `{{pr}}` from the user message: a PR URL, `owner/repo#N`, or a number
* if `{{pr}}` is empty, ask the user for it
* set `{{interval}}` from the message (`30s`, `5m`, `10m`, `1h`), or `5m`
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
  * set `{{easy_model}}` and `{{easy_effort}}` to the fastest model at low effort that fixes one-file mechanical issues
  * set `{{hard_model}}` and `{{hard_effort}}` to the strongest model at high effort for unclear, multi-file, or risky repairs
* run `gh pr view {{pr}} --json number,url,headRefName,baseRefName,headRepository,headRepositoryOwner,state,isDraft,mergeable,statusCheckRollup,reviews,reviewDecision`
  * if it fails, set `{{blocker}}` to `cannot resolve PR {{pr}}`, and [Report Blocker](#report-blocker)
* set `{{pr_number}}`, `{{pr_url}}`, `{{head_ref}}`, `{{base_ref}}`, and `{{repo}}` from it
* set `{{repo_root}}` to the local checkout of `{{repo}}`; if none exists, ask the user, or [Report Blocker](#report-blocker)
* set `{{skill_root}}` to this skill's directory, and `{{skills_root}}` to its parent
* run [Resolve Agent Home](../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{watch_mdscript}}` to `{{project_home}}/goals/self-watch-{{pr_number}}.mdscript.md`, and write it from [watch.mdscript.md](assets/watch.mdscript.md)
* set `owner_conversation_id` to the harness session id (Cursor `conversation_id`, Claude or Codex `session_id`, Grok `sessionId`), or empty
* set `owner_dialect` to `cursor`, `claude`, `codex`, or `grok`
* fill each front-matter field of `{{watch_mdscript}}`
* [Establish Watch Grant](#establish-watch-grant)
* tell the user the PR, interval, models, `{{watch_mdscript}}`, the grant, and that the loop runs until `/self-unwatch`
* [Prefer Harness Native Loop](#prefer-harness-native-loop)

## Establish Watch Grant

* set `{{watch_grant}}` to `edit, commit, push, reply, resolve threads, rerun and requeue checks, sync with base` on `{{head_ref}}`
* set `{{grant_excludes}}` to `force-push, merge the PR, edit CI workflow definitions to make a check pass, changes outside this PR's scope`, plus anything the user excluded
* record both in the front matter
* do each in-grant finding in its tick; do not turn it into a proposal or ask again
* ask the user only about an excluded item, a real product decision, or a disagreement with a reviewer
* if scope or authority is unclear
  * run `/mdscript-exec {{skills_root}}/self/SKILL.md`, and decide what the user would do
  * ask only as the last step

## Prefer Harness Native Loop

* if the harness has a built-in loop, schedule, or reminder that can run `/mdscript-exec {{watch_mdscript}}#resume-watch` at `{{interval}}`
  * create it with the grant, the stop condition (`/self-unwatch`, or the PR merged or closed), and the owner session
  * record `loop_driver: harness-native` and its id in the front matter
  * do not start a ticker, and stop here
* otherwise set `{{loop_driver}}` to `custom-ticker`, and [Arm Persistent Interval Loop](#arm-persistent-interval-loop)

## Arm Persistent Interval Loop

* set `{{interval_seconds}}` from `{{interval}}`, and `{{sentinel}}` to `AGENT_LOOP_TICK_self_watch_{{pr_number}}`
* set `{{watch_dir}}` to `{{project_home}}/self-watch`, and create it
* set `{{tick_spool}}`, `{{ticker_pid_file}}`, `{{ticker_heartbeat}}`, `{{agent_heartbeat}}`, and `{{stop_file}}` to `{{watch_dir}}/tick-{{pr_number}}.jsonl`, `.pid`, `.ticker-hb`, `.agent-hb`, and `.stop`
* remove an old `{{stop_file}}`
* run [Resolve Owner Process](workflows/ticker-process.mdscript.md#resolve-owner-process)
* run [Check Ticker Liveness](workflows/ticker-process.mdscript.md#check-ticker-liveness)
  * if `{{ticker_alive}}` is `true`, do not start a second ticker, and run [Reattach Tick Listener](workflows/ticker-process.mdscript.md#reattach-tick-listener)
* copy [self-watch-ticker.sh](assets/self-watch-ticker.sh) to `{{watch_dir}}` if it is missing or old, and make it executable
* start exactly one ticker in the foreground, with no `setsid`, `nohup`, `&`, or `disown`
* expect it to return `0` at once

```bash
{{watch_dir}}/self-watch-ticker.sh \
  {{sentinel}} {{interval_seconds}} {{owner_pid}} \
  {{tick_spool}} {{ticker_heartbeat}} {{agent_heartbeat}} \
  {{stop_file}} {{max_idle_seconds}} {{ticker_pid_file}} \
  "/mdscript-exec {{watch_mdscript}}#resume-watch"
```

* read `{{ticker_pid}}` from `{{ticker_pid_file}}` or the spool `armed` record, never from `$!`
* set `{{ticker_pgid}}` from `ps -o pgid= -p {{ticker_pid}}`
* make sure that the ticker's parent is `1` or a reparenting supervisor
* make sure that its process group is not this shell's group
* write `watch_active: true`, `status: active`, and `resume_heading: resume-watch` to the front matter
* also write the PR fields, the interval, the ticker fields, the models, `armed_at`, and the owner fields
* run [Reattach Tick Listener](workflows/ticker-process.mdscript.md#reattach-tick-listener)

## Resume Watch

* find `{{watch_mdscript}}` from the tick payload or the user text, and restore each variable from its front matter
* if `watch_active` is not `true`, report that the watch is off and that `/self-watch` starts it again, and stop
* touch `{{agent_heartbeat}}`
* run [Check Ticker Liveness](workflows/ticker-process.mdscript.md#check-ticker-liveness)
  * if the ticker is gone and `{{owner_pid}}` lives, arm one ticker again with [Arm Persistent Interval Loop](#arm-persistent-interval-loop), and record why
  * if the ticker and the owner are gone, set `{{stop_reason}}` to `owner process exited`, run [Stop Watch Loop](../self-unwatch/SKILL.md#stop-watch-loop), report it, and stop
* if the tick listener is not running, run [Reattach Tick Listener](workflows/ticker-process.mdscript.md#reattach-tick-listener)
* process only the newest spool record after `last_processed_seq`, and set `last_processed_seq` to the highest seq
* [Watch Tick](#watch-tick)

## Watch Tick

* run [Watch Tick](workflows/watch-tick.mdscript.md#watch-tick) for `{{watch_mdscript}}`
* do not re-arm the ticker, `sleep`, or set a one-shot wake; the ticker starts the next tick
* end the turn

## Report Blocker

* run [Report Blocker](workflows/watch-tick.mdscript.md#report-blocker) for `{{watch_mdscript}}`
* do not kill or re-arm the loop
* end the turn
