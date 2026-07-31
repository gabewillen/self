# self-watch reference

## Inputs

| Variable | Required | Notes |
|----------|----------|-------|
| `{{pr}}` | yes | PR URL, `owner/repo#N`, or number in current repo |
| `{{interval}}` | no | Default `5m`. Accepts `30s`, `5m`, `10m`, `1h` |
| `{{repo_root}}` | yes after setup | Local checkout used for sync/fix/push |

## Cursor on macOS — known failure modes

macOS **ticker detach works**. Live evidence from a Cursor-armed watch showed
ticks every 5m under PPID 1, then exit for:

| Spool reason | Meaning |
|--------------|---------|
| `agent-idle` | agent stopped touching `agent_heartbeat` (listener died; chat never resumed) |
| `owner-gone` | `owner_pid` was a short-lived process (tool shell / helper), not Cursor.app main |

Cursor-specific wake problems:

1. **Listener dies** — `tail -F` + `notify_on_output` is disposable; Cursor often kills it when the chat goes idle (known Cursor rough edge).
2. **Ticks still write** — the detached ticker keeps appending to the spool.
3. **Nothing wakes the chat** until a Stop/session hook drains pending ticks or the user pastes `#resume-watch`.
4. **Do not set `wake_path: scheduler`** unless a real durable scheduler was verified. Prefer `cursor-notify-on-output` or `listener`.

Mitigations shipped in this pack:

- Resolve `owner_pid` to Cursor.app main / `VSCODE_PID`, not Helper hosts.
- Longer `max_idle_seconds` on Cursor (12× interval).
- Stop hooks drain pending spool ticks before learn (`#resume-watch`).
- SessionStart injects active/pending watch context so a new turn re-attaches the listener.

Manual recovery when stuck:

```bash
# Is the ticker alive?
pgrep -fl AGENT_LOOP_TICK_self_watch

# Spool / heartbeats
ls -la ~/.agents/projects/*/self-watch/

# Force a tick drain in Cursor chat:
mdscript-exec ~/.agents/projects/<project>/goals/self-watch-<N>.mdscript.md#resume-watch
```

Opt out of watch stop/session hooks: `SELF_WATCH_SKIP_HOOKS=1`.

## Persistent loop (two processes, arm once)

Harnesses like Cursor reap background shells when a turn, tool call, or chat
session ends. So timekeeping and waking are split, and only the disposable half
is allowed to die:

| Process | Lifetime | Job |
|---------|----------|-----|
| **Ticker** — `assets/self-watch-ticker.sh`, launched as one plain foreground command; it self-detaches | Survives turns and session cleanup. Exits only on `/self-unwatch`, terminal PR state, owner-process death, or the idle guard | Sleeps the interval, appends tick records to the spool |
| **Listener** — `tail -n0 -F <spool>` with `notify_on_output` | Disposable; expected to be killed | Relays a tick into the chat so the agent resumes |

If the harness kills the listener, the ticker keeps time and the spool keeps
every tick. The next resume re-attaches a listener and catches up from
`last_processed_seq`. If the harness kills the ticker anyway, resume re-arms it
automatically — a dead ticker is cleanup, not a blocker.

The ticker is deliberately tied to `owner_pid`, the editor/harness/agent-session
process: it must outlive the turn that armed it, but must not outlive the
session that wanted it.

```bash
<watch_dir>/self-watch-ticker.sh \
  <sentinel> <interval_seconds> <owner_pid> <spool> <ticker_hb> \
  <agent_hb> <stop_file> <max_idle_seconds> <pid_file> \
  "/mdscript-exec <watch_mdscript>#resume-watch"
```

The script self-detaches, so the arming line carries no `setsid`, `nohup`, `&`,
or `disown` and no per-OS branch. macOS ships no `setsid`: the old
`setsid nohup … & disown` line silently degraded to an ordinary background job
of the agent shell, and session cleanup reaped the ticker — pid file pointing at
a dead PID, frozen ticker heartbeat, spool holding only the `armed` record.

