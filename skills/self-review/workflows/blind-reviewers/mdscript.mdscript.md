<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## MDScript Blind Review

* set `{{reviewer_lane}}` to `mdscript`
* set `{{reviewer_id}}` to `mdscript`
* require the packet to supply `{{review_signoff_dir}}` or `{{run_dir}}` or `{{artifact_dir}}`, and `{{review_skill_root}}` for the aggregation re-entry
* if none of `{{review_signoff_dir}}`, `{{run_dir}}`, and `{{artifact_dir}}` is set
  * set `{{blocker}}` to `mdscript lane has no sign-off directory from the packet`
  * stop and report `{{blocker}}` to the composing reviewer
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute directory of the self-review skill that owns this lane file
* if the caller supplied `{{signoff_path}}`, write only that path and do not recompute it
* otherwise set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-mdscript.mdscript.md` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-mdscript.mdscript.md` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-mdscript.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract; the composing process keeps the round's log
* you are a **blind adversarial** reviewer for **MDScript authoring and execution-contract violations only**
* read only the neutral review packet and the MDScript paths it authorizes — do not read other reviewers' sign-offs, prompts, verdicts, or preferred grades before writing your own
* default to `signed_off: false`
* set `{{mdscript_paths}}` to every MDScript file in scope: `SKILL.md` bodies, `*.mdscript.md`, and linked workflow, check, and template MDScripts
* if `{{mdscript_paths}}` is empty
  * set `{{lane_applicable}}` to `false`
  * [Write MDScript Signoff](#write-mdscript-signoff)
* [Run MDScript Review Gates](#run-mdscript-review-gates)

## Run MDScript Review Gates

* run `/mdscript-review {{mdscript_paths}}` to execute the structure, line-budget, actions, branches, links, variables, and prompts gates
* if the `mdscript-review` skill is unavailable in this runtime
  * [Check MDScript Contract Directly](#check-mdscript-contract-directly)
* if a gate tripped the circuit
  * record that gate, its rule ids, and the measured line counts
* carry every unwaived `mdscript-review` finding into `p_findings` with its rule id, severity, file, heading, evidence, and fix hint
* [Attack MDScript Execution](#attack-mdscript-execution)

## Check MDScript Contract Directly

* verify each file starts with the execution header and, for a `SKILL.md`, valid `name` and `description` front matter
* measure each file with `wc -l` and flag any file at or over 200 lines, and any file at or over 500 lines
* verify every in-file heading link resolves to a `##` heading in that file and every relative file link exists with its anchor present
* verify every `{{variable}}` used in a path, command, or condition is set by an earlier state or documented as caller-supplied
* verify every failure, retry, and recovery path ends in an explicit heading link or an explicit stop
* verify every state that asks the user names the variable or decision and writes a return script before the prompt
* [Attack MDScript Execution](#attack-mdscript-execution)

## Attack MDScript Execution

* trace at least one full path from the entry heading to each terminal state as a one-bullet-at-a-time executor would
* attack the workflow for unbounded cycles: find every back-edge and name the counter or guard that stops it, or record its absence
* attack direct heading entry: enter each public heading cold and check whether its guards still hold the workflow's invariants
* attack guards that read variables no state sets before that point, and guards that read a value written after the check
* attack states that bundle several tool actions, and routing decisions hidden inside an action bullet
* record ≥2 real `attack_attempts`, including failed attacks
* set `commands_run` to the commands used, such as `/mdscript-review`, `wc -l`, and link or anchor checks
* set `artifact_paths` to the MDScript paths inspected
* [Write MDScript Signoff](#write-mdscript-signoff)

## Write MDScript Signoff

* allow `signed_off: true` only when every serious attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* write only `{{signoff_path}}` as executable MDScript: the exact execution header, YAML front matter, then the states below
* set front matter to `reviewer_id: "mdscript"`, `reviewer_lane: "mdscript"`, `goal` and `conversation_id` from the packet when present, `signed_off`, `lane_applicable`, `verifier_summary`, `evidence`, `commands_run`, `attack_attempts`, `p_findings`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`, and `repair_resume_command` when the packet supplies one
* write a `## Signoff` state that names the lane verdict and one bullet per `p_findings` entry with its location and remediation
* write a `## Resume From Signoff` state that continues at `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs` when `signed_off` is `true`
* in that same state, when `signed_off` is `false`, name `repair_resume_command` as the next jump and require a fresh blind reviewer after repair
* do not write other lanes' sign-off files
* stop after writing the sign-off
