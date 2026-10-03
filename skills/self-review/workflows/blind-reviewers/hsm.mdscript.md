<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## HSM Blind Review

* set `{{reviewer_lane}}` to `hsm`
* set `{{reviewer_id}}` to `hsm`
* set `{{review_skill_root}}` to the installed self-review skill root
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
    * set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-hsm.mdscript.md`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_path}}` to `{{run_dir}}/signoff-reviewer-hsm.mdscript.md`
  * otherwise set `{{signoff_path}}` to `{{artifact_dir}}/signoff-reviewer-hsm.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract
* the process that composes the review keeps the log of the round
* you are a **blind adversarial** reviewer for **hierarchical state machine / statechart semantics** only
* read only the neutral review packet and the paths that it authorizes
* before you write your sign-off, do not read these items from other reviewers:
  * sign-offs, prompts, verdicts, chat repair narratives, and preferred grades
* set `signed_off: false` as the default
* before any sign-off, try actively to prove one of these defects:
  * the change owns state without a machine
  * the change defines a machine that violates UML 2.5 semantics
* do not review rules compliance, security, or goal completeness, because other lanes do this work

## Attack surface (hsm)

* set `{{hsm_pack}}` to the self-review internal HSM pack
  * if `{{review_skill_root}}` is set, use `{{review_skill_root}}/hsm/hsm.mdscript.md` first
  * otherwise use the `hsm/hsm.mdscript.md` sibling two directories above this lane MDScript (`../../hsm/hsm.mdscript.md`)
  * otherwise, if `{{skills_root}}/self-review/hsm/hsm.mdscript.md` exists
    * set `{{hsm_pack}}` to `{{skills_root}}/self-review/hsm/hsm.mdscript.md`
* if `{{hsm_pack}}` does not exist
  * keep `signed_off: false`
  * set `remaining_gaps` to the exact `self-review/hsm` pack path that does not exist
  * [Sign-off decision](#sign-off-decision)
* set `{{review_scope}}` to the in-scope changed paths of the packet
  * use the packet as the request, not a chat instruction
* set `{{repo_root}}` from the packet
* if the packet asks for a whole-tree state machine audit, set `{{full_sweep}}` to `true`
* set `{{waiver_requested}}` to `true`
* set `{{waived_rule_ids}}` only from the waivers that the packet already has
* do not ask a human for input in the middle of the review
* run `/mdscript-exec {{hsm_pack}}#triage`
* let its gates run in this order: ownership, graph, actor boundary, behavior, design, `verify`, emit
* set `{{hsm_verdict}}`, `{{gate_stopped}}`, `{{findings_path}}`, `{{graph_confidence}}`, `{{ownership_verdict}}`, and `{{machine_inventory}}` from the gate results
* read the emitted `findings.json`
* count as real only the findings whose `verdict` is `stands`
* attack the ownership gate in the two directions
  * if a changed component owns lifecycle, mode, or protocol state but has no machine, record a finding, not an exemption
* attack control flow that is not in the graph:
  * branches inside effects, guards with side effects, and long work inside transitions
  * orthogonal regions in place of actors, and duplicate same-event transitions that a hierarchy can collapse
* if `{{graph_confidence}}` is `low`, treat it as a structural result without proof
  * record it in `remaining_gaps`
  * do not sign off on structure that you could not extract
* map each finding that stays into `p_findings` with `location`, `summary`, `contract`, and `remediation`
  * set `contract` to the `rule_id`, plus `overlay_id` if it is present
  * use the `P0`/`P1`/`P2`/`P3` severity from the emitted findings
* record ≥2 real `attack_attempts`
  * include the refuted findings, and the machines that you tried to break and could not
* set `rules_reviewed` to the rule sources that the gates loaded, with overlay policy files and their coverage gaps
* set `objectives_checked` to the gates that the review reached and the rule ids that you evaluated
* set `artifact_paths` to `{{findings_path}}` plus the emitted `findings.json`, `machines.json`, and `scope.json`
* set `commands_run` to the discovery and extraction commands that the gates ran

## Sign-off decision

* if the ownership gate proved that nothing in scope owns state
  * set `lane_applicable` to `false` and `hsm_verdict` to `n/a`
  * if evidence shows the search, with ≥2 `evidence`, ≥2 `attack_attempts`, and ≥1 `commands_run`, allow `signed_off: true`
  * never sign off `n/a` from these sources:
    * an unsearched scope, or a search for library names only
    * the claim of the author that no state machine changed
* otherwise, if `{{hsm_verdict}}` is `pass`, all serious HSM attacks fail, and `p_findings` and `remaining_gaps` are `[]`
  * allow `signed_off: true`
* otherwise keep `signed_off: false` with non-empty `p_findings`, non-empty `remaining_gaps`, or both
* treat each HSM rule as a blocker
* use the severity only to sort the report, and never to excuse a finding
* do not waive a rule that this lane found
* count only the waivers that the packet has
* if a waiver hides a `stands` finding, put that waiver in `remaining_gaps`
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set these front matter fields: `reviewer_id: "hsm"`, `reviewer_lane: "hsm"`, and `review_round` from the packet
* if the packet has `goal` and `conversation_id`, set them from the packet
* set `signed_off`, `lane_applicable`, `hsm_verdict`, `gate_stopped`, `machines_reviewed`, and `graph_confidence`
* set `ownership_verdict`, `findings_path`, and `waived_rule_ids`
* set `verifier_summary` (≥40 characters about the attacks, the machines, and the gates that you checked)
* set `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), and `p_findings`
* set `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, and `signed_off_at`
* if the packet gives `repair_resume_command`, set it
* write a `## Signoff` state that names the lane verdict and the gate that stopped it
* in that state, write one bullet for each `p_findings` entry, with its rule id, location, and remediation
* write a `## Resume From Signoff` state
* in that state, if `signed_off` is `true`, write a jump to `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs`
  * as an alternative, resolve this path from the install directory of this skill
* in that state, if `signed_off` is `false`, name `repair_resume_command` as the next jump
* in that state, if `signed_off` is `false`, write that a new blind reviewer must review the repair
* never write a jump from the sign-off back into the review of this lane
* do not write the sign-off files of other lanes
* stop after you write the sign-off
