<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triple Adversarial Blind Review

* this workflow is run by the **parent** agent that can spawn subagents (implementer lane owner, goal orchestrator, or main chat) — never by a nested `self-review` subagent
* do not spawn a subagent whose assignment is the full `self-review` skill or this whole composition skill
* require independent blind adversarial **lane** subagents for terminal readiness — do not self-grade as a single reviewer for completion
* set `{{review_skill_root}}` to this skill's absolute directory when empty
* run [Select Review Lanes](select-review-lanes.mdscript.md#select-review-lanes)
* if `{{blind_lanes}}` is empty after selection
  * set `{{blocker}}` to `lane selection produced no blind lanes`
  * stop and report the empty lane set
* if `{{blind_lanes}}` is missing `rules`, `security`, or `completeness`
  * set `{{blocker}}` to `always-on blind lanes missing after selection`
  * stop and report the incomplete always-on set
* set `{{review_signoff_dir}}` to `{{run_dir}}` when present, otherwise `{{artifact_dir}}/reviews/{{review_key}}`
* create `{{review_signoff_dir}}` when missing
* set `{{prior_artifact_dir}}` to `{{artifact_dir}}` when `{{prior_artifact_dir}}` is empty, so a retry never captures an already-rebound value
* set `{{artifact_dir}}` to `{{review_signoff_dir}}` for this round's artifacts only
* for each lane id in `{{blind_lanes}}`
  * set `{{artifact_kind}}` to `<lane>-signoff`
  * set `{{artifact_subject}}` to `{{review_key}}`
  * set `{{artifact_ordinal}}` to `{{review_round}}`
  * set `{{artifact_reserve_only}}` to `true`
  * run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path)
  * set `{{lane_signoff_paths}}.<lane>` to `{{mdscript_artifact}}`, keyed per lane so the loop does not leave one path for all of them, and it stays absent until that lane writes it
* set `{{artifact_kind}}` to `review-packet`
* set `{{artifact_ordinal}}` to `{{review_round}}`
* set `{{artifact_reserve_only}}` to empty
* set `{{mdscript_artifact}}` to empty, so the packet never inherits the last lane's sign-off path
* set `{{artifact_subject}}` to `{{review_key}}`
* if the caller already wrote this round's packet
  * set `{{review_packet}}` to that packet path
* if the caller did not write this round's packet
  * set `{{artifact_kind}}` to `review-packet`
  * set `{{next_steps}}` to this round's scope, authorized paths, and open questions, from [review-packet template](../../self-common/templates/review-packet.mdscript.md)
  * run [Start MDScript Running Log](../../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log)
  * set `{{review_packet}}` to `{{mdscript_artifact}}`, so a lost context resumes the round from disk
