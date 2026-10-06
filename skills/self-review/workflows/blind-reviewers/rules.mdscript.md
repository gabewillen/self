<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Rules Blind Review

* set `{{reviewer_lane}}` to `rules`
* run [Open Lane Signoff](../triple-adversarial-blind-review.mdscript.md#open-lane-signoff)
* search the repository and the authorized paths for every agent rule file, not only the author's list:
  * `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `.agents/`, and `CONTRIBUTING.md` agent rules
  * Cursor: `.cursor/rules/**`, `.cursorrules`, `.cursor/AGENTS.md`
  * VS Code and Copilot: `.vscode/*.md`, `.vscode/rules/**`, `.github/copilot-instructions.md`, `.github/instructions/**`
  * Windsurf: `.windsurf/rules/**`, `.windsurfrules`, `.windsurf/workflows/**`
  * `.clinerules`, Aider instruction paths, and skill-local `AGENTS.md`
* record each family that you searched, also if empty; never skip one silently
* map each rule to the diff and the done state
* attack process, scope, test, safety, tool, commit, ownership, provenance, and authority rules
* reject "mostly compliant", silent skips, and narrative that overrides a written rule
* set `contract` to the rule path and clause, and `rules_reviewed` to each file and family searched
* run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
