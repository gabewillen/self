# self

agent-shaped **MDScript** skills.

The `mdscript-exec` and `mdscript-write` skills live in the [mdscript](https://github.com/gabewillen/mdscript) repo, which owns them. Install clones that repo to `~/.agents/repos/gabewillen-mdscript` and installs both alongside these skills, so every execution header here resolves.

Skip or redirect the companion install:

```bash
node ./scripts/install.mjs --no-mdscript              # or SELF_MDSCRIPT=0
node ./scripts/install.mjs --mdscript-root ~/src/mdscript
```

This package ships Agent Skills (`SKILL.md` + workflows) so they can be installed with npm and discovered by `npx skills`, `skills-npm`, and similar tools.

## Skills included

| Skill | Role |
|-------|------|
| `self` | Compatibility router for agent-shaped work |
| `self-orchestrate` | Root coordination, lanes, goals, watchers |
| `self-implement` | Delegated implementation lanes; selects and applies the same vendored [gabewillen/rules](https://github.com/gabewillen/rules) packs (`impl-core`, `impl-dbc`, language/framework, optional `impl-hsm`) before and after edits so review eng-* lanes see construction already held to those rules |
| `self-review` | Multi-lane blind / readiness review (agent rules + security + completeness + selected eng-* language/framework lanes from vendored [gabewillen/rules](https://github.com/gabewillen/rules) + optional deep HSM) |
| `self-automate` | External automation design |
| `self-watch` / `self-unwatch` | Interval PR repair watch |
| `self-voice` | agent-shaped reply drafting |
| `self-goal` | Goal-driven loop until proof + multi-lane review. When the harness has `/goal` (Grok host `/goal`, Cursor `goal` skill), prefers that for multi-round continuation and **skips self-goal hooks** while still following the MDScript workflow |
| `self-common` | Shared workflows used by the family, including living-skills updates and the `/self-learn` MDScript (not a skill) forced by Stop hooks on Claude/Cursor/Codex/Grok |

All coordination artifacts for agent work are **MDScript** (tasks, comments, plans, goals, instructions) under `~/.agents/projects/<project>/`.

## Validate

```bash
npm test                                        # validator + agent-home + self-review/implement install assets
node ./scripts/validate-mdscript.mjs            # whole pack
node ./scripts/validate-mdscript.mjs skills/self --json
node ./scripts/test-agent-home.mjs              # hooks and skills resolve the same home
node ./scripts/test-self-review-install.mjs     # multi-lane review tree complete
node ./scripts/test-self-review-install.mjs ~/.agents/skills/self-review
node ./scripts/test-self-implement-install.mjs  # impl-* engineering-rules construction tree
node ./scripts/test-self-implement-install.mjs ~/.agents/skills/self-implement
node ./scripts/test-hook-session-scope.mjs      # session-scoped learn stop hooks
node ./scripts/test-script-integrity.mjs        # install md5 integrity gate
```

Install (`scripts/install.mjs`) hard-fails if a managed destination is missing
required nested assets (for example `self-review` without `references/engineering-rules/`
or `workflows/blind-reviewers/eng-*.mdscript.md`, or `self-implement` without
`workflows/engineering-rules/impl-*.mdscript.md`). It also md5-checks every managed
script at every skill root and harness hook path so stale copies cannot go green.
Third-party dangling skill symlinks are still reported as warnings only.

Checks frontmatter, the execution header, `##`-only states, duplicate anchors,
dead links, `mdscript-exec` re-entry headings that match no state, `{{variables}}`
that build a path or command with nothing setting them, narration outside
bullets, rationale inside bullets, and the 200/500-line budgets. Exits non-zero
on errors.

## Install

### Living install (default)

By default install **clones or reuses a git checkout**, **checks out a long-lived working branch**, and **symlinks** each skill into agent skill dirs.

The working branch is `live/<user>-<host>` (override with `SELF_LIVE_BRANCH`; set to `0` to skip). It syncs from `origin/main` (or the remote default). **Global skill changes commit on that branch and open a PR into main** — do not push straight to the default branch. Project-specific rules belong in the product repo under `<repo>/.agents/`, not the global pack.

```bash
cd /path/to/self
npm install
# equivalent:
node ./scripts/install.mjs --live
# or: self-agents   (bin name for scripts/install.mjs)
```

Live root resolution order:

1. `--live-root <path>` / `SELF_LIVE_ROOT`
2. This package’s git toplevel when it already contains `skills/` (local checkout / git dependency)
3. `~/.agents/repos/self` (cloned from `https://github.com/gabewillen/self.git`)

Symlink targets (when the agent home exists):

- `~/.agents/skills/<skill>` → `<live-root>/skills/<skill>`
- `~/.claude|cursor|codex|copilot|qwen/skills/<skill>` → same

After install:

```bash
# edit a living skill on the live/* branch
$EDITOR ~/.agents/repos/self/skills/self-review/hsm/SKILL.md
# or, when installed from this checkout, edit here directly

git -C ~/.agents/repos/self add -A
git -C ~/.agents/repos/self commit -m "Update skill"
# post-commit hook: push live/* + open/update PR into main (SELF_SKIP_PR_HOOK=1 to disable)

# fetch origin + merge origin/main into the live branch + re-symlink
node ./scripts/install.mjs --live --pull
# or: npm run install-skills:pull
```

Marker file: `~/.agents/self-agents-live.json` (includes `live_branch`, `upstream_base`, and howto).
Integrity receipt: `~/.agents/self-agents-integrity.json`.

### Snapshot copy install

Immutable copies (no shared git tree):

```bash
node ./scripts/install.mjs --copy
# or: SELF_MODE=copy npm install
```

### Other flags

```bash
SELF_INSTALL=0 npm install          # skip postinstall
node ./scripts/install.mjs --dry-run
node ./scripts/install.mjs --verify-only   # md5-check installed scripts only
node ./scripts/install.mjs --target /path/to/skills
node ./scripts/install.mjs --no-adapters
SELF_REPO_URL=git@github.com:you/self.git npm install
SELF_LIVE_BRANCH=0 node ./scripts/install.mjs --live   # stay on current branch
```

Legacy aliases still accepted: `SELF_AGENTS_*`, `GABE_*`, and `GABE_AGENTS_*`
(e.g. `SELF_AGENTS_INSTALL=0` or `GABE_INSTALL=0` → `SELF_INSTALL=0`).

### Via the skills CLI (once published or from path)

```bash
npx skills add /path/to/self --path skills
# or after publish:
npx skills add @gabewillen/self
```

### As a dependency in another project

```bash
npm i -D @gabewillen/self
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

### Cursor / Claude / Codex / Grok

On install (unless `--no-adapters` / `SELF_INSTALL=0`), `scripts/install.mjs`:

1. Symlinks (or copies) the skill tree into agent skill dirs
2. Ensures harness skill roots exist when that agent is present
3. Merges managed entries into harness hook configs for:
   - **self-common** — learn session-touch + Stop (`/self-learn` MDScript)
   - **self-goal** — session start/touch + Stop
   - **self-watch** — session start + Stop (pending-tick resume, session-scoped)
4. Replaces legacy commands pointing at old `gabe-*` / `goal/scripts` paths

Runtime prefers `bun`, then `node`.

Hook followups are single-line `/mdscript-exec …#heading` only. Learn is session-scoped and does not re-arm on its own stop-hook followup.

Other adapters: put files under `adapters/<name>/` and optional `install.json` for extra copy targets.

## self-goal

MDScript port of the Cursor `goal` skill. Run:

```text
/mdscript-exec skills/self-goal/SKILL.md#parse-goal
```

or invoke the `self-goal` skill. Session state lives under:

```text
.cursor/goal/sessions/<conversation_id>/runs/<run_id>/
```

(or the equivalent under `~/.agents` when not in local mode).

Completion requires reproducible artifacts + multi-lane adversarial blind review with empty blocking findings. Cursor/Claude/Codex/Grok stop/session hooks live under `skills/self-goal/adapters/` and are wired on install.

## Layout

```text
skills/
  self/
  self-*/
scripts/install.mjs
AGENTS.md
package.json
```

## License

MIT