Detach happens inside the script, best mechanism first:

| Mechanism | When | Result |
|-----------|------|--------|
| `setsid` | present (Linux) | New session and process group, parent PID 1 |
| `( set -m; cmd & )` subshell | no `setsid` (macOS) | New **process group**, parent PID 1, session id unchanged |
| `python3 -c` `os.setsid()` | no `setsid` and no bash job control | New session and process group, parent PID 1 |

`python3` is a last-resort branch only — the macOS path needs no dependency
beyond bash. `SELF_WATCH_DETACH=setsid|subshell|python3` forces one mechanism
for testing; `SELF_WATCH_DETACHED` is the internal re-exec marker.

Each spooled tick carries its own resume prompt, so a woken agent has the exact
command even if it sees only the tick line:

```json
{"event":"tick","seq":7,"at":"…","prompt":"/mdscript-exec …#resume-watch"}
```

Why the arming command has no wrapper: macOS ships no `setsid`, so a shell-side
detach line is not portable — it silently degrades to an ordinary background job
that session cleanup reaps. The script self-detaches instead, choosing `setsid`,
then a `set -m` subshell, then a python3 `os.setsid()` fallback, and verifies the
ticker came up before accepting a mechanism. On hosts without `setsid` the ticker
gets its own process group and reparents to PID 1 but keeps the launching session
id; process-group kills are what session cleanup uses, so that is sufficient.

Rules:

- Arm with the plain foreground command above; it returns `0` at once because the copy you invoked is only a launcher.
- Take `ticker_pid` from the pid file the ticker writes, **never from `$!`** — the launcher exits immediately and its PID is not the ticker's.
- Verify detachment by parent PID `1` and a process group that is not the agent shell's; **do not** require a new session id, which the no-`setsid` path does not get.
- Kill the group with `kill -- -<ticker_pgid>`; every detach mechanism puts the ticker in its own process group, so `kill -- -<agent shell pgid>` cannot reach it and `kill -- -<ticker_pgid>` still can.
- `/self-unwatch` writes the stop file **first**, so the ticker exits on its own even if the kill path fails or the PID went stale.
- Never reap the ticker from a tick, resume, subagent, thread-cleanup pass, or end-of-turn tidy.
- The agent touches `agent_heartbeat` every tick; if it stops, the idle guard retires the orphan after `max_idle_seconds`.
- `#resume-watch` / `#watch-tick` must not start a one-shot `sleep` or fallback wake.
- Arm at most one ticker: adopt a live `sentinel` process instead of starting a second.
- Stop only via `/self-unwatch`, terminal PR state, or owner death. Merge-ready is reported but **does not** stop the watch.
- Prefer a harness-native durable scheduler over the listener when one exists, and record which wake path is in use.

Files under `~/.agents/projects/<project>/self-watch/`: `tick-<N>.jsonl` (spool),
`tick-<N>.pid`, `tick-<N>.ticker-hb`, `tick-<N>.agent-hb`, `tick-<N>.stop`.

## Watch state (MDScript front matter)

One artifact holds the whole watch: `~/.agents/projects/<project>/goals/self-watch-<N>.mdscript.md`, written from [assets/watch.mdscript.md](assets/watch.mdscript.md).

| Path | Rule |
|------|------|
| `goals/self-watch-<N>.mdscript.md` | Sole watch state (YAML front matter) + executable tracker + loop resume target |
| `self-watch/pr-<N>.json` | Legacy only — read fallback; not written for new watches |
| `lane-ledger.jsonl` | Append-only per-tick ledger |

Front matter is authoritative: `watch_active`, `status`, `resume_heading`, `pr_number`, `pr_url`, `repo`, `repo_root`, `head_ref`, `base_ref`, `interval`, `interval_seconds`, `sentinel`, `loop_pid`, `skill_root`, `easy_model`, `hard_model`, `tick_count`, `last_head_sha`, `last_tick_at`, `armed_at`, `stopped_at`, `stop_reason`, `blocker`, `owner_conversation_id`, `owner_dialect`.

