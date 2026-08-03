<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## HSM Blind Review

* set `{{reviewer_lane}}` to `hsm`
* set `{{reviewer_id}}` to `hsm`
* set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-hsm.mdscript.md` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-hsm.mdscript.md` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-hsm.mdscript.md`
* you are a **blind adversarial** reviewer for **hierarchical state machine / statechart semantics** only
* read only the neutral review packet and paths it authorizes — do not read other reviewers' sign-offs, prompts, verdicts, chat repair narratives, or preferred grades before writing your own
* default to `signed_off: false`
* actively try to prove the change owns state without a machine, or defines a machine that violates UML 2.5 semantics, before any sign-off
* do not review rules compliance, security, or goal completeness — those are other lanes

## Attack surface (hsm)

* set `{{hsm_pack}}` to the self-review internal HSM pack
  * prefer `{{review_skill_root}}/hsm/hsm.mdscript.md` when `{{review_skill_root}}` is set
  * otherwise the `hsm/hsm.mdscript.md` sibling two directories above this lane MDScript (`../../hsm/hsm.mdscript.md`)
  * otherwise `~/.agents/skills/self-review/hsm/hsm.mdscript.md`
  * otherwise `{{repo_root}}/skills/self-review/hsm/hsm.mdscript.md` when present
* if `{{hsm_pack}}` is missing
  * keep `signed_off: false`
  * set `remaining_gaps` to the exact missing `self-review/hsm` pack path
  * [Sign-off decision](#sign-off-decision)
* set `{{review_scope}}` to the packet's in-scope changed paths — the packet is the request, not a chat instruction
* set `{{repo_root}}` from the packet
* set `{{full_sweep}}` to `true` only when the packet asks for a whole-tree state machine audit
* set `{{waiver_requested}}` to `true` and set `{{waived_rule_ids}}` only from waivers the packet already carries, so this lane never prompts a human mid-review
* run `/mdscript-exec {{hsm_pack}}#triage` and let its gates run in order: ownership, graph, actor boundary, behavior, design, verify, emit
* set `{{hsm_verdict}}`, `{{gate_stopped}}`, `{{findings_path}}`, `{{graph_confidence}}`, `{{ownership_verdict}}`, and `{{machine_inventory}}` from what those gates returned
* read the emitted `findings.json` — only findings whose `verdict` is `stands` are real
* attack the ownership gate in both directions: a changed component that owns lifecycle, mode, or protocol state but has no machine is a finding, not an exemption
* attack control flow that left the graph — branching inside effects, guards with side effects, long work inside transitions, orthogonal regions standing in for actors, duplicate same-event transitions that hierarchy should collapse
* treat `{{graph_confidence}}` of `low` as an unverified structural result: record it in `remaining_gaps` instead of signing off on structure you could not extract
* map each surviving finding into `p_findings` with `location`, `summary`, `contract` (the `rule_id`, plus `overlay_id` when present), `remediation`, and its `P0`/`P1`/`P2`/`P3` severity from the emitted findings
* record ≥2 real `attack_attempts` (include refuted findings and the machines you tried and failed to break)
* set `rules_reviewed` to the rule sources the gates loaded, including overlay policy files and their coverage gaps
* set `objectives_checked` to the gates reached and the rule ids evaluated
* set `artifact_paths` to `{{findings_path}}` plus the emitted `findings.json`, `machines.json`, and `scope.json`
* set `commands_run` to the discovery and extraction commands the gates ran

## Sign-off decision

* if the ownership gate proved nothing in scope owns state
  * set `lane_applicable` to `false` and `hsm_verdict` to `n/a`
  * allow `signed_off: true` only when the search itself is evidenced: the same ≥2 `evidence`, ≥2 `attack_attempts`, and ≥1 `commands_run` bar still applies
  * never sign off `n/a` from an unsearched scope, a library-name-only search, or the author's claim that no state machine changed
* otherwise allow `signed_off: true` only when `{{hsm_verdict}}` is `pass`, every serious HSM attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* every HSM rule blocks — severity orders the report and never excuses a finding
* do not waive a rule this lane discovered; only packet-carried waivers count, and each one goes in `remaining_gaps` when it hides a `stands` finding
* write only `{{signoff_path}}` as executable MDScript: the exact execution header, YAML front matter, then the states below
* set front matter to `reviewer_id: "hsm"`, `reviewer_lane: "hsm"`, `goal` and `conversation_id` from the packet when present, `signed_off`, `lane_applicable`, `hsm_verdict`, `gate_stopped`, `machines_reviewed`, `graph_confidence`, `ownership_verdict`, `findings_path`, `waived_rule_ids`, `verifier_summary` (≥40 chars covering attacks + machines and gates checked), `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), `p_findings`, `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`, and `repair_resume_command` when the packet supplies one
* write a `## Signoff` state that names the lane verdict, the gate that stopped it, and one bullet per `p_findings` entry with its rule id, location, and remediation
* write a `## Resume From Signoff` state that continues at `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs` (or the path resolved from this skill's install directory) when `signed_off` is `true`
* in that same state, when `signed_off` is `false`, name `repair_resume_command` as the next jump and require a fresh blind reviewer after repair — never re-enter this lane's own review from the sign-off
* do not write other lanes' sign-off files
* stop after writing the sign-off
