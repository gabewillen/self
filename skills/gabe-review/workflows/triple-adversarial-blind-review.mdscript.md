<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triple Adversarial Blind Review

* require three independent blind adversarial subagents for terminal readiness — do not self-grade as a single reviewer for completion
* set `{{review_signoff_dir}}` to `{{run_dir}}` when present, otherwise `{{artifact_dir}}/reviews/{{review_key}}` (create it)
* set sign-off paths:
  * `{{signoff_rules}}` = `{{review_signoff_dir}}/signoff-reviewer-rules.json`
  * `{{signoff_security}}` = `{{review_signoff_dir}}/signoff-reviewer-security.json`
  * `{{signoff_completeness}}` = `{{review_signoff_dir}}/signoff-reviewer-completeness.json`
* write or refresh the neutral review packet first (caller may already have `{{run_dir}}/review-packet.md` or packet fields)
* delete any existing `signoff-reviewer-rules.json`, `signoff-reviewer-security.json`, and `signoff-reviewer-completeness.json` under `{{review_signoff_dir}}` before a new round
* also delete legacy `signoff-reviewer-a.json` / `b` / `c` in the same directory when present
* spawn **three readonly blind subagents in one turn** (parallel):
  1. **rules** — execute `mdscript-exec {{repo_root}}/skills/gabe-review/workflows/blind-reviewers/rules.mdscript.md#rules-blind-review` (or installed skill-relative path)
  2. **security** — execute `mdscript-exec …/blind-reviewers/security.mdscript.md#security-blind-review`
  3. **completeness** — execute `mdscript-exec …/blind-reviewers/completeness.mdscript.md#completeness-blind-review`
* give each subagent only: neutral packet path, authorized paths, `{{proof_scope}}`, `{{goal_text}}`/`{{intended_done_state}}`, `{{conversation_id}}`, `{{review_signoff_dir}}`, and its own MDScript entrypoint
* forbid each subagent from reading the other two sign-offs or each other's prompts before writing its own file
* set each subagent model to a task-appropriate reviewer model (prefer fresh blind reviewers; do not reuse a subagent that already saw author fix narration for the same round)
* wait for all three to finish
* read all three sign-off files
* [Aggregate Triple Signoffs](#aggregate-triple-signoffs)

## Aggregate Triple Signoffs

* if any sign-off file is missing
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: missing blind reviewer sign-off(s)`
  * set `{{blocking_findings}}` to a finding naming the missing lane(s)
  * return incomplete to the caller
* validate each sign-off independently:
  * matching `goal` / `conversation_id` when those are in the packet
  * correct `reviewer_id` / lane
  * `verifier_summary` ≥ 40 chars
  * ≥2 `evidence`, ≥2 `attack_attempts`, ≥1 `commands_run`
  * `p_findings` present (empty only when signed off)
  * `remaining_gaps` empty when `signed_off: true`
* if any lane has `signed_off: false` or non-empty `p_findings` / `remaining_gaps`
  * union all `p_findings`, `attack_attempts`, and `remaining_gaps` into `{{blocking_findings}}` / next fix wave
  * set `{{grade}}` to `Not ready for {{proof_scope}}` when findings are repairable
  * set `{{grade}}` to `Blocked for {{proof_scope}}` only when a lane names a true missing precondition that cannot be stood up
  * delete all three sign-off files (full consensus required — no partial credit)
  * return incomplete to the caller
* if all three have `signed_off: true` and empty `p_findings`
  * reject if any two `verifier_summary` texts are identical (insufficient independence) — clear all three and re-run
  * set `{{blocking_findings}}` to `[]`
  * set residual notes from any non-blocking commentary without weakening the gate
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} via triple adversarial blind gabe-review (rules + security + completeness)`
  * persist durable `review-verdict.json` when `{{run_dir}}` or `{{review_signoff_dir}}` is the goal/run surface, including:
    * `reviewer_skill: "gabe-review"`
    * `triple_blind: true`
    * `lanes: ["rules","security","completeness"]`
    * `signoff_paths` for the three files
    * `grade`, `proof_decision`, empty `blocking_findings`, `proof_supplied` / `artifact_paths`
  * return complete to the caller
