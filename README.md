# @gabewillen/agents

Gabe-shaped **MDScript** agent skills, plus the shared MDScript executor/writer skills.

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
| `mdscript-exec` | Execute MDScript workflows |
| `mdscript-write` | Author MDScript-backed skills |

All coordination artifacts for Gabe work are **MDScript** (tasks, comments, plans, goals, instructions) under `~/.agents/projects/<project>/`.

## Install

### From a local checkout

```bash
cd /path/to/agents
npm install
# or explicit:
node ./scripts/install.mjs
```

`postinstall` copies every skill into:

- `~/.agents/skills/<skill>` (always)
- and into detected agent homes when present: `~/.claude/skills`, `~/.cursor/skills`, `~/.codex/skills`, `~/.copilot/skills`, `~/.qwen/skills`

Skip auto-install:

```bash
GABE_AGENTS_INSTALL=0 npm install
```

Dry run:

```bash
node ./scripts/install.mjs --dry-run
```

Custom target only:

```bash
node ./scripts/install.mjs --target /path/to/skills
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

## gabe-goal

MDScript port of the Cursor `goal` skill. Run:

```text
/mdscript-exec skills/gabe-goal/SKILL.md#parse-goal
```

or invoke the `gabe-goal` skill. Session state lives under:

```text
.cursor/goal/sessions/<conversation_id>/runs/<run_id>/
```

Completion requires reproducible artifacts + three adversarial blind reviewer sign-offs with empty `p_findings`. Optional Cursor hook scripts are preserved under `skills/gabe-goal/scripts/cursor-hooks/` for environments that still use them.

## Layout

```text
skills/
  gabe/
  gabe-*/
  mdscript-exec/
  mdscript-write/
scripts/install.mjs
AGENTS.md
package.json
```

## License

MIT
