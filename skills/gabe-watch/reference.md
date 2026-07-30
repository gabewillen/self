# gabe-watch reference

## Inputs

| Variable | Required | Notes |
|----------|----------|-------|
| `{{pr}}` | yes | PR URL, `owner/repo#N`, or number in current repo |
| `{{interval}}` | no | Default `5m`. Accepts `30s`, `5m`, `10m`, `1h` |
| `{{repo_root}}` | yes after setup | Local checkout used for sync/fix/push |

## Persistent loop (arm once)

`/gabe-watch` arms **one** background `while true` shell:

```bash
while true; do
  sleep <interval_seconds>
  echo 'AGENT_LOOP_TICK_gabe_watch_<N> {"prompt":"/mdscript-exec …/gabe-watch/SKILL.md#resume-watch",…}'
done
```

Rules:

- Arm only from `#arm-persistent-interval-loop` during setup (or when state proves the old PID is dead and the user re-runs `/gabe-watch`).
- `#resume-watch` / `#watch-tick` **must not** re-arm, start a one-shot `sleep`, or schedule a fallback wake.
- End each tick turn after work; the existing loop owns the next wake.
- Persist `loop_pid`, `sentinel`, and contract fields to `~/.agents/projects/<project>/gabe-watch/pr-<N>.json`.
- Stop the loop only via `/gabe-unwatch` (or auto-stop when the PR is `MERGED`/`CLOSED`).
- Merge-ready status is reported but **does not** stop the watch.

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

## Authority boundaries

- Do not force-push unless the user explicitly granted it for this watch
- Do not edit CI workflows solely to greenwash failures
- Do not resolve threads you disagree with without an evidence reply
- Do not merge the PR unless the user explicitly asked this watch to merge
- Prefer minimal scoped fixes over drive-by refactors

## Invocation

```text
/gabe-watch 5m https://github.com/org/repo/pull/123
/gabe-unwatch 123
/mdscript-exec ~/.agents/skills/gabe-watch/SKILL.md#setup-watch
/mdscript-exec ~/.agents/skills/gabe-watch/SKILL.md#resume-watch
/mdscript-exec ~/.agents/skills/gabe-unwatch/SKILL.md#unwatch
```

## Relation to other Gabe skills

- `gabe-implement` / `mr-monitor`: implementer-owned monitor while building the PR
- `gabe-orchestrate` / `mr-comment-watcher`: coordinator routes comments to lanes
- `gabe-watch`: persistent interval watcher; repairs comments + CI; syncs branch
- `gabe-unwatch`: only user-facing stop for an armed gabe-watch loop
