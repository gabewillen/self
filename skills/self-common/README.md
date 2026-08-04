# self-common

Shared **MDScripts**, templates, and hooks for the self pack. **Not an agent skill.**

Other skills link workflows here (e.g. `../self-common/workflows/goal-mdscript.mdscript.md`).  
`hooks/self-lib.ts` is the shared Stop-hook library for `self-goal` and `self-watch`.
This pack ships **no harness hooks of its own** — its `adapters/*/hooks.json` keep empty
event lists only so install scrubs the retired `self-learn` Stop/prompt hooks.

Learn moved out: `/self-learn` is the `self-learn` skill (`../self-learn/SKILL.md`) and runs
only when the user asks for it.

Do not add a `SKILL.md` here — install treats this as a shared pack, not a discoverable skill.
