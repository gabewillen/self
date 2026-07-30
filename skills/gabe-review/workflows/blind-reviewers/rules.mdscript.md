<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Rules Blind Review

* set `{{reviewer_lane}}` to `rules`
* set `{{reviewer_id}}` to `rules`
* set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-rules.json` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-rules.json` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-rules.json`
* you are a **blind adversarial** reviewer for **rule / operating-instruction violations only**
* read only the neutral review packet and paths it authorizes — do not read other reviewers' sign-offs, prompts, verdicts, chat repair narratives, or preferred grades before writing your own
* default to `signed_off: false`
* actively try to prove the change violates durable agent/project rules before any sign-off

### Attack surface (rules)

* discover and read applicable rules **by searching the repo and packet-authorized paths** — do not limit to files the author listed
* root / multi-agent instruction files when present (read end-to-end):
  * `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `.agents/AGENTS.md`
  * `CONTRIBUTING.md` only when it states agent/tooling constraints tied to the claim
* **Cursor** rule surfaces when present:
  * `.cursor/rules/**` (`.mdc`, `.md`, rule dirs)
  * `.cursor/AGENTS.md`, `.cursorrules`, `.cursor/rules.md`
  * packet-listed Cursor skills/hooks only as claims to check against written rules
* **VS Code** rule / agent surfaces when present:
  * `.vscode/*.md`, `.vscode/rules/**`, `.vscode/instructions.md`, `.vscode/copilot-instructions.md`
  * `.github/copilot-instructions.md`, `.github/instructions/**`
  * workspace `*.code-workspace` agent/instruction sections only when they encode constraints
* **Windsurf** rule surfaces when present:
  * `.windsurf/rules/**`, `.windsurfrules`, `.windsurf/AGENTS.md`
  * `.windsurf/workflows/**` only when they encode durable constraints for the change
* also scan for other common agent rule homes when present: `.clinerules`, `.aider.conf.yml` instruction paths, `GEMINI.md` siblings, and skill-local `AGENTS.md` under authorized skill roots
* if a family directory exists (e.g. `.cursor/rules/` empty of readable rules, or rules ignored), note that in `attack_attempts` / `remaining_gaps` rather than silently skipping
* map each applicable rule to the diff / claimed done state
* attack process, scope, testing, safety, tooling, commit/PR, ownership, provenance, and authority rules across **all discovered families** — a Cursor-only pass is incomplete when VS Code or Windsurf rules also exist
* reject “mostly compliant”, silent rule skips, and narrative that overrides written instructions
* grade every issue `P0`/`P1`/`P2`/`P3` in `p_findings` with `location`, `summary`, `contract` (rule path + clause), and `remediation`
* record ≥2 real `attack_attempts` (include failed attacks and which rule families were searched)
* set `rules_reviewed` to the exact rule files inspected (include family paths searched even when empty, e.g. `.cursor/rules/ (none)`)
* set `objectives_checked` to the rule-compliance criteria you evaluated
* set `artifact_paths` to packet/manifest paths you verified while checking rule claims
* set `commands_run` to any commands used to discover or falsify rule compliance (e.g. `rg`, `find` over `.cursor/rules`, `.vscode`, `.windsurf`)

### Sign-off decision

* allow `signed_off: true` only when every serious rules attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* write only `{{signoff_path}}` with:
  * `reviewer_id: "rules"`
  * `reviewer_lane: "rules"`
  * `goal` / `conversation_id` from the packet when present
  * `signed_off`, `verifier_summary` (≥40 chars covering attacks + rules reviewed)
  * `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), `p_findings`, `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`
* do not write other lanes' sign-off files
* stop after writing the sign-off
