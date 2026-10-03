<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## MDScript Blind Review

* set `{{reviewer_lane}}` to `mdscript`
* set `{{reviewer_id}}` to `mdscript`
* make sure that the packet gives `{{review_signoff_dir}}`, `{{run_dir}}`, or `{{artifact_dir}}`
* make sure that the packet gives `{{review_skill_root}}` for the aggregation re-entry
* if none of `{{review_signoff_dir}}`, `{{run_dir}}`, and `{{artifact_dir}}` is set
  * set `{{blocker}}` to `mdscript lane has no sign-off directory from the packet`
  * report `{{blocker}}` to the reviewer that composes the review
  * stop
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute directory of the self-review skill that owns this lane file
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
    * set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-mdscript.mdscript.md`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_path}}` to `{{run_dir}}/signoff-reviewer-mdscript.mdscript.md`
  * otherwise set `{{signoff_path}}` to `{{artifact_dir}}/signoff-reviewer-mdscript.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract
* the process that composes the review keeps the log of the round
* you are a **blind adversarial** reviewer for **violations of the MDScript author rules and execution contract only**
* read only the neutral review packet and the MDScript paths that it authorizes
* before you write your sign-off, do not read the sign-offs, prompts, verdicts, or preferred grades of other reviewers
* set `signed_off: false` as the default
* set `{{mdscript_paths}}` to all MDScript files in scope: `SKILL.md` bodies, `*.mdscript.md`, and linked workflow, check, and template MDScripts
* if `{{mdscript_paths}}` is empty
  * set `{{lane_applicable}}` to `false`
  * [Write MDScript Signoff](#write-mdscript-signoff)
* [Run MDScript Review Gates](#run-mdscript-review-gates)

## Run MDScript Review Gates

* run `/mdscript-review {{mdscript_paths}}` to execute the structure, line-budget, actions, branches, links, variables, and prompts gates
* if the `mdscript-review` skill is not available in this runtime
  * [Check MDScript Contract Directly](#check-mdscript-contract-directly)
* if a gate opened the circuit
  * record that gate, its rule ids, and the measured line counts
* copy each unwaived `mdscript-review` finding into `p_findings` with its rule id, severity, file, heading, evidence, and fix hint
* [Attack MDScript Execution](#attack-mdscript-execution)

## Check MDScript Contract Directly

* make sure that each file starts with the execution header
* for a `SKILL.md`, make sure that the front matter has a valid `name` and `description`
* measure each file with `wc -l`
* record each file at or over 200 lines, and each file at or over 500 lines
* make sure that each in-file heading link goes to a `##` heading in that file
* make sure that each relative file link goes to a file that exists and has the anchor
* make sure that an earlier state sets each `{{variable}}` that a path, command, or condition uses
  * if no earlier state sets it, make sure that the file documents it as caller-supplied
* make sure that each failure, retry, and recovery path ends in an explicit heading link or an explicit stop
* make sure that each state that asks the user names the variable or decision
* make sure that each state that asks the user writes a return script before the prompt
* [Attack MDScript Execution](#attack-mdscript-execution)

## Attack MDScript Execution

* trace one or more full paths from the entry heading to each terminal state, as a one-bullet-at-a-time executor
* attack the workflow for unbounded cycles:
  * find each back-edge
  * name the counter or guard that stops it, or record that it has none
* attack direct heading entry:
  * enter each public heading cold
  * examine if its guards still keep the invariants of the workflow
* attack guards that read variables that no earlier state sets
* attack guards that read a value that a later step writes after the check
* attack states that put many tool actions together, and route decisions hidden in an action bullet
* record ≥2 real `attack_attempts`, and include failed attacks
* set `commands_run` to the commands that you used, such as `/mdscript-review`, `wc -l`, and link or anchor checks
* set `artifact_paths` to the MDScript paths that you inspected
* [Write MDScript Signoff](#write-mdscript-signoff)

## Write MDScript Signoff

* if all serious attacks fail, `p_findings` is `[]`, and `remaining_gaps` is `[]`
  * allow `signed_off: true`
* otherwise keep `signed_off: false` with non-empty `p_findings`, non-empty `remaining_gaps`, or both
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set these front matter fields: `reviewer_id: "mdscript"`, `reviewer_lane: "mdscript"`, and `review_round` from the packet
* if the packet has `goal` and `conversation_id`, set them from the packet
* set `signed_off`, `lane_applicable`, `verifier_summary`, `evidence`, `commands_run`, `attack_attempts`, and `p_findings`
* set `artifact_paths`, `objectives_checked`, `remaining_gaps`, and `signed_off_at`
* if the packet gives `repair_resume_command`, set it
* write a `## Signoff` state that names the lane verdict
* in that state, write one bullet for each `p_findings` entry, with its location and remediation
* write a `## Resume From Signoff` state
* in that state, if `signed_off` is `true`, write a jump to `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs`
* in that state, if `signed_off` is `false`, name `repair_resume_command` as the next jump
* in that state, if `signed_off` is `false`, write that a new blind reviewer must review the repair
* do not write the sign-off files of other lanes
* stop after you write the sign-off
