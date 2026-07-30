# @gabewillen/agents

Gabe-shaped **MDScript** agent skills.

The `mdscript-exec` and `mdscript-write` skills live in the [mdscript](https://github.com/gabewillen/mdscript) repo, which owns them. Install clones that repo to `~/.agents/repos/gabewillen-mdscript` and installs both alongside these skills, so every execution header here resolves.

Skip or redirect the companion install:

```bash
node ./scripts/install.mjs --no-mdscript              # or GABE_AGENTS_MDSCRIPT=0
node ./scripts/install.mjs --mdscript-root ~/src/mdscript
```

This package ships Agent Skills (`SKILL.md` + workflows) so they can be installed with npm and discovered by `npx skills`, `skills-npm`, and similar tools.

## Skills included

| Skill | Role |
|-------|------|
| `gabe` | Compatibility router for Gabe-shaped work |
| `gabe-orchestrate` | Root coordination, lanes, goals, watchers |
| `gabe-implement` | Delegated implementation lanes |
| `gabe-review` | Blind / readiness review |
| `gabe-automate` | External automation design |
| `gabe-watch` / `gabe-unwatch` | Interval PR repair watch |
| `gabe-voice` | Gabe-shaped reply drafting |
| `gabe-goal` | Goal-driven loop until proof + triple blind review (MDScript rewrite of Cursor `goal`) |
| `gabe-common` | Shared workflows used by the family |

All coordination artifacts for Gabe work are **MDScript** (tasks, comments, plans, goals, instructions) under `~/.agents/projects/<project>/`.

## Validate

```bash
node ./scripts/validate-mdscript.mjs            # whole pack
node ./scripts/validate-mdscript.mjs skills/gabe --json
```

Checks frontmatter, the execution header, `##`-only states, duplicate anchors,
dead links, `mdscript-exec` re-entry headings that match no state, `{{variables}}`
that build a path or command with nothing setting them, narration outside
bullets, rationale inside bullets, and the 200/500-line budgets. Exits non-zero
on errors.

## Install

### Living install (default)

By default install **clones or reuses a git checkout** and **symlinks** each skill into agent skill dirs. Agents edit the live tree, then commit/push upstream.

```bash
cd /path/to/agents
npm install
# equivalent:
node ./scripts/install.mjs --live
```

Live root resolution order:

1. `--live-root <path>` / `GABE_AGENTS_LIVE_ROOT`
2. This package’s git toplevel when it already contains `skills/` (local checkout / git dependency)
3. `~/.agents/repos/gabewillen-agents` (cloned from `https://github.com/gabewillen/agents.git`)

Symlink targets (when the agent home exists):

- `~/.agents/skills/<skill>` → `<live-root>/skills/<skill>`
- `~/.claude|cursor|codex|copilot|qwen/skills/<skill>` → same

After install:

```bash
# edit a living skill
$EDITOR ~/.agents/repos/gabewillen-agents/skills/gabe-hsm-review/SKILL.md
# or, when installed from this checkout, edit here directly

git -C ~/.agents/repos/gabewillen-agents add -A
git -C ~/.agents/repos/gabewillen-agents commit -m "Update skill"
git -C ~/.agents/repos/gabewillen-agents push

# refresh from remote + re-symlink
node ./scripts/install.mjs --live --pull
# or: npm run install-skills:pull
```

Marker file: `~/.agents/gabe-agents-live.json`.

### Snapshot copy install

Immutable copies (no shared git tree):

```bash
node ./scripts/install.mjs --copy
# or: GABE_AGENTS_MODE=copy npm install
```

### Other flags

```bash
GABE_AGENTS_INSTALL=0 npm install          # skip postinstall
node ./scripts/install.mjs --dry-run
node ./scripts/install.mjs --target /path/to/skills
node ./scripts/install.mjs --no-adapters
GABE_AGENTS_REPO_URL=git@github.com:you/agents.git npm install
```

### Via the skills CLI (once published or from path)

```bash
npx skills add /path/to/agents --path skills
# or after publish:
npx skills add @gabewillen/agents
```

### As a dependency in another project

```bash
npm i -D @gabewillen/agents
# postinstall installs into agent skill dirs
```

Package authors / discovery fields:

- `agents.skills` / `agentskills.skills` — skill directory list
- `aiAgentSkill` — SKILL.md paths
- skills live under `skills/<name>/SKILL.md` for `skills-npm` discovery

## Adapters (per-agent scripts/hooks)

Skills may ship agent-specific runtime under:

```text
skills/<skill>/adapters/<adapter>/
```

### Cursor

`skills/gabe-goal/adapters/cursor/` contains stop/session hooks plus `hooks.json`.

On install (unless `--no-adapters` / `GABE_AGENTS_INSTALL=0`), `scripts/install.mjs`:

1. Copies the skill tree (including `adapters/`) into agent skill dirs
2. Ensures `~/.cursor/skills/gabe-goal` exists when Cursor is present
3. Merges managed entries into `~/.cursor/hooks.json` for:
   - `sessionStart` → `goal-session-start.ts`
   - `beforeSubmitPrompt` → `goal-session-touch.ts`
   - `stop` → `goal-stop.ts`
4. Replaces legacy commands pointing at `~/.cursor/skills/goal/scripts/...`

Runtime prefers `bun`, then `node`.

Other adapters: put files under `adapters/<name>/` and optional `install.json` for extra copy targets. Unknown adapters ship with the skill; Cursor is the only auto-wired adapter today.

`gabe-watch` has no Cursor stop hooks — it uses an in-skill background interval loop and `gabe-unwatch`.

## gabe-goal

MDScript port of the Cursor `goal` skill. Run:

```text
/mdscript-exec skills/gabe-goal/SKILL.md#parse-goal
```

or invoke the `gabe-goal` skill. Session state lives under:

```text
.cursor/goal/sessions/<conversation_id>/runs/<run_id>/
```

Completion requires reproducible artifacts + three adversarial blind reviewer sign-offs with empty `p_findings`. Cursor stop/session hooks live under `skills/gabe-goal/adapters/cursor/` and are wired on install.

## Layout

```text
skills/
  gabe/
  gabe-*/
scripts/install.mjs
AGENTS.md
package.json
```

## License

MIT
