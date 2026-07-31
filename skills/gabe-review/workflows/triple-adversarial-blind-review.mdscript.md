<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triple Adversarial Blind Review

* require at least three independent blind adversarial subagents for terminal readiness — do not self-grade as a single reviewer for completion
* set `{{blind_lanes}}` to `rules`, `security`, `completeness`
* run [Resolve HSM Lane](#resolve-hsm-lane)
* set `{{review_signoff_dir}}` to `{{run_dir}}` when present, otherwise `{{artifact_dir}}/reviews/{{review_key}}` (create it)
* set one sign-off path per lane in `{{blind_lanes}}` as `{{review_signoff_dir}}/signoff-reviewer-<lane>.mdscript.md`:
  * `{{signoff_rules}}` = `{{review_signoff_dir}}/signoff-reviewer-rules.mdscript.md`
  * `{{signoff_security}}` = `{{review_signoff_dir}}/signoff-reviewer-security.mdscript.md`
  * `{{signoff_completeness}}` = `{{review_signoff_dir}}/signoff-reviewer-completeness.mdscript.md`
  * `{{signoff_hsm}}` = `{{review_signoff_dir}}/signoff-reviewer-hsm.mdscript.md` when `hsm` is in `{{blind_lanes}}`
* write or refresh the neutral review packet first (caller may already have `{{run_dir}}/review-packet.md` or packet fields)
* delete every existing `signoff-reviewer-<lane>.mdscript.md` under `{{review_signoff_dir}}` before a new round, including `signoff-reviewer-hsm.mdscript.md` from a round where the HSM lane no longer applies
* also delete legacy `signoff-reviewer-a.json` / `b` / `c` and any legacy `signoff-reviewer-*.json` in the same directory when present
* spawn **every lane in `{{blind_lanes}}` as a readonly blind subagent in one turn** (parallel):
  1. **rules** — execute `mdscript-exec {{repo_root}}/skills/gabe-review/workflows/blind-reviewers/rules.mdscript.md#rules-blind-review` (or installed skill-relative path)
  2. **security** — execute `mdscript-exec …/blind-reviewers/security.mdscript.md#security-blind-review`
  3. **completeness** — execute `mdscript-exec …/blind-reviewers/completeness.mdscript.md#completeness-blind-review`
  4. **hsm** — execute `mdscript-exec …/blind-reviewers/hsm.mdscript.md#hsm-blind-review`, only when `hsm` is in `{{blind_lanes}}`
* give each subagent only: neutral packet path, authorized paths, `{{proof_scope}}`, `{{goal_text}}`/`{{intended_done_state}}`, `{{conversation_id}}`, `{{review_signoff_dir}}`, and its own MDScript entrypoint
* forbid each subagent from reading the other lanes' sign-offs or each other's prompts before writing its own file
* set each subagent model to a task-appropriate reviewer model (prefer fresh blind reviewers; do not reuse a subagent that already saw author fix narration for the same round)
* wait for every spawned lane to finish
* read the front matter of every lane's sign-off MDScript; fall back to a legacy `signoff-reviewer-<lane>.json` only when the MDScript is absent
* [Aggregate Triple Signoffs](#aggregate-triple-signoffs)

## Aggregate Triple Signoffs

* if any sign-off file for a lane in `{{blind_lanes}}` is missing
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
* validate the `hsm` lane the same way when it ran; `lane_applicable: false` still requires the evidence bar above, so an unsearched `n/a` fails validation like any other lane
* if any lane has `signed_off: false` or non-empty `p_findings` / `remaining_gaps`
  * union all `p_findings`, `attack_attempts`, and `remaining_gaps` into `{{blocking_findings}}` / next fix wave
  * set `{{grade}}` to `Not ready for {{proof_scope}}` when findings are repairable
  * set `{{grade}}` to `Blocked for {{proof_scope}}` only when a lane names a true missing precondition that cannot be stood up
  * delete every lane sign-off file (full consensus required — no partial credit)
  * return incomplete to the caller
* if every lane in `{{blind_lanes}}` has `signed_off: true` and empty `p_findings`
  * reject if any two `verifier_summary` texts are identical (insufficient independence) — clear them all and re-run
  * set `{{blocking_findings}}` to `[]`
  * set residual notes from any non-blocking commentary without weakening the gate
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} via adversarial blind gabe-review ({{blind_lanes}})`
  * when the `hsm` lane signed off `n/a`, keep that in the residual notes so the verdict never reads as HSM proof
  * persist durable `review-verdict.mdscript.md` when `{{run_dir}}` or `{{review_signoff_dir}}` is the goal/run surface
  * write it as executable MDScript: the exact execution header, YAML front matter, then the states below
  * set front matter to `reviewer_skill: "gabe-review"`, `triple_blind: true`, `lanes` set to `{{blind_lanes}}`, `hsm_lane_verdict` when the HSM lane ran, `signoff_paths` for every lane file, `goal`, `conversation_id`, `run_id`, `proof_scope`, `grade`, `proof_decision`, `blocking_severities`, empty `blocking_findings`, `residual_findings`, `proof_supplied`, `proof_not_claimed`, `artifact_paths`, `commands_run`, `review_round`, and `reviewed_at`
  * write a `## Verdict` state naming the grade, the proof scope, every lane that signed off, and each residual finding
  * write a `## Resume From Verdict` state that dispatches on `grade`, so any agent can continue from the verdict without knowing the caller's internals:
    * when `grade` starts with `Proven for` and `blocking_findings` is empty, continue at the caller's completion entry, defaulting to `/mdscript-exec ~/.agents/skills/gabe-goal/SKILL.md#complete-goal` on a goal run
    * when `grade` starts with `Not ready for`, fix every `blocking_findings` entry and continue at the caller's repair entry, defaulting to `/mdscript-exec ~/.agents/skills/gabe-goal/SKILL.md#pursue-goal` on a goal run
    * when `grade` starts with `Blocked for`, continue at the caller's stop entry, defaulting to `/mdscript-exec ~/.agents/skills/gabe-goal/SKILL.md#manual-stop` on a goal run
  * return complete to the caller

## Resolve HSM Lane

* add `hsm` to `{{blind_lanes}}` when any of these holds:
  * the caller set `{{hsm_in_scope}}` to `true` or explicitly requested the HSM lane
  * an in-scope path defines or changes a state machine by structure — vertices plus transitions carrying triggers, guards, or targets — regardless of library name
  * an in-scope path changes transition tables, event dispatch, mode/phase/status enums driving behavior, lifecycle or protocol sequencing, or the behaviors a machine calls
  * the goal, packet, tracker item, or `{{proof_scope}}` names statechart, state machine, HSM, SML, or workflow-state work
* when the signal is ambiguous, add the lane — its own ownership gate is what decides `n/a`, and the lead reviewer must not pre-empt that gate
* set `{{hsm_in_scope}}` to `false` and leave the lane out only when no in-scope path can own lifecycle, mode, or protocol state; record that reason in the packet
* return to the caller
