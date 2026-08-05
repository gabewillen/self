---
name: self-watch
description: "ALWAYS use this skill when the user runs /self-watch or wants interval PR babysitting for review comments, CI repair, or base-branch drift: prefer the harness built-in loop/automation when one exists; otherwise arm one detached ticker fallback with a standing grant to fix/push/resolve until /self-unwatch or PR merge/close, keep state only in goals/self-watch-<N>.mdscript.md, and pick fast vs high-effort models by repair difficulty."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup Watch

* infer `{{pr}}` from the user message (PR URL, `owner/repo#N`, or PR number in the current repo)
* infer `{{interval}}` from the user message (`30s`, `5m`, `10m`, `1h`); default `5m` when omitted
* if `{{pr}}` is empty
  * ask the user for `{{pr}}` (GitHub PR URL or `owner/repo#N`)
  * [Setup Watch](#setup-watch)
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* set `{{easy_model}}` to the fastest available model that can reliably land mechanical single-file fixes
* set `{{easy_effort}}` to a low effort level
* set `{{hard_model}}` to the strongest available model for ambiguous, multi-file, or risky repairs
* set `{{hard_effort}}` to a high effort level
* record why each model and effort level was chosen in `{{model_selection_basis}}`
* set `{{watcher_role}}` to `self-watch`
* set `{{stop_reason}}` to empty
* set `{{blocker}}` to empty
* set `{{tick_count}}` to `0`
* set `{{watch_active}}` to `true`
* resolve the PR with `gh pr view {{pr}} --json number,url,headRefName,baseRefName,headRepository,headRepositoryOwner,state,isDraft,mergeable,statusCheckRollup,reviews,reviewDecision`
* if that command fails
  * set `{{blocker}}` to cannot resolve PR `{{pr}}`
  * [Report Blocker](#report-blocker)
* set `{{pr_number}}`, `{{pr_url}}`, `{{head_ref}}`, `{{base_ref}}`, `{{repo}}` from that JSON
* set `{{repo_root}}` to the git toplevel for `{{repo}}` when already checked out; otherwise ask for the local checkout path
* if `{{repo_root}}` is empty after asking
  * set `{{blocker}}` to missing local checkout for `{{repo}}`
  * [Report Blocker](#report-blocker)
* set `{{skill_root}}` to this skill's absolute directory
* set `{{skills_root}}` to the parent of `{{skill_root}}`
* set `{{project_name}}` from `{{repo}}`
* run [Resolve Agent Home](../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{watch_mdscript}}` to `{{project_home}}/goals/self-watch-{{pr_number}}.mdscript.md`
* create `{{project_home}}/goals` when missing
* if a legacy `{{project_home}}/self-watch/pr-{{pr_number}}.json` exists and `{{watch_mdscript}}` does not
  * read that legacy state once to recover `loop_pid`, `sentinel`, and contract fields
* write `{{watch_mdscript}}` from [watch.mdscript.md](assets/watch.mdscript.md)
* set `{{owner_conversation_id}}` to this chat's harness session id when known (Cursor `conversation_id`, Claude/Codex `session_id`, Grok `sessionId` / `GROK_SESSION_ID`); leave empty only when the harness gives no session id
* set `{{owner_dialect}}` to `cursor`, `claude`, `codex`, or `grok` for the arming harness
* fill every front-matter field on `{{watch_mdscript}}` with the resolved values for this watch, including `owner_conversation_id` and `owner_dialect`
* leave legacy `pr-{{pr_number}}.json` unread for new writes
* treat legacy `pr-{{pr_number}}.json` as read-only fallback only
* run [Establish Watch Grant](#establish-watch-grant)
* tell the user the watch contract: PR, interval, models, `{{watch_mdscript}}`, the standing grant, and that the loop runs until `/self-unwatch`
* [Prefer Harness Native Loop](#prefer-harness-native-loop)

## Prefer Harness Native Loop

* before starting any custom detached ticker, detect whether the current harness already provides an interval loop, scheduled automation, reminder, or equivalent native watcher
* set `{{harness_native_loop_available}}` to `true` when such a built-in mechanism exists and can run `/mdscript-exec {{watch_mdscript}}#resume-watch` on the watch cadence
* otherwise set `{{harness_native_loop_available}}` to `false`
* if `{{harness_native_loop_available}}` is `true`
  * set `{{loop_driver}}` to `harness-native`
  * create or update the harness-native automation/loop/reminder with exact re-entry `/mdscript-exec {{watch_mdscript}}#resume-watch`, the standing grant, stop condition (`/self-unwatch` or PR merged/closed), and owner session binding
  * record `loop_driver: harness-native` and the harness automation id in `{{watch_mdscript}}` front matter
  * do **not** launch `self-watch-ticker.sh` or any other custom ticker while the harness-native loop is active
  * skip [Arm Persistent Interval Loop](#arm-persistent-interval-loop)
* if `{{harness_native_loop_available}}` is `false`
  * set `{{loop_driver}}` to `custom-ticker`
  * [Arm Persistent Interval Loop](#arm-persistent-interval-loop)

## Arm Persistent Interval Loop

* convert `{{interval}}` to `{{interval_seconds}}`
* set `{{sentinel}}` to `AGENT_LOOP_TICK_self_watch_{{pr_number}}`
* set `{{watch_dir}}` to `{{project_home}}/self-watch`
* set `{{tick_spool}}` to `{{watch_dir}}/tick-{{pr_number}}.jsonl`
* set `{{ticker_pid_file}}` to `{{watch_dir}}/tick-{{pr_number}}.pid`
* set `{{ticker_heartbeat}}` to `{{watch_dir}}/tick-{{pr_number}}.ticker-hb`
* set `{{agent_heartbeat}}` to `{{watch_dir}}/tick-{{pr_number}}.agent-hb`
* set `{{stop_file}}` to `{{watch_dir}}/tick-{{pr_number}}.stop`
* create `{{watch_dir}}` when missing
* delete a stale `{{stop_file}}` when present
* run [Resolve Owner Process](#resolve-owner-process)
* run [Check Ticker Liveness](#check-ticker-liveness)
* if `{{ticker_alive}}` is `true`
  * do not start a second ticker
  * [Reattach Tick Listener](#reattach-tick-listener)
* copy [self-watch-ticker.sh](assets/self-watch-ticker.sh) to `{{watch_dir}}/self-watch-ticker.sh` when missing or outdated and make it executable
* start exactly one ticker with this exact command, plain foreground, with no `setsid`, `nohup`, `&`, or `disown`:

```bash
{{watch_dir}}/self-watch-ticker.sh \
  {{sentinel}} {{interval_seconds}} {{owner_pid}} \
  {{tick_spool}} {{ticker_heartbeat}} {{agent_heartbeat}} \
  {{stop_file}} {{max_idle_seconds}} {{ticker_pid_file}} \
  "/mdscript-exec {{watch_mdscript}}#resume-watch"
```

* expect that command to return immediately with status `0`
* never wrap the arming command in `setsid`, `nohup`, `&`, or `disown`, and never add a shell-specific detach branch
* read `{{ticker_pid}}` from `{{ticker_pid_file}}` (or the spool `armed` record) once the file appears
* never take `{{ticker_pid}}` from `$!`
* set `{{ticker_pgid}}` from `ps -o pgid= -p {{ticker_pid}}`
* confirm the ticker is detached: `ps -o ppid= -p {{ticker_pid}}` is `1` (or a reparenting supervisor) and `{{ticker_pgid}}` is not this agent shell's process group
* do not require a new session id
* set front matter on `{{watch_mdscript}}` with `watch_active: true`, `status: active`, `resume_heading: resume-watch`, `pr_number`, `pr_url`, `repo`, `repo_root`, `head_ref`, `base_ref`, `interval`, `interval_seconds`, `sentinel`, `owner_pid`, `ticker_pid`, `ticker_pgid`, `tick_spool`, `ticker_pid_file`, `stop_file`, `skill_root`, `easy_model`, `hard_model`, `armed_at`, `owner_conversation_id`, and `owner_dialect`
* [Reattach Tick Listener](#reattach-tick-listener)

## Establish Watch Grant

* treat arming this watch as the user's standing grant to do the watch's job on `{{head_ref}}` until `/self-unwatch`, without asking again per finding, per fix, or per tick
* set `{{watch_grant}}` to `edit, commit, push, reply, resolve threads, rerun and requeue checks, sync with base`
* set `{{grant_excludes}}` to `force-push, merge the PR, edit CI workflow definitions to make a check pass, changes outside this PR's scope, anything the user named as off-limits for this watch`
* record `watch_grant` and `grant_excludes` in `{{watch_mdscript}}` front matter
* a finding inside `{{watch_grant}}` is work to perform this tick, never a proposal to raise
* only an item in `{{grant_excludes}}`, a genuine product-judgment question, or a reviewer disagreement may become a question for the user
* when in doubt about scope, authority, or the right call
  * if `{{skills_root}}` is empty
    * set `{{skills_root}}` to `{{repo_root}}/skills` when that directory exists
    * otherwise set `{{skills_root}}` to the parent of `{{skill_root}}` when `{{skill_root}}` is set
  * run `/mdscript-exec {{skills_root}}/self/SKILL.md`
  * decide what the user would do from current evidence
* asking the user is the last resort after the `self` skill, the repo, and the PR evidence still leave the call genuinely undecidable

## Resolve Owner Process

* run [Resolve Owner Process](workflows/ticker-process.mdscript.md#resolve-owner-process)

## Check Ticker Liveness

* run [Check Ticker Liveness](workflows/ticker-process.mdscript.md#check-ticker-liveness)

## Reattach Tick Listener

* run [Reattach Tick Listener](workflows/ticker-process.mdscript.md#reattach-tick-listener)

## Resume Watch

* resolve `{{watch_mdscript}}` for this PR when variables are missing (from the tick payload `pr` / user text)
* if `{{watch_mdscript}}` is missing but a legacy `self-watch/pr-{{pr_number}}.json` exists
  * restore state fields from that legacy file once
  * write `{{watch_mdscript}}` from [watch.mdscript.md](assets/watch.mdscript.md)
  * use `{{watch_mdscript}}` from now on
* read `{{watch_mdscript}}` front matter as the authoritative state
* if front-matter `watch_active` is not `true`
  * stop and report the watch is inactive; suggest `/self-watch` to start again
* restore every variable from that front matter
* touch `{{agent_heartbeat}}` so the ticker's idle guard knows this agent is still consuming ticks
* run [Check Ticker Liveness](#check-ticker-liveness)
* if `{{ticker_alive}}` is `false` and `{{owner_pid}}` is still running
  * treat this as harness cleanup, not as a blocker
  * re-arm exactly one ticker through [Arm Persistent Interval Loop](#arm-persistent-interval-loop) and record the re-arm and its cause in the ledger
* if `{{ticker_alive}}` is `false` and `{{owner_pid}}` is gone
  * set `{{stop_reason}}` to owner process exited
  * run [Stop Watch Loop](../self-unwatch/SKILL.md#stop-watch-loop)
  * report that the owning session ended and the watch stopped
  * stop
* if the tick listener is not running
  * [Reattach Tick Listener](#reattach-tick-listener)
* if `{{tick_spool}}` holds tick records newer than front-matter `last_processed_seq`
  * process the newest one now and set `last_processed_seq` to the highest seq seen; do not replay every missed tick individually
* [Watch Tick](#watch-tick)

## Watch Tick

* run [Watch Tick](workflows/watch-tick.mdscript.md#watch-tick) with `{{watch_mdscript}}` set for this watch
* end the turn without re-arming, without `sleep`, and without a one-shot wake — the detached ticker owns the next tick

## Report Blocker

* run [Report Blocker](workflows/watch-tick.mdscript.md#report-blocker) with `{{watch_mdscript}}` set for this watch
* end the turn without killing the loop and without re-arming
