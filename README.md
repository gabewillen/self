# self

**Living agent skills.** Not a one-shot library: a pack agents load every turn, run as MDScript, and keep updating from **user** corrections so future agents inherit better defaults.

Install once; agents route through `self`, execute workflows, learn at stop, and write durable rules back into project or global skills. The source of truth is a git checkout agents edit in place.

---

## What this is

`self` is an operating system for agent-shaped work:

1. **Always enter through `self`.** Every request routes by agent position (orchestrator / implementer / review / watch / goal / …).
2. **Skills are executable MDScript.** `SKILL.md` and linked workflows are the procedure—not prose you skim once.
3. **MDScript is the running log.** Not a summary written at the end — started at the first context read and updated at every transition, with `## Done So Far` beside `## Next Steps`. When a context is compacted or lost, the work resumes from disk instead of from memory. Lexicographically named, append-only apart from an explicit secret purge, last state carries the `/mdscript-exec` re-entry. Review rounds, RCA records, implementation reports, and coordination decisions are all workflows a later agent can run, not notes.
4. **Work leaves durable records.** Goals, tasks, comments, ledgers live under `~/.agents/projects/<project>/` as MDScript, outside product repos unless `--local`.
5. **The pack stays alive.** User corrections become living skill updates. Learn is user-invoked only: `/self-learn`, never a hook. Global edits go on a live branch + PR; project rules go in `<repo>/.agents/`.

If a rule is only true for this product, it does **not** belong in this pack. Prefer project scope over global.

---

## How agents use it

| Skill | When |
|-------|------|
| `self` | **Every request first** — router; pick the role |
| `self-orchestrate` | Parentless main agents: prioritize, delegate, goals, lanes, watchers |
| `self-implement` | Subagents / writers: edit code and docs under a DBC claim + engineering rules |
| `self-review` | Multi-lane blind review (rules, security, completeness, eng-*, HSM when in scope) |
| `self-goal` | Goal loop until real proof + review; prefers harness `/goal` when available |
| `self-watch` / `self-unwatch` | Interval PR babysit with a standing repair grant |
| `self-automate` | Design MDScript-backed automations before automation tools |
| `self-learn` | User-invoked living-skills reflection (`/self-learn`) — never automatic |

**Not skills** (shared / routed MDScripts only):

| Pack | Role |
|------|------|
| `self-common/` | Shared MDScripts, templates, hook library — linked by other skills |
| `self-voice/` | Routed MDScript for agent-voice drafts (`/self-voice`) |
| `self-troubleshoot/` | Routed MDScript for red-repro → RCA → fix → rerun troubleshooting (`/self-troubleshoot`) |

Slash routes (examples): `/self-watch`, `/self-goal`, `/self-learn`, `/self-voice`, `/self-troubleshoot`, `/self-unwatch`.

MDScript-only routes (not skills):

- `/self-voice` → `self-voice/self-voice.mdscript.md`
- `/self-troubleshoot` → `self-troubleshoot/self-troubleshoot.mdscript.md`

