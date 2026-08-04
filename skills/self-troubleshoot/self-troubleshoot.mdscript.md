---
artifact_type: self-troubleshoot
name: self-troubleshoot
description: "Routed MDScript for troubleshooting a reported failure: reproduce with a red test on the closest safe production-like surface, root-cause it, fix the cause, rerun the same reproduction, and loop until green. Not a skill. Enter via /self-troubleshoot or the self router."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Troubleshoot Reported Issue

* preserve every boundary in [boundaries.md](../self/references/boundaries.md) for the routed role that entered this workflow
* set `{{skills_root}}` to the installed skills root the router resolved, or to `~/.agents/skills` when it is empty
* run [Ensure File Task](../self-common/workflows/file-task-comments.md#ensure-file-task) to resolve `{{task_id}}`, `{{artifact_dir}}`, and `{{return_dir}}` before any later state records evidence
* infer `{{symptom}}`, `{{failing_surface}}`, `{{reported_evidence}}`, and `{{suspect_scope}}` from the request and current evidence
* set `{{pass_number}}` to `1` when it is empty
* set `{{artifact_kind}}` to `rca`
* set `{{artifact_slug}}` to `{{symptom}}`
* set `{{artifact_ordinal}}` to `{{pass_number}}`
* run [Start MDScript Running Log](../self-common/workflows/mdscript-artifact.md#start-mdscript-running-log)
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
  * set `{{symptom}}` to the single failure this pass will troubleshoot
  * record the remaining failures in the file task as separate troubleshoot passes
* [Reproduce With Red Test](#reproduce-with-red-test)

## Ask For Symptom

* set `{{pending_decision}}` to the observed wrong behavior, the surface it happens on, and the evidence the reporter holds
* if `{{parent_reporting_path}}` is set
  * report the paused state and the pending question to `{{parent_reporting_path}}` before the prompt stops this lane
* run [Prepare Prompt Return Script](../self-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this file and `{{return_resume_heading}}` set to `troubleshoot-reported-issue`

## Reproduce With Red Test

* run [Reproduce With Red Test](workflows/reproduce-red-test.md#reproduce-with-red-test)

## Analyze Root Cause

* run [Analyze Root Cause](workflows/root-cause-analysis.md#analyze-root-cause)

## Apply Root Cause Fix

* run [Apply Root Cause Fix](workflows/apply-fix-and-rerun.md#apply-root-cause-fix)

## Rerun Reproduction

* run [Rerun Reproduction](workflows/apply-fix-and-rerun.md#rerun-reproduction)

## Decide Troubleshoot Loop

* run [Decide Troubleshoot Loop](workflows/apply-fix-and-rerun.md#decide-troubleshoot-loop)

## Capture Visual Proof

* if neither the reported issue nor the surface changed by `{{fix_scope}}` is user-visible UI, dashboard, or product-surface behavior
  * return to the caller
* set `{{candidate_command}}` to the command or navigation that renders the surface
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](workflows/choose-environment.md#confirm-safe-target) before touching a shared surface
* capture a current visual artifact of the behavior at `{{visual_proof_stage}}` from the real target surface into `{{artifact_dir}}`, using `{{test_principal}}` when the surface is shared
* exclude customer data, credentials, and private endpoints from the captured artifact
* record the captured artifact path in the file task
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
  * set `{{blocker}}` to the missing red or green proof artifact
  * [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* if `{{fidelity_gap}}` was never set
  * set `{{blocker}}` to `reproduction fidelity gap was never measured`
  * [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* run [Clean Up Reproduction State](#clean-up-reproduction-state)
* state `{{symptom}}`, `{{root_cause}}`, `{{fix_scope}}`, `{{pass_number}}`, and `{{troubleshoot_iteration}}` in the report
* state the redacted `{{repro_command}}`, `{{repro_test_path}}`, and `{{target_environment}}` used for both the red and the green run
* link `{{red_proof_path}}` and every path in `{{green_proof_paths}}` as the before and after evidence
* link `{{rca_mdscript}}` as the durable root-cause record and name its `/mdscript-exec` re-entry
* state `{{fidelity_gap}}`, or state that the reproduction ran against the reported surface with no gap
* claim only what the rerun proved: a green reproduction proves this failure path on `{{target_environment}}`, not release, deployment, or unrelated behavior
* state every earlier pass that is not green as still open
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Update MDScript Artifact](../self-common/workflows/mdscript-artifact.md#update-mdscript-artifact) with the outcome, the green proof, and `status` set to `resolved`
* run [Add File Comment](../self-common/workflows/file-task-comments.md#add-file-comment) with the red and green evidence and a link to `{{rca_mdscript}}`
* if `{{parent_reporting_path}}` is set
  * report this outcome to `{{parent_reporting_path}}` before stopping
* if failures were deferred to separate passes and are still unreproduced
  * name each deferred failure without claiming it was fixed
* stop after this report

## Clean Up Reproduction State

* if `{{target_is_shared}}` is exactly `false`
  * return to the caller
* set `{{candidate_command}}` to the cleanup command
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](workflows/choose-environment.md#confirm-safe-target) before removing anything from a shared target
* remove or revert the test-tenant records, fixtures, queue entries, and files this pass created on `{{target_environment}}`
* state which side effects were committed, which were rolled back, and which are unknown
* if any side effect cannot be reverted by this lane
  * record it in the file task as a cleanup blocker owned by `{{target_environment}}`'s owner
* return to the caller

## Report Troubleshoot Blocker

* run [Clean Up Reproduction State](#clean-up-reproduction-state)
* redact credentials, tokens, connection strings, private endpoints, and customer data from the last command and its output before reporting them
* report `Blocked: {{blocker}}` with the redacted command and its redacted output
* state which of reproduction, root cause, fix, or rerun this lane stopped at
* do not report the issue as fixed while `{{blocker}}` is set
* if `{{rca_mdscript}}` is set
  * set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
  * run [Update MDScript Artifact](../self-common/workflows/mdscript-artifact.md#update-mdscript-artifact) with the blocker and `status` set to `blocked`
* run [Add File Comment](../self-common/workflows/file-task-comments.md#add-file-comment) with the blocker and the redacted evidence gathered so far
* if `{{parent_reporting_path}}` is set
  * report this blocker to `{{parent_reporting_path}}` before any prompt stops this lane
* if the blocker needs an answer from the user or an owner and no return script was written for it yet
  * run [Prepare Prompt Return Script](../self-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this file and `{{return_resume_heading}}` set to `reproduce-with-red-test`
* stop after this report
