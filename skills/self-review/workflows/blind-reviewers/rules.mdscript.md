<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Rules Blind Review

* set `{{reviewer_lane}}` to `rules`
* set `{{reviewer_id}}` to `rules`
* if the caller supplied `{{signoff_path}}`
  * set `{{signoff_boundary}}` to `{{review_signoff_dir}}` when set, otherwise `{{run_dir}}` when set, otherwise `{{artifact_dir}}`
  * if `{{signoff_boundary}}` is empty
    * set `{{blocker}}` to `no sign-off directory to contain the caller-supplied path` and stop
  * confirm it ends in `.mdscript.md` and resolves inside `{{signoff_boundary}}`
  * if it does not, set `{{blocker}}` to the out-of-scope sign-off path and stop
  * create it now, failing when it already exists, so this lane cannot overwrite another lane's or another round's sign-off
  * write only that path and do not recompute it
* otherwise set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-rules.mdscript.md` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-rules.mdscript.md` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-rules.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract; the composing process keeps the round's log
* you are a **blind adversarial** reviewer for **rule / operating-instruction violations only**
* read only the neutral review packet and paths it authorizes — do not read other reviewers' sign-offs, prompts, verdicts, chat repair narratives, or preferred grades before writing your own
* default to `signed_off: false`
* actively try to prove the change violates durable agent/project rules before any sign-off

## Attack surface (rules)

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

## Sign-off decision

* allow `signed_off: true` only when every serious rules attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set front matter to `reviewer_id: "rules"`, `reviewer_lane: "rules"`, `review_round` from the packet, `goal` and `conversation_id` from the packet when present, `signed_off`, `verifier_summary` (≥40 chars covering attacks + rules reviewed), `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), `p_findings`, `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`, and `repair_resume_command` when the packet supplies one
* write a `## Signoff` state that names the lane verdict and one bullet per `p_findings` entry with its location and remediation
* write a `## Resume From Signoff` state that continues at `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs` (or the path resolved from this skill's install directory) when `signed_off` is `true`
* in that same state, when `signed_off` is `false`, name `repair_resume_command` as the next jump and require a fresh blind reviewer after repair — never re-enter this lane's own review from the sign-off
* do not write other lanes' sign-off files
* stop after writing the sign-off
