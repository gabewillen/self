<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triple Adversarial Blind Review

* this workflow is run by the **parent** agent that can spawn subagents (implementer lane owner, goal orchestrator, or main chat) — never by a nested `self-review` subagent
* do not spawn a subagent whose assignment is the full `self-review` skill or this whole composition skill
* require independent blind adversarial **lane** subagents for terminal readiness — do not self-grade as a single reviewer for completion
* set `{{review_skill_root}}` to this skill's absolute directory when empty
* run [Select Review Lanes](select-review-lanes.md#select-review-lanes)
* if `{{blind_lanes}}` is empty after selection
  * set `{{blocker}}` to `lane selection produced no blind lanes`
  * stop and report the empty lane set
* if `{{blind_lanes}}` is missing `rules`, `security`, or `completeness`
  * set `{{blocker}}` to `always-on blind lanes missing after selection`
  * stop and report the incomplete always-on set
* set `{{review_signoff_dir}}` to `{{run_dir}}` when present, otherwise `{{artifact_dir}}/reviews/{{review_key}}`
* create `{{review_signoff_dir}}` when missing
* for each lane id in `{{blind_lanes}}`
  * set that lane's sign-off path to `{{review_signoff_dir}}/signoff-reviewer-<lane>.mdscript.md`
* write or refresh the neutral review packet first when the caller has not already written one
* delete every existing `signoff-reviewer-*.mdscript.md` under `{{review_signoff_dir}}` before a new round
* [Spawn Selected Lanes](#spawn-selected-lanes)

## Spawn Selected Lanes

* spawn **every lane in `{{blind_lanes}}` as a readonly blind subagent in one turn** (parallel) from **this** parent process
* for each lane id in `{{blind_lanes}}`
  * resolve `{{lane_entry}}` from `{{lane_entrypoints}}.<lane>`
  * if `{{lane_entry}}` is missing
    * set `{{blocker}}` to `missing entrypoint for lane <lane>`
    * stop and report the missing entrypoint
  * spawn one readonly subagent that runs only `mdscript-exec {{lane_entry}}`
  * do not assign `/self-review`, `self-review/SKILL.md`, or this composition workflow as the subagent's role
  * do not ask a lane subagent to spawn further subagents (many harnesses forbid nested fanout)
* give each subagent only: neutral packet path, authorized paths, `{{proof_scope}}`, `{{goal_text}}` or `{{intended_done_state}}`, `{{conversation_id}}`, `{{review_signoff_dir}}`, `{{review_skill_root}}`, and its own MDScript entrypoint
* for engineering-rules lanes, also pass `{{reviewer_lane}}` and either `{{rules_pack}}` or `{{rules_file}}` only when the thin entrypoint does not set them itself
* forbid each subagent from reading the other lanes' sign-offs or each other's prompts before writing its own file
* set each subagent model to a task-appropriate reviewer model
* do not reuse a subagent that already saw author fix narration for the same round
* wait for every spawned lane to finish
* read the front matter of every lane's sign-off MDScript
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
* validate optional lanes (`hsm`, `eng-*`) the same way when they ran
* treat `lane_applicable: false` as allowed only when the evidence bar above still holds
* if any lane has `signed_off: false` or non-empty `p_findings` / `remaining_gaps`
  * union all `p_findings`, `attack_attempts`, and `remaining_gaps` into `{{blocking_findings}}` / next fix wave
  * set `{{grade}}` to `Not ready for {{proof_scope}}` when findings are repairable
  * set `{{grade}}` to `Blocked for {{proof_scope}}` only when a lane names a true missing precondition that cannot be stood up
  * delete every lane sign-off file
  * return incomplete to the caller
* if every lane in `{{blind_lanes}}` has `signed_off: true` and empty `p_findings`
  * if any two `verifier_summary` texts are identical
    * delete every lane sign-off file
    * [Triple Adversarial Blind Review](#triple-adversarial-blind-review)
  * set `{{blocking_findings}}` to `[]`
  * set residual notes from any non-blocking commentary without weakening the gate
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} via adversarial blind multi-lane review ({{blind_lanes}})`
  * when an `hsm` or `eng-hsm` lane signed off `n/a` or `lane_applicable: false`, keep that in residual notes so the verdict never reads as state machine proof
  * persist durable `review-verdict.mdscript.md` when `{{run_dir}}` or `{{review_signoff_dir}}` is the goal/run surface
  * write it as executable MDScript: the exact execution header, YAML front matter, then the states below
  * set front matter to `reviewer_skill: "self-review"`, `multi_lane_blind: true`, `lanes` set to `{{blind_lanes}}`, `lane_selection_reasons`, `hsm_lane_verdict` when the HSM lane ran, `signoff_paths` for every lane file, `goal`, `conversation_id`, `run_id`, `proof_scope`, `grade`, `proof_decision`, `blocking_severities`, empty `blocking_findings`, `residual_findings`, `proof_supplied`, `proof_not_claimed`, `artifact_paths`, `commands_run`, `review_round`, and `reviewed_at`
  * write a `## Verdict` state naming the grade, the proof scope, every lane that signed off, and each residual finding
  * write a `## Resume From Verdict` state that dispatches on `grade`:
    * when `grade` starts with `Proven for` and `blocking_findings` is empty, continue at the caller's completion entry, defaulting to `/mdscript-exec ~/.agents/skills/self-goal/SKILL.md#complete-goal` on a goal run
    * when `grade` starts with `Not ready for`, fix every `blocking_findings` entry and continue at the caller's repair entry, defaulting to `/mdscript-exec ~/.agents/skills/self-goal/SKILL.md#pursue-goal` on a goal run
    * when `grade` starts with `Blocked for`, continue at the caller's stop entry, defaulting to `/mdscript-exec ~/.agents/skills/self-goal/SKILL.md#manual-stop` on a goal run
  * return complete to the caller
