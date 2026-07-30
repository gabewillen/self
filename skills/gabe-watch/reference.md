# gabe-watch reference

## Inputs

| Variable | Required | Notes |
|----------|----------|-------|
| `{{pr}}` | yes | PR URL, `owner/repo#N`, or number in current repo |
| `{{interval}}` | no | Default `5m`. Accepts `30s`, `5m`, `10m`, `1h` |
| `{{repo_root}}` | yes after setup | Local checkout used for sync/fix/push |

## Persistent loop (two processes, arm once)

Harnesses like Cursor reap background shells when a turn, tool call, or chat
session ends. So timekeeping and waking are split, and only the disposable half
is allowed to die:

| Process | Lifetime | Job |
|---------|----------|-----|
| **Ticker** — `assets/gabe-watch-ticker.sh`, launched `setsid nohup … & disown` | Survives turns and session cleanup. Exits only on `/gabe-unwatch`, terminal PR state, owner-process death, or the idle guard | Sleeps the interval, appends tick records to the spool |
| **Listener** — `tail -n0 -F <spool>` with `notify_on_output` | Disposable; expected to be killed | Relays a tick into the chat so the agent resumes |

If the harness kills the listener, the ticker keeps time and the spool keeps
every tick. The next resume re-attaches a listener and catches up from
`last_processed_seq`. If the harness kills the ticker anyway, resume re-arms it
automatically — a dead ticker is cleanup, not a blocker.

The ticker is deliberately tied to `owner_pid`, the editor/harness/agent-session
process: it must outlive the turn that armed it, but must not outlive the
session that wanted it.

```bash
setsid nohup <watch_dir>/gabe-watch-ticker.sh \
  <sentinel> <interval_seconds> <owner_pid> <spool> <ticker_hb> \
  <agent_hb> <stop_file> <max_idle_seconds> <pid_file> \
  "/mdscript-exec <watch_mdscript>#resume-watch" \
  >/dev/null 2>&1 </dev/null & disown
```

Each spooled tick carries its own resume prompt, so a woken agent has the exact
command even if it sees only the tick line:

```json
{"event":"tick","seq":7,"at":"…","prompt":"/mdscript-exec …#resume-watch"}
```

Rules:

- Take `ticker_pid` from the pid file the ticker writes, **never from `$!`** — `setsid`/`nohup` return the wrapper PID, not the ticker.
- Kill the group with `kill -- -<ticker_pgid>`; `setsid` puts the ticker in its own process group.
- `/gabe-unwatch` writes the stop file **first**, so the ticker exits on its own even if the kill path fails or the PID went stale.
- Never reap the ticker from a tick, resume, subagent, thread-cleanup pass, or end-of-turn tidy.
- The agent touches `agent_heartbeat` every tick; if it stops, the idle guard retires the orphan after `max_idle_seconds`.
- `#resume-watch` / `#watch-tick` must not start a one-shot `sleep` or fallback wake.
- Arm at most one ticker: adopt a live `sentinel` process instead of starting a second.
- Stop only via `/gabe-unwatch`, terminal PR state, or owner death. Merge-ready is reported but **does not** stop the watch.
- Prefer a harness-native durable scheduler over the listener when one exists, and record which wake path is in use.

Files under `~/.agents/projects/<project>/gabe-watch/`: `tick-<N>.jsonl` (spool),
`tick-<N>.pid`, `tick-<N>.ticker-hb`, `tick-<N>.agent-hb`, `tick-<N>.stop`.

## Watch state (MDScript front matter)

One artifact holds the whole watch: `~/.agents/projects/<project>/goals/gabe-watch-<N>.mdscript.md`, written from [assets/watch.mdscript.md](assets/watch.mdscript.md).

| Path | Rule |
|------|------|
| `goals/gabe-watch-<N>.mdscript.md` | Sole watch state (YAML front matter) + executable tracker + loop resume target |
| `gabe-watch/pr-<N>.json` | Legacy only — read fallback; not written for new watches |
| `lane-ledger.jsonl` | Append-only per-tick ledger |

