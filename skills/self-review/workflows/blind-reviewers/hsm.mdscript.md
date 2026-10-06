<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## HSM Blind Review

* set `{{reviewer_lane}}` to `hsm`
* run [Open Lane Signoff](../triple-adversarial-blind-review.mdscript.md#open-lane-signoff)
* try to prove that the change owns state without a machine, or defines a machine that breaks UML 2.5 semantics
* set `{{hsm_pack}}` to `{{review_skill_root}}/hsm/hsm.mdscript.md`, or `../../hsm/hsm.mdscript.md` from this file
  * if it does not exist, put its path in `remaining_gaps`, and run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
* set `{{review_scope}}` to the changed paths of the packet, and `{{repo_root}}` from the packet
* set `{{full_sweep}}` to `true` only if the packet asks for a whole-tree audit
* set `{{waiver_requested}}` to `true`, and take `{{waived_rule_ids}}` only from the packet; do not ask a human mid-review
* run `/mdscript-exec {{hsm_pack}}#triage`, and read the emitted `findings.json`
* count only findings whose `verdict` is `stands`
* attack both directions of the ownership gate
  * a component that owns lifecycle, mode, or protocol state without a machine is a finding
* attack control flow outside the graph:
  * branches in effects, guards with side effects, and long work in transitions
  * regions used as actors, and duplicate same-event transitions
* if `{{graph_confidence}}` is `low`, put it in `remaining_gaps`, and do not sign off on structure that you could not extract
* set `contract` to the `rule_id` and any `overlay_id`, and `artifact_paths` to the emitted `findings.json`, `machines.json`, and `scope.json`
* run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
