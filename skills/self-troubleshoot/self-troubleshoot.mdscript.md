---
artifact_type: self-troubleshoot
name: self-troubleshoot
description: "Routed MDScript to troubleshoot a reported failure. Reproduce the failure with a red test on the closest safe production-like surface, then find the root cause and fix the cause. Run the same reproduction again, and loop until it is green. This is the body of the self-troubleshoot skill. Enter it with /self-troubleshoot, its SKILL.md, or the self router."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Troubleshoot Reported Issue

* keep each boundary in [boundaries.md](../self/references/boundaries.md) for the routed role that started this workflow
* set `{{skills_root}}` to the installed skills root that the router found
* if `{{skills_root}}` is empty
  * set `{{skills_root}}` to `~/.agents/skills`
* run [Ensure File Task](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task) to set `{{task_id}}`, `{{artifact_dir}}`, and `{{return_dir}}`
* do this before a later state records evidence
* find `{{symptom}}`, `{{failing_surface}}`, `{{reported_evidence}}`, and `{{suspect_scope}}` in the request and the current evidence
* if `{{pass_number}}` is empty
  * set `{{pass_number}}` to `1`
* set `{{artifact_kind}}` to `rca`
* set `{{artifact_subject}}` to `{{symptom}}`
* set `{{artifact_ordinal}}` to `{{pass_number}}`
* run [Start MDScript Running Log](../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log)
* set `{{rca_mdscript}}` to `{{mdscript_artifact}}`
* [Initialize Pass State](#initialize-pass-state)

## Initialize Pass State

* set `{{troubleshoot_iteration}}` to `1`
* set `{{max_troubleshoot_iterations}}` to `3`
* set `{{repro_attempts}}` to `0`
* set `{{candidate_command}}` and `{{candidate_environment}}` to empty
* set `{{obstacle_attempts}}` to `0`
* set `{{fidelity_attempts}}` to `0`
* set `{{rca_attempts}}` to `0`
* set `{{reassess_count}}` to `0`
* set `{{red_confirmed}}` to `false`
* set `{{root_cause}}`, `{{red_proof_path}}`, `{{repro_test_path}}`, `{{repro_command}}`, and `{{repro_test_fingerprint}}` to empty
* set `{{green_proof_paths}}` to an empty list
* if `{{symptom}}` is empty
  * [Ask For Symptom](#ask-for-symptom)
* if the request names more than one failure
  * set `{{symptom}}` to the single failure that this pass troubleshoots
  * record each other failure in the file task as a separate troubleshoot pass
* [Reproduce With Red Test](#reproduce-with-red-test)

## Ask For Symptom

* set `{{pending_decision}}` to a question about the wrong behavior, the surface where it occurs, and the evidence of the reporter
* if `{{parent_reporting_path}}` is set
  * report the paused state and the open question to `{{parent_reporting_path}}` before the prompt stops this lane
* run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this file and `{{return_resume_heading}}` set to `troubleshoot-reported-issue`

## Reproduce With Red Test

* run [Reproduce With Red Test](workflows/reproduce-red-test.mdscript.md#reproduce-with-red-test)

## Analyze Root Cause

* run [Analyze Root Cause](workflows/root-cause-analysis.mdscript.md#analyze-root-cause)

## Apply Root Cause Fix

* run [Apply Root Cause Fix](workflows/apply-fix-and-rerun.mdscript.md#apply-root-cause-fix)

## Rerun Reproduction

* run [Rerun Reproduction](workflows/apply-fix-and-rerun.mdscript.md#rerun-reproduction)

## Decide Troubleshoot Loop

* run [Decide Troubleshoot Loop](workflows/apply-fix-and-rerun.mdscript.md#decide-troubleshoot-loop)

## Capture Visual Proof

* if the reported issue is not user-visible UI, dashboard, or product-surface behavior
  * if the surface that `{{fix_scope}}` changed is also not user-visible UI, dashboard, or product-surface behavior
    * return to the caller
* set `{{candidate_command}}` to the command or navigation that shows the surface
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](workflows/choose-environment.mdscript.md#confirm-safe-target) before you touch a shared surface
* capture a current visual artifact of the behavior at `{{visual_proof_stage}}` from the real target surface into `{{artifact_dir}}`
* if the surface is shared
  * use `{{test_principal}}` for the capture
* exclude customer data, credentials, and private endpoints from the captured artifact
* record the path of the captured artifact in the file task
* return to the caller

## Start New Troubleshoot Pass

* record the completed pass in the file task with its `{{symptom}}`, `{{red_proof_path}}`, `{{green_proof_paths}}`, and outcome
* set `{{pass_number}}` to `{{pass_number}}` plus `1`
* if `{{pass_number}}` is greater than `5`
  * set `{{blocker}}` to `troubleshoot pass limit reached with failures still open`
  * [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* set `{{symptom}}` to `{{next_symptom}}`
* set `{{suspect_scope}}` to the scope of `{{next_symptom}}`
* [Initialize Pass State](#initialize-pass-state)

## Report Troubleshoot Outcome

* if `{{red_confirmed}}` is not `true`
  * set `{{blocker}}` to `no observed red reproduction for {{symptom}}`
  * [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* if `{{red_proof_path}}` is empty or `{{green_proof_paths}}` is empty
  * set `{{blocker}}` to the red or green proof artifact that is not there
  * [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* if `{{fidelity_gap}}` was never set
  * set `{{blocker}}` to `reproduction fidelity gap was never measured`
  * [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* run [Clean Up Reproduction State](#clean-up-reproduction-state)
* state `{{symptom}}`, `{{root_cause}}`, `{{fix_scope}}`, `{{pass_number}}`, and `{{troubleshoot_iteration}}` in the report
* state the redacted `{{repro_command}}`, `{{repro_test_path}}`, and `{{target_environment}}` of the red run and the green run
* link `{{red_proof_path}}` and each path in `{{green_proof_paths}}` as the evidence before and after the fix
* link `{{rca_mdscript}}` as the durable root-cause record
* name the `/mdscript-exec` re-entry of `{{rca_mdscript}}`
* if `{{fidelity_gap}}` is not `none`
  * state `{{fidelity_gap}}`
* if `{{fidelity_gap}}` is `none`
  * state that the reproduction ran against the reported surface with no gap
* claim only what the rerun proved
* state that a green reproduction proves this failure path on `{{target_environment}}` only
* do not claim release, deployment, or unrelated behavior from the green reproduction
* state each earlier pass that is not green as still open
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Update MDScript Artifact](../self-common/workflows/mdscript-artifact.mdscript.md#update-mdscript-artifact) with the outcome, the green proof, and `status` set to `resolved`
* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the red and green evidence and a link to `{{rca_mdscript}}`
* if `{{parent_reporting_path}}` is set
  * report this outcome to `{{parent_reporting_path}}` before you stop
* if a failure was deferred to a separate pass and is still not reproduced
  * name each deferred failure, and do not claim that it is fixed
* stop after this report

## Clean Up Reproduction State

* if `{{target_is_shared}}` is exactly `false`
  * return to the caller
* set `{{candidate_command}}` to the cleanup command
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](workflows/choose-environment.mdscript.md#confirm-safe-target) before you remove anything from a shared target
* remove or revert the test-tenant records, fixtures, queue entries, and files that this pass created on `{{target_environment}}`
* state which side effects were committed, which were rolled back, and which are unknown
* if this lane cannot revert a side effect
  * record it in the file task as a cleanup blocker that the owner of `{{target_environment}}` owns
* return to the caller

## Report Troubleshoot Blocker

* run [Clean Up Reproduction State](#clean-up-reproduction-state)
* redact credentials, tokens, connection strings, private endpoints, and customer data from the last command and its output
* do this redaction before you report the command or its output
* report `Blocked: {{blocker}}` with the redacted command and its redacted output
* state the step where this lane stopped: reproduction, root cause, fix, or rerun
* if `{{blocker}}` is set
  * do not report the issue as fixed
* if `{{rca_mdscript}}` is set
  * set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
  * run [Update MDScript Artifact](../self-common/workflows/mdscript-artifact.mdscript.md#update-mdscript-artifact) with the blocker and `status` set to `blocked`
* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the blocker and the redacted evidence that you collected
* if `{{parent_reporting_path}}` is set
  * report this blocker to `{{parent_reporting_path}}` before a prompt stops this lane
* if the blocker must have an answer from the user or an owner and no return script exists for it
  * run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this file and `{{return_resume_heading}}` set to `reproduce-with-red-test`
* stop after this report
