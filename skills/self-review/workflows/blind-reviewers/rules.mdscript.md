<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Rules Blind Review

* set `{{reviewer_lane}}` to `rules`
* set `{{reviewer_id}}` to `rules`
* if the caller gave `{{signoff_path}}`
  * if `{{review_signoff_dir}}` is set
    * set `{{signoff_boundary}}` to `{{review_signoff_dir}}`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_boundary}}` to `{{run_dir}}`
  * otherwise set `{{signoff_boundary}}` to `{{artifact_dir}}`
  * if `{{signoff_boundary}}` is empty
    * set `{{blocker}}` to `no sign-off directory to contain the caller-supplied path`
    * stop
  * make sure that `{{signoff_path}}` ends in `.mdscript.md` and resolves inside `{{signoff_boundary}}`
  * if it does not
    * set `{{blocker}}` to the out-of-scope sign-off path
    * stop
  * create `{{signoff_path}}` now with an exclusive create that fails if the file exists
  * do not overwrite the sign-off of a different lane or a different round
  * write only to that path
  * do not calculate that path again
* if the caller did not give `{{signoff_path}}`
  * if `{{review_signoff_dir}}` is set
    * set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-rules.mdscript.md`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_path}}` to `{{run_dir}}/signoff-reviewer-rules.mdscript.md`
  * otherwise set `{{signoff_path}}` to `{{artifact_dir}}/signoff-reviewer-rules.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract
* the process that composes the review keeps the log of the round
* you are a **blind adversarial** reviewer for **rule / operating-instruction violations only**
* read only the neutral review packet and the paths that it authorizes
* before you write your sign-off, do not read these items from other reviewers:
  * sign-offs, prompts, verdicts, chat repair narratives, and preferred grades
* set `signed_off: false` as the default
* before any sign-off, try actively to prove that the change violates durable agent/project rules

## Attack surface (rules)

* find and read the applicable rules **with a search of the repo and the packet-authorized paths**
* do not limit the search to the files that the author listed
* if root or multi-agent instruction files are present, read them from start to end:
  * `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `.agents/AGENTS.md`
  * `CONTRIBUTING.md`, only if it states agent or tool constraints for the claim
* if **Cursor** rule surfaces are present, read these:
  * `.cursor/rules/**` (`.mdc`, `.md`, rule dirs)
  * `.cursor/AGENTS.md`, `.cursorrules`, `.cursor/rules.md`
  * the Cursor skills or hooks that the packet lists, only as claims to check against the written rules
* if **VS Code** rule or agent surfaces are present, read these:
  * `.vscode/*.md`, `.vscode/rules/**`, `.vscode/instructions.md`, `.vscode/copilot-instructions.md`
  * `.github/copilot-instructions.md`, `.github/instructions/**`
  * the agent or instruction sections of workspace `*.code-workspace` files, only if they state constraints
* if **Windsurf** rule surfaces are present, read these:
  * `.windsurf/rules/**`, `.windsurfrules`, `.windsurf/AGENTS.md`
  * `.windsurf/workflows/**`, only if they state durable constraints for the change
* if they are present, also scan these other common homes of agent rules:
  * `.clinerules`, `.aider.conf.yml` instruction paths, and `GEMINI.md` siblings
  * skill-local `AGENTS.md` under authorized skill roots
* if a family directory exists but gives no readable rules (for example, an empty `.cursor/rules/`), or you ignored its rules
  * write this in `attack_attempts` or `remaining_gaps`
  * do not skip it silently
* map each applicable rule to the diff and the claimed done state
* attack process, scope, test, safety, tool, commit/PR, ownership, provenance, and authority rules across **all families that you found**
* if VS Code or Windsurf rules also exist, do not stop after a Cursor-only pass
* reject “mostly compliant”, silent rule skips, and narrative that overrides written instructions
* grade each issue `P0`/`P1`/`P2`/`P3` in `p_findings`
  * give each issue `location`, `summary`, `contract` (rule path + clause), and `remediation`
* record ≥2 real `attack_attempts`, and include failed attacks and the rule families that you searched
* set `rules_reviewed` to the exact rule files that you inspected
  * include the family paths that you searched, also if they are empty, for example `.cursor/rules/ (none)`
* set `objectives_checked` to the rule-compliance criteria that you evaluated
* set `artifact_paths` to the packet or manifest paths that you examined to check rule claims
* set `commands_run` to the commands that you used to find or falsify rule compliance
  * for example, `rg`, or `find` over `.cursor/rules`, `.vscode`, `.windsurf`

## Sign-off decision

* if all serious rules attacks fail, `p_findings` is `[]`, and `remaining_gaps` is `[]`
  * allow `signed_off: true`
* otherwise keep `signed_off: false` with non-empty `p_findings`, non-empty `remaining_gaps`, or both
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set these front matter fields: `reviewer_id: "rules"`, `reviewer_lane: "rules"`, and `review_round` from the packet
* if the packet has `goal` and `conversation_id`, set them from the packet
* set `signed_off`, and set `verifier_summary` (≥40 characters about the attacks and the rules that you reviewed)
* set `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), and `p_findings`
* set `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, and `signed_off_at`
* if the packet gives `repair_resume_command`, set it
* write a `## Signoff` state that names the lane verdict
* in that state, write one bullet for each `p_findings` entry, with its location and remediation
* write a `## Resume From Signoff` state
* in that state, if `signed_off` is `true`, write a jump to `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs`
  * as an alternative, resolve this path from the install directory of this skill
* in that state, if `signed_off` is `false`, name `repair_resume_command` as the next jump
* in that state, if `signed_off` is `false`, write that a new blind reviewer must review the repair
* never write a jump from the sign-off back into the review of this lane
* do not write the sign-off files of other lanes
* stop after you write the sign-off
