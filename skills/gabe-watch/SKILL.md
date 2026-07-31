---
name: gabe-watch
description: >-
  Watch a GitHub PR on a persistent fixed interval for unresolved review
  comments, CI/CD failures, and base-branch drift. Arms one detached ticker that
  survives harness cleanup and keeps ticking until /gabe-unwatch (or PR
  merged/closed). Arming is a standing grant: it fixes findings, pushes, and
  resolves threads itself instead of asking per fix. Selects a fast model for
  routine fixes and a high-effort model for hard repairs, marks valid threads
  resolved, and
  keeps the branch in sync. Watch state is MDScript-only:
  one goals/gabe-watch-<N>.mdscript.md whose YAML front matter is the sole
  authoritative state and whose body is the loop resume target. Use for
  /gabe-watch, interval+PR babysitting, review-comment watching, or CI repair
  loops.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup Watch

* infer `{{pr}}` from the user message (PR URL, `owner/repo#N`, or PR number in the current repo)
* infer `{{interval}}` from the user message (`30s`, `5m`, `10m`, `1h`); default `5m` when omitted
* if `{{pr}}` is empty
  * ask the user for `{{pr}}` (GitHub PR URL or `owner/repo#N`)
  * [Setup Watch](#setup-watch)
* run [Select Configured Model And Reasoning](../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `implementer`
* set `{{easy_model}}` to the fastest available model that can reliably land mechanical single-file fixes
* set `{{easy_effort}}` to a low effort level
* set `{{hard_model}}` to the strongest available model for ambiguous, multi-file, or risky repairs
* set `{{hard_effort}}` to a high effort level
* record why each model and effort level was chosen in `{{model_selection_basis}}`
* set `{{watcher_role}}` to `gabe-watch`
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
* set `{{skill_root}}` to this skill's absolute directory (`~/.agents/skills/gabe-watch` unless overridden)
* set `{{project_name}}` from `{{repo}}`
* run [Resolve Agent Home](../gabe-common/workflows/agent-home.md#resolve-agent-home)
* set `{{watch_mdscript}}` to `{{project_home}}/goals/gabe-watch-{{pr_number}}.mdscript.md`
* create `~/.agents/projects/{{project_name}}/goals` when missing
* if a legacy `~/.agents/projects/{{project_name}}/gabe-watch/pr-{{pr_number}}.json` exists and `{{watch_mdscript}}` does not
  * read that legacy state once to recover `loop_pid`, `sentinel`, and contract fields
* write `{{watch_mdscript}}` from [watch.mdscript.md](assets/watch.mdscript.md)
* fill every front-matter field on `{{watch_mdscript}}` with the resolved values for this watch
* leave legacy `pr-{{pr_number}}.json` unread for new writes
* treat legacy `pr-{{pr_number}}.json` as read-only fallback only
* run [Establish Watch Grant](#establish-watch-grant)
* tell the user the watch contract: PR, interval, models, `{{watch_mdscript}}`, the standing grant, and that the loop runs until `/gabe-unwatch`
* [Arm Persistent Interval Loop](#arm-persistent-interval-loop)

## Arm Persistent Interval Loop

* convert `{{interval}}` to `{{interval_seconds}}`
* set `{{sentinel}}` to `AGENT_LOOP_TICK_gabe_watch_{{pr_number}}`
* set `{{watch_dir}}` to `~/.agents/projects/{{project_name}}/gabe-watch`
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
* copy [gabe-watch-ticker.sh](assets/gabe-watch-ticker.sh) to `{{watch_dir}}/gabe-watch-ticker.sh` when missing or outdated and make it executable
* start exactly one ticker with this exact command, plain foreground, with no `setsid`, `nohup`, `&`, or `disown`:

```bash
{{watch_dir}}/gabe-watch-ticker.sh \
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
* set front matter on `{{watch_mdscript}}` with `watch_active: true`, `status: active`, `resume_heading: resume-watch`, `pr_number`, `pr_url`, `repo`, `repo_root`, `head_ref`, `base_ref`, `interval`, `interval_seconds`, `sentinel`, `owner_pid`, `ticker_pid`, `ticker_pgid`, `tick_spool`, `ticker_pid_file`, `stop_file`, `skill_root`, `easy_model`, `hard_model`, and `armed_at`
* [Reattach Tick Listener](#reattach-tick-listener)

## Establish Watch Grant

* treat arming this watch as the user's standing grant to do the watch's job on `{{head_ref}}` until `/gabe-unwatch`, without asking again per finding, per fix, or per tick
* set `{{watch_grant}}` to `edit, commit, push, reply, resolve threads, rerun and requeue checks, sync with base`
* set `{{grant_excludes}}` to `force-push, merge the PR, edit CI workflow definitions to make a check pass, changes outside this PR's scope, anything the user named as off-limits for this watch`
* record `watch_grant` and `grant_excludes` in `{{watch_mdscript}}` front matter
* a finding inside `{{watch_grant}}` is work to perform this tick, never a proposal to raise
* only an item in `{{grant_excludes}}`, a genuine product-judgment question, or a reviewer disagreement may become a question for the user
* when in doubt about scope, authority, or the right call
  * run `/mdscript-exec {{repo_root}}/skills/gabe/SKILL.md` when present, otherwise `/mdscript-exec ~/.agents/skills/gabe/SKILL.md`
  * decide as Gabe would from current evidence
* asking the user is the last resort after the `gabe` skill, the repo, and the PR evidence still leave the call genuinely undecidable

## Resolve Owner Process

* run [Resolve Owner Process](workflows/ticker-process.md#resolve-owner-process)

## Check Ticker Liveness

* run [Check Ticker Liveness](workflows/ticker-process.md#check-ticker-liveness)

## Reattach Tick Listener

* run [Reattach Tick Listener](workflows/ticker-process.md#reattach-tick-listener)

## Resume Watch

* resolve `{{watch_mdscript}}` for this PR when variables are missing (from the tick payload `pr` / user text)
* if `{{watch_mdscript}}` is missing but a legacy `gabe-watch/pr-{{pr_number}}.json` exists
  * restore state fields from that legacy file once
  * write `{{watch_mdscript}}` from [watch.mdscript.md](assets/watch.mdscript.md)
  * use `{{watch_mdscript}}` from now on
* read `{{watch_mdscript}}` front matter as the authoritative state
* if front-matter `watch_active` is not `true`
  * stop and report the watch is inactive; suggest `/gabe-watch` to start again
* restore `{{pr_number}}`, `{{pr_url}}`, `{{repo}}`, `{{repo_root}}`, `{{interval}}`, `{{sentinel}}`, `{{owner_pid}}`, `{{ticker_pid}}`, `{{tick_spool}}`, `{{ticker_pid_file}}`, `{{stop_file}}`, `{{skill_root}}`, `{{easy_model}}`, `{{hard_model}}`, and `{{tick_count}}` from that front matter
* touch `{{agent_heartbeat}}` so the ticker's idle guard knows this agent is still consuming ticks
* run [Check Ticker Liveness](#check-ticker-liveness)
* if `{{ticker_alive}}` is `false` and `{{owner_pid}}` is still running
  * treat this as harness cleanup, not as a blocker
  * re-arm exactly one ticker through [Arm Persistent Interval Loop](#arm-persistent-interval-loop) and record the re-arm and its cause in the ledger
* if `{{ticker_alive}}` is `false` and `{{owner_pid}}` is gone
  * set `{{stop_reason}}` to owner process exited
  * run [Stop Watch Loop](../gabe-unwatch/SKILL.md#stop-watch-loop)
  * report that the owning session ended and the watch stopped
  * stop
* if the tick listener is not running
  * [Reattach Tick Listener](#reattach-tick-listener)
* if `{{tick_spool}}` holds tick records newer than front-matter `last_processed_seq`
  * process the newest one now and set `last_processed_seq` to the highest seq seen; do not replay every missed tick individually
* [Watch Tick](#watch-tick)

## Watch Tick

* touch `{{agent_heartbeat}}` at the start of every tick so the ticker's idle guard stays satisfied
* increment `{{tick_count}}` and set it in `{{watch_mdscript}}` front matter with `last_head_sha`, `last_tick_at`, `last_seen_at`, and `last_processed_seq`
* run [Refresh PR State](workflows/watch-tick.md#refresh-pr-state), which re-reads checks, review threads, and conversation comments from GitHub on every tick
* if [Refresh PR State](workflows/watch-tick.md#refresh-pr-state) set `{{blocker}}`
  * [Report Blocker](#report-blocker)
* if `{{pr_state}}` is `MERGED` or `CLOSED`
  * set `{{stop_reason}}` to PR `{{pr_state}}`
  * run [Stop Watch Loop](../gabe-unwatch/SKILL.md#stop-watch-loop)
  * report that the PR ended and the watch stopped
  * stop
* run [Sync Branch](workflows/sync-branch.md#sync-branch)
* if sync sets `{{blocker}}`
  * [Report Blocker](#report-blocker)
* run [Repair CI](workflows/repair-ci.md#repair-ci)
* if CI repair sets a hard `{{blocker}}` that needs human authority
  * [Report Blocker](#report-blocker)
* run [Triage Review Comments](workflows/triage-review-comments.md#triage-review-comments)
* if triage left actionable items in `{{pending_fixes}}`
  * run [Dispatch Fixes](workflows/fix-with-subagent.md#dispatch-fixes)
* run [Evaluate Merge Ready](workflows/watch-tick.md#evaluate-merge-ready)
* if `{{merge_ready}}` is `true`
  * report merge-ready status for `{{pr_url}}` — keep watching until `/gabe-unwatch`
* report the tick as work already done: fixes applied, commits pushed, threads resolved, checks requeued, and what remains outside the grant
* do not end a tick with a proposal, a permission request, or work deferred to the next tick when the action was inside `{{watch_grant}}`
* if the tick surfaced an ambiguous call
  * resolve it through the `gabe` skill and act
  * do not park it as a question
* append one ledger line under `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with tick, head SHA, CI summary, unresolved thread count, `ticker_pid`, wake path, and that the detached ticker remains armed
* never kill, reap, or clean up the ticker, its process group, its spool, or its pid file from a tick, a resume, a subagent, a thread-cleanup pass, or an end-of-turn tidy; only `/gabe-unwatch`, a terminal PR state, or owner-process death may stop it
* end the turn without re-arming, without `sleep`, and without a one-shot wake — the detached ticker owns the next tick

## Report Blocker

* before reporting any blocker, confirm the item is truly in `{{grant_excludes}}` or genuinely undecidable; if the `gabe` skill and current evidence can decide it, act instead of reporting
* set front-matter `blocker` on `{{watch_mdscript}}` to the exact human decision needed
* write a parent-visible note naming `{{blocker}}`, `{{pr_url}}`, current head, `ticker_pid`, and `{{watch_mdscript}}`
* keep front-matter `watch_active: true` and leave the persistent loop running unless the user runs `/gabe-unwatch`
* keep repairing everything else inside the grant while the blocker waits — one blocked item never pauses the whole watch
* ask the user only the specific decision that is blocked
* end the turn without killing the loop and without re-arming
