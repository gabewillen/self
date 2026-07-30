---
name: gabe-watch
description: >-
  Watch a GitHub PR on a persistent fixed interval for unresolved review
  comments, CI/CD failures, and base-branch drift. Arms one while-true loop once
  and keeps ticking until /gabe-unwatch (or PR merged/closed). Spawns
  composer-2.5 for routine fixes or grok-4.5 for hard repairs, marks valid
  threads resolved, and keeps the branch in sync. Use for /gabe-watch,
  interval+PR babysitting, review-comment watching, or CI repair loops.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup Watch

* infer `{{pr}}` from the user message (PR URL, `owner/repo#N`, or PR number in the current repo)
* infer `{{interval}}` from the user message (`30s`, `5m`, `10m`, `1h`); default `5m` when omitted
* if `{{pr}}` is empty
  * ask the user for `{{pr}}` (GitHub PR URL or `owner/repo#N`)
* set `{{easy_model}}` to `composer-2.5-fast`
* set `{{hard_model}}` to `cursor-grok-4.5-high-fast`
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
* set `{{watch_state_path}}` to `~/.agents/projects/{{project_name}}/gabe-watch/pr-{{pr_number}}.json`
* create the parent directory of `{{watch_state_path}}` when missing
* create `~/.agents/projects/{{project_name}}/goals` when missing
* write or refresh `{{goal_mdscript}}` at `~/.agents/projects/{{project_name}}/goals/gabe-watch-{{pr_number}}.mdscript.md` with objective, `{{pr_url}}`, `{{interval}}`, models, stop condition `/gabe-unwatch`, and re-entry `/mdscript-exec {{skill_root}}/SKILL.md#resume-watch`
* tell the user the watch contract: PR, interval, models, state path, and that the loop runs until `/gabe-unwatch`
* [Arm Persistent Interval Loop](#arm-persistent-interval-loop)

## Arm Persistent Interval Loop

* convert `{{interval}}` to `{{interval_seconds}}`
* set `{{sentinel}}` to `AGENT_LOOP_TICK_gabe_watch_{{pr_number}}`
* if `{{watch_state_path}}` exists and records a live `loop_pid` whose command line still contains `{{sentinel}}`
  * reuse that PID as `{{loop_pid}}`
  * do not start a second loop
  * [Watch Tick](#watch-tick)
* if any terminal already runs a matching `{{sentinel}}` loop
  * reuse that PID as `{{loop_pid}}`
  * persist it to `{{watch_state_path}}`
  * do not start a second loop
  * [Watch Tick](#watch-tick)
* start exactly one background shell with a durable `while true` loop — arm once, never re-arm on ticks:

```bash
while true; do
  sleep {{interval_seconds}}
  echo '{{sentinel}} {"prompt":"/mdscript-exec {{skill_root}}/SKILL.md#resume-watch","pr":"{{pr_number}}","repo":"{{repo}}"}'
done
```

* set `notify_on_output` on that shell with pattern `^{{sentinel}}`
* record `{{loop_pid}}` from the shell
* smoke-check once that the loop is running and has not exited
* write `{{watch_state_path}}` with `watch_active=true`, `pr_number`, `pr_url`, `repo`, `repo_root`, `interval`, `interval_seconds`, `sentinel`, `loop_pid`, `skill_root`, `easy_model`, `hard_model`, `goal_mdscript`, `armed_at`
* run the first [Watch Tick](#watch-tick) immediately after arming
* end the turn after the tick — the persistent loop wakes the next `#resume-watch`; do not sleep, do not re-arm, do not schedule a one-shot fallback

## Resume Watch

* load `{{watch_state_path}}` for this PR when variables are missing (from the tick payload `pr` / user text)
* if `watch_active` in state is not `true`
  * stop and report the watch is inactive; suggest `/gabe-watch` to start again
* restore `{{pr_number}}`, `{{pr_url}}`, `{{repo}}`, `{{repo_root}}`, `{{interval}}`, `{{sentinel}}`, `{{loop_pid}}`, `{{skill_root}}`, `{{easy_model}}`, `{{hard_model}}`, `{{goal_mdscript}}` from state
* if `{{loop_pid}}` is dead or no longer matches `{{sentinel}}`
  * set `{{blocker}}` to persistent watch loop died; run `/gabe-watch` to re-arm once
  * [Report Blocker](#report-blocker)
* do not start or re-arm any loop from resume
* [Watch Tick](#watch-tick)

## Watch Tick

* increment `{{tick_count}}` and persist it on `{{watch_state_path}}`
* run [Refresh PR State](workflows/watch-tick.md#refresh-pr-state)
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
* append one ledger line under `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with tick, head SHA, CI summary, unresolved thread count, `loop_pid`, and that the persistent loop remains armed
* end the turn without re-arming, without `sleep`, and without a one-shot wake — the existing `while true` loop owns the next tick

## Report Blocker

* write a parent-visible note naming `{{blocker}}`, `{{pr_url}}`, current head, `loop_pid`, and the exact human decision needed
* keep `watch_active=true` and leave the persistent loop running unless the user runs `/gabe-unwatch`
* ask the user how to proceed
* end the turn without killing the loop and without re-arming
