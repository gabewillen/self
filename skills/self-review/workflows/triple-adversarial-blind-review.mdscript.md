<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triple Adversarial Blind Review

* run this only in the parent agent that can spawn subagents, never in a nested review subagent
* do not grade a terminal gate alone; use blind lane subagents
* run [Select Review Lanes](select-review-lanes.mdscript.md#select-review-lanes)
* set `{{review_signoff_dir}}` to `{{run_dir}}`, or `{{artifact_dir}}/reviews/{{review_key}}`, and create it
* set `{{prior_artifact_dir}}` to `{{artifact_dir}}` if it is empty, then set `{{artifact_dir}}` to `{{review_signoff_dir}}` for this round
* for each lane, run [Mint MDScript Artifact Path](../../self-common/workflows/mdscript-artifact.mdscript.md#mint-mdscript-artifact-path) with kind `<lane>-signoff`, ordinal `{{review_round}}`, and `{{artifact_reserve_only}}` set to `true`
  * set `{{lane_signoff_paths}}.<lane>` to the minted path
* if the caller wrote no packet for this round
  * set `{{artifact_kind}}` to `review-packet`, and `{{artifact_reserve_only}}` and `{{mdscript_artifact}}` to empty
  * run [Start MDScript Running Log](../../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log) from the [review-packet template](../../self-common/templates/review-packet.mdscript.md)
* set `{{review_packet}}` to the packet with the scope, authorized paths, and open questions of this round
* never delete or overwrite a sign-off or packet of an earlier round
* spawn every lane in one turn as a readonly subagent that runs only `mdscript-exec <lane entry>`
  * give it only the packet, authorized paths, `{{proof_scope}}`, the goal, and `{{conversation_id}}`
  * also give it `{{review_skill_root}}`, `{{review_round}}`, its `{{signoff_path}}`, and for an `eng-*` lane its `{{rules_pack}}`
  * never give it `/self-review`, this workflow, or a reason to spawn subagents
  * tell it not to read other lanes before it writes its sign-off
  * use a reviewer model that fits the task, and never a subagent that saw the author's fix narrative this round
* wait for each lane, then [Aggregate Triple Signoffs](#aggregate-triple-signoffs)

## Aggregate Triple Signoffs

* read only the sign-offs that this round minted
* return `Not ready for {{proof_scope}}` to the caller if any of these is true:
  * no lane was selected, or no sign-off was read
  * a sign-off has no `review_round`, or a round other than `{{review_round}}`
  * a selected lane has no sign-off
* check each sign-off on its own:
  * `goal` and `conversation_id` match the packet, and `reviewer_id` matches the lane
  * `verifier_summary` has 40 characters or more
  * 2 or more `evidence`, 2 or more `attack_attempts`, and 1 or more `commands_run`
  * `p_findings` is present, and `remaining_gaps` is empty when `signed_off: true`
  * `lane_applicable: false` still meets this bar
* if a lane has `signed_off: false`, `p_findings`, or `remaining_gaps`
  * add them to `{{blocking_findings}}`
  * grade `Not ready for {{proof_scope}}`, or `Blocked for {{proof_scope}}` for a true missing precondition
  * set `{{artifact_dir}}` back to `{{prior_artifact_dir}}`, and return to the caller
* if two `verifier_summary` texts are identical
  * add `1` to `{{review_round}}`, and run this review again, at most two times
  * after that, grade `Not ready for {{proof_scope}}`, and return to the caller
* set `{{grade}}` to `Proven for {{proof_scope}}`, and `{{proof_decision}}` to `Proven for {{proof_scope}} via adversarial blind multi-lane review ({{blind_lanes}})`
* if an `hsm` or `eng-hsm` lane signed off `n/a`, say in the residuals that this is not state machine proof
* mint a `review-verdict` artifact, and write it as executable MDScript with this front matter:
  * `reviewer_skill: "self-review"`, `multi_lane_blind: true`, `lanes`, `lane_selection_reasons`, `hsm_lane_verdict`, `signoff_paths`
  * `goal`, `conversation_id`, `run_id`, `proof_scope`, `grade`, `proof_decision`, `blocking_severities`, empty `blocking_findings`, `residual_findings`
  * `proof_supplied`, `proof_not_claimed`, `artifact_paths`, `commands_run`, `review_round`, `reviewed_at`
* write `## Verdict` with the grade, the scope, the lanes, and the residuals
* write `## Resume From Verdict` that continues on `grade`:
  * `Proven for`: the caller's completion entry, by default `/mdscript-exec {{skills_root}}/self-goal/SKILL.md#complete-goal`
  * `Not ready for`: fix each finding, then the caller's repair entry, by default `/mdscript-exec {{skills_root}}/self-goal/SKILL.md#pursue-goal`
  * `Blocked for`: the caller's stop entry, by default `/mdscript-exec {{skills_root}}/self-goal/SKILL.md#manual-stop`
* set `{{artifact_dir}}` back to `{{prior_artifact_dir}}`
* return complete to the caller
