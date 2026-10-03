<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triple Adversarial Blind Review

* run this workflow from the **parent** agent that can spawn subagents
* the parent agent is the implementer lane owner, the goal orchestrator, or the main chat
* do not run this workflow in a nested `self-review` subagent
* do not spawn a subagent whose assignment is the full `self-review` skill or this whole composition skill
* use independent, blind, adversarial **lane** subagents for terminal readiness
* do not grade the completion yourself as a single reviewer
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute directory of this skill
* run [Select Review Lanes](select-review-lanes.mdscript.md#select-review-lanes)
* if `{{blind_lanes}}` is empty after selection
  * set `{{blocker}}` to `lane selection produced no blind lanes`
  * report the empty lane set
  * stop
* if `{{blind_lanes}}` does not contain `rules`, `security`, or `completeness`
  * set `{{blocker}}` to `always-on blind lanes missing after selection`
  * report the incomplete always-on set
  * stop
* if `{{run_dir}}` is set
  * set `{{review_signoff_dir}}` to `{{run_dir}}`
* if `{{run_dir}}` is empty
  * set `{{review_signoff_dir}}` to `{{artifact_dir}}/reviews/{{review_key}}`
* if `{{review_signoff_dir}}` does not exist
  * create `{{review_signoff_dir}}`
* if `{{prior_artifact_dir}}` is empty
  * set `{{prior_artifact_dir}}` to `{{artifact_dir}}`, so that a retry does not capture an already-rebound value
* set `{{artifact_dir}}` to `{{review_signoff_dir}}` for the artifacts of this round only
* for each lane id in `{{blind_lanes}}`
  * set `{{artifact_kind}}` to `<lane>-signoff`
  * set `{{artifact_subject}}` to `{{review_key}}`
  * set `{{artifact_ordinal}}` to `{{review_round}}`
  * set `{{artifact_reserve_only}}` to `true`
  * run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path)
  * set `{{lane_signoff_paths}}.<lane>` to `{{mdscript_artifact}}`
  * use a different key for each lane, so that the loop does not keep one path for all lanes
  * do not expect a file at that path until that lane writes it
* set `{{artifact_kind}}` to `review-packet`
* set `{{artifact_ordinal}}` to `{{review_round}}`
* set `{{artifact_reserve_only}}` to empty
* set `{{mdscript_artifact}}` to empty, so that the packet does not get the sign-off path of the last lane
* set `{{artifact_subject}}` to `{{review_key}}`
* if the caller already wrote this round's packet
  * set `{{review_packet}}` to that packet path
* if the caller did not write this round's packet
  * set `{{artifact_kind}}` to `review-packet`
  * set `{{next_steps}}` to this round's scope, authorized paths, and open questions, from [review-packet template](../../self-common/templates/review-packet.mdscript.md)
  * run [Start MDScript Running Log](../../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log)
  * set `{{review_packet}}` to `{{mdscript_artifact}}`, so that a lost context can continue the round from the disk