Companion skills **`mdscript-exec`** and **`mdscript-write`** live in [gabewillen/mdscript](https://github.com/gabewillen/mdscript). Install pulls them beside this pack so every `<!-- mdscript: … -->` header resolves.

---

## Living loop (use → learn → update)

```text
user turn
  → self routes role
  → role MDScript runs against real repos / trackers / devices
  → turn ends

user runs /self-learn
  → self routes the self-learn skill
       → user correction in this conversation? update living skills (project or global)
       → else report nothing-to-learn
```

**Learn rules**

- Learn is **user-invoked only**. No Stop hook, goal loop, or role may trigger it or hold a turn open for it.
- Only **direct user** words create durable skill changes—not agent debugging, self-critique, or tool noise.
- **Project** rules → `<repo>/.agents/` (never promote product facts into the global pack).
- **Global** rules → edit this pack on the live branch; open a PR into `main`.

**Hooks** (installed with the pack)

| Harness events | Skills |
|----------------|--------|
| UserPromptSubmit / beforeSubmitPrompt | goal touch |
| Stop | goal, watch (session-scoped; no self-chain on followups) |
| SessionStart | goal / watch context |

`self-learn` ships **no hooks** — it only runs when the user types `/self-learn`.

Opt out: `SELF_GOAL_SKIP_HOOKS=1`, `SELF_WATCH_SKIP_HOOKS=1`.

---

## Continuous update path

Living install **symlinks** agent skill dirs at a git checkout. Agents and humans edit the same files.

1. Install (or re-install after pull): `node ./scripts/install.mjs --live`
2. Work on the live branch (`live/<user>-<host>` unless `SELF_LIVE_BRANCH=0`)
3. Change skills under `skills/…` (or via learn → update-living-skills)
4. Commit; post-commit pushes and opens/updates a PR into `main` (disable with `SELF_SKIP_PR_HOOK=1`)
5. Re-run install after merges so every harness stays cut over (no dangling legacy links)

Marker: `~/.agents/self-agents-live.json`  
Integrity: `~/.agents/self-agents-integrity.json` (md5 of managed scripts at every install target)

Re-install is safe and expected: it re-symlinks, rewires hooks, and clears leftover pre-rename artifacts.

---

## Project vs global

| Scope | Where | Who edits |
|-------|--------|-----------|
| Global pack | this repo (`skills/…`) | agents/humans via live branch + PR |
| Project | `<repo>/.agents/` | agents/humans for product-specific rules |
| Coordination state | `~/.agents/projects/<slug>/` | agents every run (goals, tasks, comments) |

Ask “Would this still be true in another repo?” If no → project. If yes → pack.

---

## Install

```bash
cd /path/to/self
npm install
# or:
node ./scripts/install.mjs --live
# bin: self-agents
```

Live root resolution:

1. `--live-root` / `SELF_LIVE_ROOT`
2. This package’s git toplevel when it already has `skills/`
3. `~/.agents/repos/self` (cloned from `https://github.com/gabewillen/self.git`)

Symlinks (when the harness home exists):

- `~/.agents/skills/self*` → `<live-root>/skills/self*`
- same under `~/.cursor`, `~/.claude`, `~/.codex`, …

```bash
node ./scripts/install.mjs --live --pull    # sync live branch from origin/main + re-link
node ./scripts/install.mjs --copy           # snapshot copies (not living)
node ./scripts/install.mjs --verify-only    # md5 check only
SELF_INSTALL=0 npm install                  # skip postinstall
SELF_LIVE_BRANCH=0 node ./scripts/install.mjs --live   # stay on current branch
SELF_MDSCRIPT=0 …                           # skip mdscript companion
```

Aliases still work: `SELF_AGENTS_*`, `GABE_*`, `GABE_AGENTS_*`.

Discovery / dependency:

```bash
npx skills add /path/to/self --path skills
npx skills add @gabewillen/self
npm i -D @gabewillen/self
```

---

## Validate

```bash
npm test
node ./scripts/validate-mdscript.mjs
node ./scripts/test-agent-home.mjs
node ./scripts/test-self-review-install.mjs
node ./scripts/test-self-implement-install.mjs
node ./scripts/test-hook-session-scope.mjs
node ./scripts/test-script-integrity.mjs
node ./scripts/test-gabe-to-self-cutover.mjs
```

Install fails closed on missing multi-lane review assets or md5 drift across skill roots / hook paths.

---

## Layout

```text
skills/
  self/                 # router — always first
  self-orchestrate/
  self-implement/
  self-review/          # includes eng-* packs + hsm/
  self-goal/
  self-watch/
  self-unwatch/
  self-automate/
  self-learn/           # user-invoked living-skills reflection (/self-learn)
  self-common/          # shared MDScripts + hooks (NOT a skill)
  self-voice/           # routed voice MDScript (NOT a skill)
  self-troubleshoot/    # routed troubleshooting MDScript (NOT a skill)
scripts/
  install.mjs           # living install, hooks, cutover, integrity
  agent-home.mjs
AGENTS.md               # operating model for every harness
```

Hook libraries are consistently `hooks/self-lib.ts` inside each hook-bearing skill. Entry scripts stay role-named (`goal-stop.ts`, `watch-stop.ts`, …).

---

## For agents reading this

1. Run the `self` skill before planning or answering.
2. Prefer owner records and live proof over summaries.
3. When the user states a durable rule in their own words, update living skills (project or global)—do not invent rules from failures alone.
4. Keep global pack changes on the live branch and PR path; never merge to `main` without explicit permission for that change.
5. Re-install after skill changes so every harness sees the same tree.

Humans: treat this repo as the agents’ shared memory of *how* to work—not a static skill catalog.

## License

MIT