Front matter is authoritative: `watch_active`, `status`, `resume_heading`, `pr_number`, `pr_url`, `repo`, `repo_root`, `head_ref`, `base_ref`, `interval`, `interval_seconds`, `sentinel`, `loop_pid`, `skill_root`, `easy_model`, `hard_model`, `tick_count`, `last_head_sha`, `last_tick_at`, `armed_at`, `stopped_at`, `stop_reason`, `blocker`.

Required headings: `Watch Contract`, `Resume Goal`, `Resume Watch`, `Watch Tick`, `Report Blocker`, `Stop Watch`, `Loop Resume Command`.

This file is the lane's goal MDScript, so watcher state stays under `goals/*.mdscript.md` with a stable re-entry:

```text
mdscript-exec ~/.agents/projects/<project>/goals/gabe-watch-<N>.mdscript.md#resume-watch
```

## Models

| Difficulty | Task `model` slug | Use for |
|------------|-------------------|---------|
| easy | `composer-2.5-fast` | Single-file nits, lint/format, typos, clear mechanical comment fixes, obvious missing imports, narrow test assertion updates |
| hard | `cursor-grok-4.5-high-fast` | Multi-file design, ambiguous or conflicting review threads, flaky/deep CI root cause, security/correctness disputes, sync regressions, anything needing broader reasoning |

If a slug is unavailable, use the closest equivalent composer-class or grok-class model and record the substitution in the ledger.

## Classify Difficulty

Mark `easy` when all of these hold:

- one file or tightly adjacent hunks
- the request is concrete and unambiguous
- no API/contract redesign
- verification is a fast local command

Mark `hard` when any of these hold:

- three or more files, or cross-package behavior
- reviewer asks for a different approach, not a local tweak
- CI failure lacks an obvious one-line cause
- security, concurrency, data-loss, or public API risk
- prior easy fixer failed on the same item

Workflows link here as `[Classify Difficulty](../reference.md#classify-difficulty)`.

## Stop conditions

| Event | Behavior |
|-------|----------|
| `/gabe-unwatch` | Kill loop, `watch_active=false` |
| PR `MERGED` / `CLOSED` | Auto-run stop-watch-loop |
| Merge-ready | Report only; keep looping |
| Soft blocker | Report; keep looping |

## Standing grant (do the job; do not ask to do the job)

Arming the watch **is** the grant. The watch exists to address review findings,
resolve threads, keep the branch in sync, and keep CI green — so an in-scope
finding is work for this tick, not a proposal for the user.

Granted, no confirmation per finding/fix/tick: edit, commit, push (non-force),
reply to threads, resolve threads, rerun or requeue checks, sync with base.

Excluded, still needs the user: force-push, merging the PR, editing CI workflow
definitions to make a check pass, changes outside this PR's scope, and anything
the user named off-limits for this watch.

- When in doubt about scope, authority, or the right call, use the `gabe` skill and decide as Gabe would from current evidence. Asking is the last resort, after `gabe`, the repo, and the PR evidence still leave it undecidable.
- Fix in the tick that found it. "Want me to push that fix on the next tick?" is a bug: apply, verify, push, report.
- Out-of-scope failures never gate in-scope repairs; fix what is in scope and report the rest as residue.
- A blocked item never pauses the rest of the watch.
- Report ticks as work done, not as a menu of options.
- Do not resolve threads you disagree with — reply with evidence and leave them open.
- Prefer minimal scoped fixes over drive-by refactors.

## Invocation

```text
/gabe-watch 5m https://github.com/org/repo/pull/123
/gabe-unwatch 123
/mdscript-exec ~/.agents/skills/gabe-watch/SKILL.md#setup-watch
/mdscript-exec ~/.agents/skills/gabe-watch/SKILL.md#resume-watch
/mdscript-exec ~/.agents/projects/<project>/goals/gabe-watch-<N>.mdscript.md#resume-watch
/mdscript-exec ~/.agents/skills/gabe-unwatch/SKILL.md#unwatch
```

## Relation to other Gabe skills

- `gabe-implement` / `mr-monitor`: implementer-owned monitor while building the PR
- `gabe-orchestrate` / `mr-comment-watcher`: coordinator routes comments to lanes
- `gabe-watch`: persistent interval watcher; repairs comments + CI; syncs branch
- `gabe-unwatch`: only user-facing stop for an armed gabe-watch loop