* make sure that `{{review_packet}}` contains the scope, the authorized paths, and the open questions of this round
* give the lanes the same packet that you examined
* do not delete or overwrite a sign-off or a packet of an earlier round
* each round mints its own lexicographic name, so that the history stays readable in order
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the selected lanes and the spawn as the next step
* [Spawn Selected Lanes](#spawn-selected-lanes)

## Spawn Selected Lanes

* spawn **every lane in `{{blind_lanes}}` as a readonly blind subagent in one turn** (parallel) from **this** parent process
* for each lane id in `{{blind_lanes}}`
  * set `{{lane_entry}}` to `{{lane_entrypoints}}.<lane>`
  * if `{{lane_entry}}` is empty
    * set `{{blocker}}` to `missing entrypoint for lane <lane>`
    * report that the lane has no entrypoint
    * stop
  * spawn one readonly subagent that runs only `mdscript-exec {{lane_entry}}`
  * do not assign `/self-review`, `self-review/SKILL.md`, or this composition workflow as the role of the subagent
  * do not tell a lane subagent to spawn more subagents, because many harnesses forbid nested fanout
* give each subagent only these items:
  * the neutral packet path and the authorized paths
  * `{{proof_scope}}`, and `{{goal_text}}` or `{{intended_done_state}}`
  * `{{conversation_id}}`, `{{review_signoff_dir}}`, `{{review_skill_root}}`, and `{{review_round}}`
  * its own `{{lane_signoff_paths}}.<lane>` as `{{signoff_path}}` for this round
  * its own MDScript entrypoint
* if an engineering-rules lane has a thin entrypoint that does not set these values
  * also give `{{reviewer_lane}}` and either `{{rules_pack}}` or `{{rules_file}}` to the subagent
* tell each subagent not to read the sign-offs or the prompts of other lanes before it writes its own file
* set the model of each subagent to a reviewer model that is applicable to the task
* do not reuse a subagent that already saw author fix narration for the same round
* wait for every spawned lane to finish
* read the front matter of the sign-off MDScript of each lane
* [Aggregate Triple Signoffs](#aggregate-triple-signoffs)

## Restore Artifact Dir

* if `{{prior_artifact_dir}}` is empty
  * return to the caller, because there is no rebound value to undo
* set `{{artifact_dir}}` back to `{{prior_artifact_dir}}`, so that the author repair log does not mint files among the blind sign-offs
* return to the caller

## Aggregate Triple Signoffs

* if `{{blind_lanes}}` is empty
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: no blind lanes were selected, so nothing was reviewed`
  * return incomplete to the caller
* read only the sign-off files that this round minted, at `{{lane_signoff_paths}}.<lane>` for each lane
* if you read no sign-off file
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: zero lane sign-offs were read`
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if a sign-off does not have `review_round` in its front matter
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: a sign-off without a review_round cannot be dated to this round`
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if a sign-off names a `review_round` other than `{{review_round}}`
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: a sign-off from an earlier round cannot count for this one`
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if the sign-off file for a lane in `{{blind_lanes}}` does not exist
  * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * set `{{proof_decision}}` to `Not accepted: missing blind reviewer sign-off(s)`
  * set `{{blocking_findings}}` to a finding that names each lane without a sign-off
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* validate each sign-off independently for these items:
  * the same `goal` and `conversation_id` as the packet, if the packet has them
  * the correct `reviewer_id` and lane
  * `verifier_summary` ≥ 40 chars
  * ≥2 `evidence`, ≥2 `attack_attempts`, ≥1 `commands_run`
  * `p_findings` is present, and is empty only if the lane signed off
  * `remaining_gaps` is empty if `signed_off: true`
* if an optional lane (`hsm`, `eng-*`) ran
  * validate that lane the same way
* accept `lane_applicable: false` only if the sign-off still meets the evidence bar above
* if a lane has `signed_off: false` or non-empty `p_findings` / `remaining_gaps`
  * add all `p_findings`, `attack_attempts`, and `remaining_gaps` to `{{blocking_findings}}` for the next fix wave
  * if the findings are repairable
    * set `{{grade}}` to `Not ready for {{proof_scope}}`
  * if a lane names a true precondition that is not available and that you cannot stand up
    * set `{{grade}}` to `Blocked for {{proof_scope}}`
  * keep each lane sign-off file as evidence of this round, because the next round mints its own names
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return incomplete to the caller
* if every lane in `{{blind_lanes}}` has `signed_off: true` and empty `p_findings`
  * if `{{summary_collision_attempts}}` is empty
    * set `{{summary_collision_attempts}}` to `0`
  * set `{{summary_collision_attempts}}` to `{{summary_collision_attempts}}` plus `1`
  * if `{{summary_collision_attempts}}` is greater than `2`
    * set `{{grade}}` to `Not ready for {{proof_scope}}`
    * set `{{proof_decision}}` to `Not accepted: lanes kept returning identical summaries`
    * run [Restore Artifact Dir](#restore-artifact-dir)
    * return incomplete to the caller
  * if two `verifier_summary` texts are identical
    * keep each lane sign-off file as evidence of this round, because the next round mints its own names
    * set `{{review_round}}` to `{{review_round}}` plus `1`, so that the retry mints and dates its own artifacts
    * run [Restore Artifact Dir](#restore-artifact-dir)
    * [Triple Adversarial Blind Review](#triple-adversarial-blind-review)
  * set `{{blocking_findings}}` to `[]`
  * set residual notes from the non-blocking commentary
  * do not make the gate weaker
  * set `{{grade}}` to `Proven for {{proof_scope}}`
  * set `{{proof_decision}}` to `Proven for {{proof_scope}} via adversarial blind multi-lane review ({{blind_lanes}})`
  * if an `hsm` or `eng-hsm` lane signed off `n/a` or `lane_applicable: false`
    * keep that in the residual notes, so that the verdict does not read as state machine proof
  * set `{{artifact_kind}}` to `review-verdict`
  * set `{{artifact_subject}}` to `{{review_key}}`
  * set `{{artifact_ordinal}}` to `{{review_round}}`
  * run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path)
  * write the durable verdict to `{{mdscript_artifact}}`
  * write its final state as the exact next-step command: the repair entrypoint if blocked, or the publication entrypoint if proven
  * write it as executable MDScript: YAML front matter first, then the exact execution header, then the states below
  * set these front matter fields:
    * `reviewer_skill: "self-review"`, `multi_lane_blind: true`, and `lanes` set to `{{blind_lanes}}`
    * `lane_selection_reasons`, and `hsm_lane_verdict` if the HSM lane ran
    * `signoff_paths` for each lane file, `goal`, `conversation_id`, `run_id`, and `proof_scope`
    * `grade`, `proof_decision`, `blocking_severities`, an empty `blocking_findings`, and `residual_findings`
    * `proof_supplied`, `proof_not_claimed`, `artifact_paths`, `commands_run`, `review_round`, and `reviewed_at`
  * write a `## Verdict` state that names the grade, the proof scope, each lane that signed off, and each residual finding
  * if `{{skills_root}}` is empty and `{{review_skill_root}}` is set
    * set `{{skills_root}}` to the parent of `{{review_skill_root}}`
  * write a `## Resume From Verdict` state that dispatches on `grade`:
    * if `grade` starts with `Proven for` and `blocking_findings` is empty
      * continue at the completion entry of the caller
      * on a goal run, use `/mdscript-exec {{skills_root}}/self-goal/SKILL.md#complete-goal` as the default
    * if `grade` starts with `Not ready for`
      * fix each `blocking_findings` entry
      * continue at the repair entry of the caller
      * on a goal run, use `/mdscript-exec {{skills_root}}/self-goal/SKILL.md#pursue-goal` as the default
    * if `grade` starts with `Blocked for`
      * continue at the stop entry of the caller
      * on a goal run, use `/mdscript-exec {{skills_root}}/self-goal/SKILL.md#manual-stop` as the default
  * run [Restore Artifact Dir](#restore-artifact-dir)
  * return complete to the caller