* confirm `{{review_packet}}` holds this round's scope, authorized paths, and open questions, so the packet that was verified is the packet the lanes read
* never delete or overwrite an earlier round's sign-off or packet; each round mints its own lexicographic name so the history stays readable in order
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the selected lanes and the spawn as the next step
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
* give each subagent only: neutral packet path, authorized paths, `{{proof_scope}}`, `{{goal_text}}` or `{{intended_done_state}}`, `{{conversation_id}}`, `{{review_signoff_dir}}`, `{{review_skill_root}}`, its own `{{lane_signoff_paths}}.<lane>` as `{{signoff_path}}` for this round, `{{review_round}}`, and its own MDScript entrypoint
* for engineering-rules lanes, also pass `{{reviewer_lane}}` and either `{{rules_pack}}` or `{{rules_file}}` only when the thin entrypoint does not set them itself
* forbid each subagent from reading the other lanes' sign-offs or each other's prompts before writing its own file
* set each subagent model to a task-appropriate reviewer model
* do not reuse a subagent that already saw author fix narration for the same round
* wait for every spawned lane to finish
* read the front matter of every lane's sign-off MDScript
* [Aggregate Triple Signoffs](#aggregate-triple-signoffs)

## Restore Artifact Dir

* if `{{prior_artifact_dir}}` is empty
  * return to the caller, because this state was entered without a rebinding to undo
* set `{{artifact_dir}}` back to `{{prior_artifact_dir}}`, so the author's repair log never mints among the blind sign-offs
* return to the caller

## Aggregate Triple Signoffs

* if `{{blind_lanes}}` is empty
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: no blind lanes were selected, so nothing was reviewed`
  * return incomplete to the caller
* read only the sign-off files this round minted, at each lane's `{{lane_signoff_paths}}.<lane>`
* if no sign-off file was read at all
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: zero lane sign-offs were read`
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if any sign-off omits `review_round` in its front matter
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: a sign-off without a review_round cannot be dated to this round`
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if any sign-off names a `review_round` other than `{{review_round}}`
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: a sign-off from an earlier round cannot count for this one`
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if any sign-off file for a lane in `{{blind_lanes}}` is missing
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: missing blind reviewer sign-off(s)`
  * set `{{blocking_findings}}` to a finding naming the missing lane(s)
  * run [Restore Artifact Dir](#restore-artifact-dir)
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
  * keep every lane sign-off file as this round's evidence, because the next round mints its own names
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if every lane in `{{blind_lanes}}` has `signed_off: true` and empty `p_findings`
  * set `{{summary_collision_attempts}}` to `1` when empty, otherwise to `{{summary_collision_attempts}}` plus `1`
  * if `{{summary_collision_attempts}}` is greater than `2`
    * set `{{grade}}` to `Not ready for {{proof_scope}}`
    * set `{{proof_decision}}` to `Not accepted: lanes kept returning identical summaries`
    * run [Restore Artifact Dir](#restore-artifact-dir)
    * return incomplete to the caller
  * if any two `verifier_summary` texts are identical
    * keep every lane sign-off file as this round's evidence, because the next round mints its own names
    * set `{{review_round}}` to `{{review_round}}` plus `1`, so the retry mints and dates its own artifacts
    * run [Restore Artifact Dir](#restore-artifact-dir)
    * [Triple Adversarial Blind Review](#triple-adversarial-blind-review)
  * set `{{blocking_findings}}` to `[]`
  * set residual notes from any non-blocking commentary without weakening the gate
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} via adversarial blind multi-lane review ({{blind_lanes}})`
  * when an `hsm` or `eng-hsm` lane signed off `n/a` or `lane_applicable: false`, keep that in residual notes so the verdict never reads as state machine proof
  * set `{{artifact_kind}}` to `review-verdict`
  * set `{{artifact_subject}}` to `{{review_key}}`
  * set `{{artifact_ordinal}}` to `{{review_round}}`
  * run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path)
  * persist the durable verdict at `{{mdscript_artifact}}`
  * write its final state as the exact next-step command: the repair entrypoint when blocked, or the publication entrypoint when proven
  * write it as executable MDScript: YAML front matter first, then the exact execution header, then the states below
  * set front matter to `reviewer_skill: "self-review"`, `multi_lane_blind: true`, `lanes` set to `{{blind_lanes}}`, `lane_selection_reasons`, `hsm_lane_verdict` when the HSM lane ran, `signoff_paths` for every lane file, `goal`, `conversation_id`, `run_id`, `proof_scope`, `grade`, `proof_decision`, `blocking_severities`, empty `blocking_findings`, `residual_findings`, `proof_supplied`, `proof_not_claimed`, `artifact_paths`, `commands_run`, `review_round`, and `reviewed_at`
  * write a `## Verdict` state naming the grade, the proof scope, every lane that signed off, and each residual finding
  * write a `## Resume From Verdict` state that dispatches on `grade`:
    * when `grade` starts with `Proven for` and `blocking_findings` is empty, continue at the caller's completion entry, defaulting to `/mdscript-exec ~/.agents/skills/self-goal/SKILL.md#complete-goal` on a goal run
    * when `grade` starts with `Not ready for`, fix every `blocking_findings` entry and continue at the caller's repair entry, defaulting to `/mdscript-exec ~/.agents/skills/self-goal/SKILL.md#pursue-goal` on a goal run
    * when `grade` starts with `Blocked for`, continue at the caller's stop entry, defaulting to `/mdscript-exec ~/.agents/skills/self-goal/SKILL.md#manual-stop` on a goal run
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return complete to the caller