Stop-hook auto-resume only fires in the chat whose `owner_conversation_id` matches the current harness session id. Legacy watches without that field are listed at session start but never force-resume into a random chat.

Required headings: `Watch Contract`, `Resume Goal`, `Resume Watch`, `Watch Tick`, `Report Blocker`, `Stop Watch`, `Loop Resume Command`.

This file is the lane's goal MDScript, so watcher state stays under `goals/*.mdscript.md` with a stable re-entry:

```text
mdscript-exec ~/.agents/projects/<project>/goals/self-watch-<N>.mdscript.md#resume-watch
```

## Three comment surfaces

A PR carries review activity in three places, and a `reviewThreads` query sees
only the first:

| Surface | Endpoint / field | Holds |
|---------|------------------|-------|
| inline review threads | GraphQL `reviewThreads`, `pulls/<n>/comments` | line comments and their resolved state |
| PR-level conversation | `issues/<n>/comments`, `gh pr view --json comments` | bot summaries, human discussion, approvals in prose |
| review bodies | `pulls/<n>/reviews`, `gh pr view --json reviews` | the text attached to an approval or change request |

`latestReviews` keeps only the newest review per reviewer, so a PR with several
review bodies from one bot loses the earlier ones — read `reviews` instead.

Review bots post after their checks finish, so a tick with checks still running
has not seen the review surface yet. Report counts as provisional in that tick
rather than stating a clean unresolved count.

## Models

Pick both the model and the effort level from what the runtime offers, per
[the model contract](../self-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning).
Never carry a slug over from a previous session.

| Difficulty | Choose | Use for |
|------------|--------|---------|
| easy | fastest model that reliably lands the change, low effort | Single-file nits, lint/format, typos, clear mechanical comment fixes, obvious missing imports, narrow test assertion updates |
| hard | strongest available model, high effort | Multi-file design, ambiguous or conflicting review threads, flaky/deep CI root cause, security/correctness disputes, sync regressions, anything needing broader reasoning |

Record the chosen models, effort levels, and the basis in the watch MDScript
front matter and the ledger, so a resumed tick does not silently substitute.

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
| `/self-unwatch` | Kill loop, `watch_active=false` |
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

- When in doubt about scope, authority, or the right call, use the `self` skill and decide what the user would do from current evidence. Asking is the last resort, after `self`, the repo, and the PR evidence still leave it undecidable.
- Fix in the tick that found it. "Want me to push that fix on the next tick?" is a bug: apply, verify, push, report.
- Out-of-scope failures never gate in-scope repairs; fix what is in scope and report the rest as residue.
- A blocked item never pauses the rest of the watch.
- Report ticks as work done, not as a menu of options.
- Do not resolve threads you disagree with — reply with evidence and leave them open.
- Prefer minimal scoped fixes over drive-by refactors.

## Invocation

```text
/self-watch 5m https://github.com/org/repo/pull/123
/self-unwatch 123
/mdscript-exec ~/.agents/skills/self-watch/SKILL.md#setup-watch
/mdscript-exec ~/.agents/skills/self-watch/SKILL.md#resume-watch
/mdscript-exec ~/.agents/projects/<project>/goals/self-watch-<N>.mdscript.md#resume-watch
/mdscript-exec ~/.agents/skills/self-unwatch/SKILL.md#unwatch
```

## Relation to other pack skills

- `self-implement` / `mr-monitor`: implementer-owned monitor while building the PR
- `self-orchestrate` / `mr-comment-watcher`: coordinator routes comments to lanes
- `self-watch`: persistent interval watcher; repairs comments + CI; syncs branch
- `self-unwatch`: only user-facing stop for an armed self-watch loop
