<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Root Cause Fix

* if `{{red_confirmed}}` is not `true`
  * [Reproduce With Red Test](../self-troubleshoot.mdscript.md#reproduce-with-red-test)
* if `{{root_cause}}` is empty
  * [Analyze Root Cause](../self-troubleshoot.mdscript.md#analyze-root-cause)
* set `{{troubleshoot_pass_active}}` to `true` so the implement lane uses this pass's reproduction instead of starting another troubleshoot pass
* set `{{fix_contract}}` to `{{root_cause}}`, `{{fix_scope}}`, `{{repro_test_path}}`, the redacted `{{repro_command}}`, and `{{target_environment}}` as the DBC claim and proof path
* if this agent orchestrates and can delegate
  * [Delegate Fix To Implementer](#delegate-fix-to-implementer)
* [Run Fix In Process](#run-fix-in-process)

## Delegate Fix To Implementer

* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
* bind the implement contract fields the worker requires: `{{objective}}` to `{{root_cause}}`, `{{claim_scope}}` to `{{fix_scope}}`, `{{proof_path}}` to `{{repro_command}}`, `{{done_state}}` to a green rerun of `{{repro_command}}` on `{{target_environment}}`, plus `{{repository}}`, `{{branch}}`, `{{granted_permissions}}`, and `{{forbidden_actions}}`
* set `{{orchestrator_reporting_path}}` to this troubleshoot lane, not to `{{parent_reporting_path}}`
* delegate `{{fix_contract}}` to one implementer lane with `/mdscript-exec {{skills_root}}/self-implement/SKILL.md`
* state in the delegation that `{{repro_test_path}}` must not be edited, relaxed, skipped, retried, or deleted
* record the troubleshoot pass state in the file task before delegating, so a cold re-entry can restore it: `{{red_confirmed}}`, `{{repro_test_fingerprint}}`, `{{red_proof_path}}`, `{{green_proof_paths}}`, `{{pass_number}}`, `{{troubleshoot_iteration}}`, `{{task_id}}`, `{{target_environment}}`, and `{{target_is_shared}}`
* state in the delegation that `{{repro_command}}` is the handed-down reproduction and `{{red_confirmed}}` is `true`, so the implementer proves the fix with it instead of starting another troubleshoot pass
* state in the delegation that this lane continues at `/mdscript-exec {{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md#rerun-reproduction` when the implementer reports back
* own cleanup for the implementer lane or thread this state creates until it is closed, transferred, or recorded as a cleanup blocker
* [Apply Fix Constraints](#apply-fix-constraints)

## Run Fix In Process

* record `{{root_cause}}`, `{{fix_scope}}`, `{{repro_command}}`, `{{repro_test_path}}`, `{{repro_test_fingerprint}}`, `{{red_proof_path}}`, `{{red_confirmed}}`, `{{green_proof_paths}}`, `{{pass_number}}`, `{{troubleshoot_iteration}}`, `{{task_id}}`, `{{target_environment}}`, `{{target_is_shared}}`, `{{test_isolation_surface}}`, `{{test_principal}}`, `{{fidelity_gap}}`, and `{{parent_reporting_path}}` in the file task before the implement skill rebinds shared variables
* run `/mdscript-exec {{skills_root}}/self-implement/SKILL.md` on this process with `{{fix_contract}}`
* restore the troubleshoot values recorded above from the file task after the implement skill returns
* [Apply Fix Constraints](#apply-fix-constraints)

## Apply Fix Constraints

* keep the change inside `{{fix_scope}}` — fix the cause, not the place the symptom surfaced
* do not edit, relax, skip, retry, or delete the reproduction test to make it pass
* do not widen the fix into unrelated cleanup, refactors, or other failures found along the way
* if the fix requires a change outside `{{fix_scope}}` to be correct
  * set `{{fix_scope}}` to the corrected scope and state why it grew
* if `{{cause_owner}}` is not this repository and only a workaround is possible
  * mark the change as a workaround in the file task
  * record the upstream cause and follow-up risk on the owning tracker record
* [Rerun Reproduction](../self-troubleshoot.mdscript.md#rerun-reproduction)

## Rerun Reproduction

* restore the troubleshoot pass state recorded in the file task when any of `{{red_confirmed}}`, `{{repro_test_fingerprint}}`, or `{{repro_command}}` is empty
* set `{{current_test_fingerprint}}` to the content hash of `{{repro_test_path}}`
* if `{{current_test_fingerprint}}` is not `{{repro_test_fingerprint}}`
  * set `{{blocker}}` to `the reproduction test changed during the fix; the green run would not prove {{symptom}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* set `{{green_proof_path}}` to `{{artifact_dir}}/{{task_id}}-pass{{pass_number}}-rerun-{{troubleshoot_iteration}}.log`
* record `{{green_proof_path}}` in the file task with its iteration number
* set `{{candidate_command}}` to `{{repro_command}}`
* set `{{candidate_environment}}` to `{{target_environment}}`
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the fix applied and the rerun as the next step
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before running against `{{target_environment}}`
* run `{{candidate_command}}` against `{{target_environment}}` — the same `{{repro_command}}`, identity binding, and environment recorded in the reproduction contract
* write the command output to `{{green_proof_path}}` with credentials, tokens, connection strings, private endpoints, and customer data redacted in the same write
* set `{{rerun_result}}` to `passed` when `{{repro_command}}` passed, otherwise to the failure it reported
* if `{{rerun_result}}` is `passed`
  * append `{{green_proof_path}}` to `{{green_proof_paths}}`
* set `{{visual_proof_stage}}` to `rerun-{{troubleshoot_iteration}}`
* run [Capture Visual Proof](../self-troubleshoot.mdscript.md#capture-visual-proof)
* [Run Surrounding Suite](#run-surrounding-suite)

## Run Surrounding Suite

* set `{{suite_environment}}` to a named non-shared environment when `{{target_is_shared}}` is `true` and no grant covers a full suite run against it
* otherwise set `{{suite_environment}}` to `{{target_environment}}`
* set `{{candidate_command}}` to the surrounding-suite command for `{{fix_scope}}`
* set `{{candidate_environment}}` to `{{suite_environment}}`
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before running `{{candidate_command}}` against `{{candidate_environment}}`
* run `{{candidate_command}}` against `{{suite_environment}}`
* set `{{suite_result}}` to `passed` or to the regression the suite reported
* redact credentials, tokens, connection strings, private endpoints, and customer data from `{{suite_result}}` before recording it
* record `{{suite_result}}` and `{{suite_environment}}` in the file task
* [Decide Troubleshoot Loop](../self-troubleshoot.mdscript.md#decide-troubleshoot-loop)

## Decide Troubleshoot Loop

* if `{{red_confirmed}}` is not `true`
  * set `{{blocker}}` to `no observed red reproduction for {{symptom}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* if `{{rerun_result}}` is `passed` and `{{suite_result}}` is `passed`
  * [Report Troubleshoot Outcome](../self-troubleshoot.mdscript.md#report-troubleshoot-outcome)
* if `{{rerun_result}}` is `passed` and `{{suite_result}}` is a regression
  * set `{{next_symptom}}` to `{{suite_result}}`
  * [Start New Troubleshoot Pass](../self-troubleshoot.mdscript.md#start-new-troubleshoot-pass)
* record the failed attempt, its output, and the discarded hypothesis in the file task so the next iteration does not repeat it
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Update MDScript Artifact](../../self-common/workflows/mdscript-artifact.mdscript.md#update-mdscript-artifact) with the discarded hypothesis appended under `## Open Questions`
* set `{{troubleshoot_iteration}}` to `{{troubleshoot_iteration}}` plus `1`
* if `{{troubleshoot_iteration}}` is greater than `{{max_troubleshoot_iterations}}`
  * [Reassess Failing Loop](#reassess-failing-loop)
* set `{{root_cause}}` to empty
* [Analyze Root Cause](../self-troubleshoot.mdscript.md#analyze-root-cause)

## Reassess Failing Loop

* set `{{reassess_count}}` to `{{reassess_count}}` plus `1`
* if `{{reassess_count}}` is greater than `2`
  * set `{{blocker}}` to the unresolved failure with every hypothesis tried and its evidence
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* read `{{red_proof_path}}` and every path in `{{green_proof_paths}}`
* state whether the failure output changed between iterations
* if the output never changed
  * verify which build, container, deployment, or process `{{repro_command}}` actually exercised, because the fix may never have reached the executed path
* if the output changed each iteration
  * set `{{next_symptom}}` to the remaining failure
  * [Start New Troubleshoot Pass](../self-troubleshoot.mdscript.md#start-new-troubleshoot-pass)
* revert fix attempts that did not move the failure, so the tree carries only changes with evidence behind them
* set `{{new_hypothesis}}` to the evidence-backed hypothesis this reassessment produced, or to empty when it produced none
* if `{{new_hypothesis}}` is empty
  * set `{{blocker}}` to the unresolved failure with every hypothesis tried and its evidence
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* set `{{max_troubleshoot_iterations}}` to `{{max_troubleshoot_iterations}}` plus `2`
* set `{{root_cause}}` to empty
* [Analyze Root Cause](../self-troubleshoot.mdscript.md#analyze-root-cause)
