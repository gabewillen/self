---
name: self-troubleshoot
description: "ALWAYS use this skill when the user runs the /self-troubleshoot command. Also use it if the user reports a bug, regression, outage, flake, or broken behavior to diagnose. Reproduce the failure with a red test on the closest safe production-like surface. Find the root cause and fix the cause through self-implement. Then run the untouched reproduction again. Green ends the loop; red returns to root-cause analysis. Never fix a failure that this lane did not reproduce."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Troubleshoot Reported Issue

* hold each boundary in [boundaries.md](../self/references/boundaries.md)
* run [Ensure File Task](../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task)
* set `{{symptom}}`, `{{failing_surface}}`, `{{reported_evidence}}`, and `{{suspect_scope}}` from the request and the evidence
* if `{{symptom}}` is empty
  * ask what is wrong, where, and with what evidence, through [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `troubleshoot-reported-issue`
* if the request names more failures, take one
  * record each other failure in the file task as its own pass
* set `{{pass_number}}` to `1` if it is empty
* run [Start MDScript Running Log](../self-common/workflows/mdscript-artifact.mdscript.md#start-mdscript-running-log) with kind `rca`, subject `{{symptom}}`, and ordinal `{{pass_number}}`
* set `{{rca_mdscript}}` to the log path
* [Start Pass](#start-pass)

## Start Pass

* set `{{troubleshoot_iteration}}` to `1`, and `{{max_troubleshoot_iterations}}` to `3`
* set `{{repro_attempts}}`, `{{obstacle_attempts}}`, `{{fidelity_attempts}}`, `{{rca_attempts}}`, and `{{reassess_count}}` to `0`
* set `{{red_confirmed}}` to `false`, `{{green_proof_paths}}` to an empty list, and the reproduction and root-cause values to empty
* [Reproduce With Red Test](#reproduce-with-red-test)

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

* if neither the report nor `{{fix_scope}}` touches a visible surface, return to the caller
* run [Confirm Safe Target](workflows/choose-environment.mdscript.md#confirm-safe-target) for the command that shows the surface
* capture a current visual of `{{visual_proof_stage}}` from the real target into `{{artifact_dir}}`, as `{{test_principal}}` on a shared target
* keep customer data, credentials, and private endpoints out of it, and record its path in the file task
* return to the caller

## Start New Troubleshoot Pass

* record the finished pass with its symptom, red and green proof, and outcome in the file task
* add `1` to `{{pass_number}}`
  * if it is greater than `5`, set `{{blocker}}` to `troubleshoot pass limit reached with failures still open`, and [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* set `{{symptom}}` to `{{next_symptom}}`, and `{{suspect_scope}}` to its scope
* [Start Pass](#start-pass)

## Report Troubleshoot Outcome

* if `{{red_confirmed}}` is not `true`, a red or green proof is missing, or `{{fidelity_gap}}` was never set
  * set `{{blocker}}` to that gap, and [Report Troubleshoot Blocker](#report-troubleshoot-blocker)
* run [Clean Up Reproduction State](#clean-up-reproduction-state)
* report the symptom, root cause, fix scope, pass, and iteration
* report the redacted `{{repro_command}}`, `{{repro_test_path}}`, `{{target_environment}}`, and `{{fidelity_gap}}` (or that there was no gap)
* link `{{red_proof_path}}`, each green proof, and `{{rca_mdscript}}` with its re-entry
* claim only that this failure path is green on `{{target_environment}}`; not release, deployment, or other behavior
* name each earlier or deferred failure that is still open
* run [Update MDScript Artifact](../self-common/workflows/mdscript-artifact.mdscript.md#update-mdscript-artifact) on `{{rca_mdscript}}` with `status` set to `resolved`
* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the red and green evidence
* report to `{{parent_reporting_path}}` if it is set, and stop

## Clean Up Reproduction State

* if `{{target_is_shared}}` is exactly `false`, return to the caller
* run [Confirm Safe Target](workflows/choose-environment.mdscript.md#confirm-safe-target) for the cleanup command
* remove or revert the test-tenant records, fixtures, queue entries, and files that this pass created
* state which side effects were committed, rolled back, or unknown
* record each side effect that you cannot revert as a cleanup blocker for the owner of `{{target_environment}}`
* return to the caller

## Report Troubleshoot Blocker

* run [Clean Up Reproduction State](#clean-up-reproduction-state)
* redact credentials, tokens, connection strings, private endpoints, and customer data from the last command and its output
* report `Blocked: {{blocker}}` with that command and output, and the step where the lane stopped
* never report the issue as fixed
* if `{{rca_mdscript}}` is set, run [Update MDScript Artifact](../self-common/workflows/mdscript-artifact.mdscript.md#update-mdscript-artifact) on it with `status` set to `blocked`
* run [Add File Comment](../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the blocker and the redacted evidence
* report to `{{parent_reporting_path}}` if it is set
* if the blocker needs an answer, run [Prepare Prompt Return Script](../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `reproduce-with-red-test`
* stop
