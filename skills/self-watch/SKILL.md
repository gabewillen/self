---
name: self-watch
description: "ALWAYS use this skill on /self-watch or for an interval PR watch (`PR babysitting`) for review comments, CI repair, or base-branch drift. Use the harness built-in loop/automation if one exists. If not, arm one detached ticker fallback with a standing grant to fix/push/resolve until /self-unwatch or PR merge/close occurs. Select fast or high-effort models by the repair difficulty. Keep the state only in the goals/self-watch-<N>.mdscript.md file."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Setup Watch

* find `{{pr}}` in the user message (a PR URL, `owner/repo#N`, or a PR number in the current repo)
* set `{{interval}}` to the interval in the user message (`30s`, `5m`, `10m`, `1h`), or to `5m` if it has none
* if `{{pr}}` is empty
  * ask the user for `{{pr}}` (a GitHub PR URL or `owner/repo#N`)
  * [Setup Watch](#setup-watch)
* run [Select Configured Model And Reasoning](../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* set `{{easy_model}}` to the fastest available model that can correctly do mechanical fixes in one file
* set `{{easy_effort}}` to a low effort level
* set `{{hard_model}}` to the strongest available model for unclear, multi-file, or risky repairs
* set `{{hard_effort}}` to a high effort level
* record the reason for each model and effort level in `{{model_selection_basis}}`
* set `{{watcher_role}}` to `self-watch`
* set `{{stop_reason}}` and `{{blocker}}` to empty
* set `{{tick_count}}` to `0`
* set `{{watch_active}}` to `true`
* get the PR data with `gh pr view {{pr}} --json number,url,headRefName,baseRefName,headRepository,headRepositoryOwner,state,isDraft,mergeable,statusCheckRollup,reviews,reviewDecision`
* if that command fails
  * set `{{blocker}}` to cannot resolve PR `{{pr}}`
  * [Report Blocker](#report-blocker)
* set `{{pr_number}}`, `{{pr_url}}`, `{{head_ref}}`, `{{base_ref}}`, `{{repo}}` from that JSON
* set `{{repo_root}}` to the git toplevel of the local checkout of `{{repo}}`
* if `{{repo_root}}` is empty
  * ask the user for the local checkout path
  * set `{{repo_root}}` to that path
* if `{{repo_root}}` is still empty
  * set `{{blocker}}` to missing local checkout for `{{repo}}`
  * [Report Blocker](#report-blocker)
* set `{{skill_root}}` to the absolute directory of this skill
* set `{{skills_root}}` to the parent of `{{skill_root}}`
* set `{{project_name}}` from `{{repo}}`
* run [Resolve Agent Home](../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{watch_mdscript}}` to `{{project_home}}/goals/self-watch-{{pr_number}}.mdscript.md`
* make sure that the directory `{{project_home}}/goals` exists
* if a legacy `{{project_home}}/self-watch/pr-{{pr_number}}.json` exists and `{{watch_mdscript}}` does not exist
  * read that legacy state one time to get `loop_pid`, `sentinel`, and the contract fields
* write `{{watch_mdscript}}` from [watch.mdscript.md](assets/watch.mdscript.md)
* set `{{owner_conversation_id}}` to the harness session id of this chat (Cursor `conversation_id`, Claude/Codex `session_id`, Grok `sessionId` / `GROK_SESSION_ID`)
* if the harness gives no session id
  * set `{{owner_conversation_id}}` to empty
* set `{{owner_dialect}}` to `cursor`, `claude`, `codex`, or `grok` for the harness that arms the watch
* fill each front-matter field in `{{watch_mdscript}}` with the values for this watch, also `owner_conversation_id` and `owner_dialect`
* use the legacy `pr-{{pr_number}}.json` only as a read-only fallback, never for new writes
* run [Establish Watch Grant](#establish-watch-grant)
* tell the user the watch contract: PR, interval, models, `{{watch_mdscript}}`, the standing grant, and that the loop runs until `/self-unwatch`
* [Prefer Harness Native Loop](#prefer-harness-native-loop)

## Prefer Harness Native Loop

* before you start a ticker, find if the harness has a built-in interval loop, scheduled automation, reminder, or similar watcher
* if a built-in mechanism exists and can run `/mdscript-exec {{watch_mdscript}}#resume-watch` at the watch interval
  * set `{{harness_native_loop_available}}` to `true`
* if no built-in mechanism can do this
  * set `{{harness_native_loop_available}}` to `false`
* if `{{harness_native_loop_available}}` is `true`
  * set `{{loop_driver}}` to `harness-native`
  * create or change the harness-native automation/loop/reminder with the exact re-entry `/mdscript-exec {{watch_mdscript}}#resume-watch`
  * give it the standing grant, the stop condition (`/self-unwatch` or PR merged/closed), and the owner session binding
  * record `loop_driver: harness-native` and the harness automation id in the `{{watch_mdscript}}` front matter
  * do **not** start `self-watch-ticker.sh` or a different custom ticker while the harness-native loop is active
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
* make sure that the directory `{{watch_dir}}` exists
* make sure that no old `{{stop_file}}` exists
* run [Resolve Owner Process](#resolve-owner-process)
* run [Check Ticker Liveness](#check-ticker-liveness)
* if `{{ticker_alive}}` is `true`
  * do not start a second ticker
  * [Reattach Tick Listener](#reattach-tick-listener)
* if `{{watch_dir}}/self-watch-ticker.sh` does not exist or is not current
  * copy [self-watch-ticker.sh](assets/self-watch-ticker.sh) to `{{watch_dir}}/self-watch-ticker.sh`
  * make the copy executable
* start exactly one ticker in the foreground with this exact command and no `setsid`, `nohup`, `&`, or `disown`:

```bash
{{watch_dir}}/self-watch-ticker.sh \
  {{sentinel}} {{interval_seconds}} {{owner_pid}} \
  {{tick_spool}} {{ticker_heartbeat}} {{agent_heartbeat}} \
  {{stop_file}} {{max_idle_seconds}} {{ticker_pid_file}} \
  "/mdscript-exec {{watch_mdscript}}#resume-watch"
```

* expect that command to return immediately with status `0`
* never put the arm command in `setsid`, `nohup`, `&`, or `disown`
* never add a shell-specific detach branch
* after `{{ticker_pid_file}}` appears, read `{{ticker_pid}}` from it (or from the spool `armed` record)
* never take `{{ticker_pid}}` from `$!`
* set `{{ticker_pgid}}` from `ps -o pgid= -p {{ticker_pid}}`
* make sure that the ticker is detached:
  * `ps -o ppid= -p {{ticker_pid}}` must be `1` or a supervisor that reparents processes
  * `{{ticker_pgid}}` must not be the process group of this agent shell
* a new session id is not necessary
* set these front-matter fields in `{{watch_mdscript}}`:
  * `watch_active: true`, `status: active`, `resume_heading: resume-watch`, `pr_number`, `pr_url`, `repo`, `repo_root`, `head_ref`, and `base_ref`
  * `interval`, `interval_seconds`, `sentinel`, `owner_pid`, `ticker_pid`, `ticker_pgid`, `tick_spool`, `ticker_pid_file`, and `stop_file`
  * `skill_root`, `easy_model`, `hard_model`, `armed_at`, `owner_conversation_id`, and `owner_dialect`
* [Reattach Tick Listener](#reattach-tick-listener)

## Establish Watch Grant

* treat the watch that the user armed as a standing grant to do the watch tasks on `{{head_ref}}` until `/self-unwatch`
* do not ask again for each finding, each fix, or each tick
* set `{{watch_grant}}` to `edit, commit, push, reply, resolve threads, rerun and requeue checks, sync with base`
* set `{{grant_excludes}}` to `force-push, merge the PR, edit CI workflow definitions to make a check pass, changes outside this PR's scope, anything the user named as off-limits for this watch`
* record `watch_grant` and `grant_excludes` in the `{{watch_mdscript}}` front matter
* if a finding is inside `{{watch_grant}}`
  * do the work for that finding in this tick
  * do not make it a proposal for the user
* ask the user only about an item in `{{grant_excludes}}`, a real product-judgment question, or a disagreement with a reviewer
* if you are not sure about the scope, the authority, or the correct decision
  * if `{{skills_root}}` is empty
    * if the directory `{{repo_root}}/skills` exists
      * set `{{skills_root}}` to `{{repo_root}}/skills`
    * if that directory does not exist and `{{skill_root}}` is set
      * set `{{skills_root}}` to the parent of `{{skill_root}}`
  * run `/mdscript-exec {{skills_root}}/self/SKILL.md`
  * decide what the user would do from the current evidence
* if the `self` skill, the repo, and the PR evidence still cannot give a decision
  * ask the user as the last step

## Resolve Owner Process

* run [Resolve Owner Process](workflows/ticker-process.mdscript.md#resolve-owner-process)

## Check Ticker Liveness

* run [Check Ticker Liveness](workflows/ticker-process.mdscript.md#check-ticker-liveness)

## Reattach Tick Listener

* run [Reattach Tick Listener](workflows/ticker-process.mdscript.md#reattach-tick-listener)

## Resume Watch

* if the variables are not set
  * find `{{watch_mdscript}}` for this PR from the tick payload `pr` or the user text
* if `{{watch_mdscript}}` does not exist and a legacy `self-watch/pr-{{pr_number}}.json` exists
  * restore the state fields from that legacy file one time
  * write `{{watch_mdscript}}` from [watch.mdscript.md](assets/watch.mdscript.md)
  * use `{{watch_mdscript}}` from now on
* read the `{{watch_mdscript}}` front matter as the source of truth for the state
* if the front-matter `watch_active` is not `true`
  * report that the watch is not active, with `/self-watch` as the command to start again
  * stop
* restore each variable from that front matter
* touch `{{agent_heartbeat}}` to tell the ticker idle guard that this agent still reads the ticks
* run [Check Ticker Liveness](#check-ticker-liveness)
* if `{{ticker_alive}}` is `false` and `{{owner_pid}}` is still alive
  * treat this as a harness cleanup, not as a blocker
  * arm exactly one ticker again through [Arm Persistent Interval Loop](#arm-persistent-interval-loop)
  * record the new arm and its cause in the ledger
* if `{{ticker_alive}}` is `false` and `{{owner_pid}}` is gone
  * set `{{stop_reason}}` to owner process exited
  * run [Stop Watch Loop](../self-unwatch/SKILL.md#stop-watch-loop)
  * report that the session that owns the watch ended and that the watch stopped
  * stop
* if the tick listener does not run
  * [Reattach Tick Listener](#reattach-tick-listener)
* if `{{tick_spool}}` has tick records that are newer than the front-matter `last_processed_seq`
  * process the newest record now
  * set `last_processed_seq` to the highest seq that you saw
  * do not process each missed tick again one at a time
* [Watch Tick](#watch-tick)

## Watch Tick

* run [Watch Tick](workflows/watch-tick.mdscript.md#watch-tick) with `{{watch_mdscript}}` set for this watch
* do not re-arm the ticker, do not use `sleep`, and do not set a one-shot wake
* let the detached ticker start the next tick
* end the turn

## Report Blocker

* run [Report Blocker](workflows/watch-tick.mdscript.md#report-blocker) with `{{watch_mdscript}}` set for this watch
* do not kill the loop and do not re-arm it
* end the turn
