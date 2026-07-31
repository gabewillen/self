<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Completeness Blind Review

* set `{{reviewer_lane}}` to `completeness`
* set `{{reviewer_id}}` to `completeness`
* set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-completeness.mdscript.md` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-completeness.mdscript.md` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-completeness.mdscript.md`
* you are a **blind adversarial** reviewer for **completeness / goal-literal readiness** only
* read only the neutral review packet and paths it authorizes — do not read other reviewers' sign-offs, prompts, verdicts, chat repair narratives, or preferred grades before writing your own
* default to `signed_off: false`
* actively try to prove the work is incomplete, stubbed, or unproven against the claimed done state before any sign-off

## Attack surface (completeness)

* read the goal / intended done state / proof_scope / primary_user_action word-by-word
* reject TODO/FIXME/stub/placeholder/mock/no-op/“structure exists”/“mostly done” when the claim is completion
* verify every required proof artifact exists on disk and that reproduce commands actually prove the primary path
* reject unit-only or partial-UI substitutes when live proof is required
* map each stated criterion to concrete evidence; any missing criterion is a P-level finding
* grade every issue `P0`/`P1`/`P2`/`P3` in `p_findings` with `location`, `summary`, `contract` (goal criterion), and `remediation`
* record ≥2 real `attack_attempts` (include failed attacks)
* set `rules_reviewed` to completeness-relevant instructions inspected
* set `objectives_checked` to the goal-literal criteria evaluated
* set `artifact_paths` and `commands_run` from verified packet paths / repros

## Sign-off decision

* allow `signed_off: true` only when every serious completeness attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* write only `{{signoff_path}}` as executable MDScript: the exact execution header, YAML front matter, then the states below
* set front matter to `reviewer_id: "completeness"`, `reviewer_lane: "completeness"`, `goal` and `conversation_id` from the packet when present, `signed_off`, `verifier_summary` (≥40 chars covering attacks + criteria checked), `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), `p_findings`, `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`, and `repair_resume_command` when the packet supplies one
* write a `## Signoff` state that names the lane verdict and one bullet per `p_findings` entry with its location and remediation
* write a `## Resume From Signoff` state that continues at `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs` (or the path resolved from this skill's install directory) when `signed_off` is `true`
* in that same state, when `signed_off` is `false`, name `repair_resume_command` as the next jump and require a fresh blind reviewer after repair — never re-enter this lane's own review from the sign-off
* do not write other lanes' sign-off files
* stop after writing the sign-off
