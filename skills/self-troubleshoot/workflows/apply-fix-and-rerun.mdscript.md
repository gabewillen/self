<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Root Cause Fix

* if `{{red_confirmed}}` is not `true`, [Reproduce With Red Test](../SKILL.md#reproduce-with-red-test)
* if `{{root_cause}}` is empty, [Analyze Root Cause](../SKILL.md#analyze-root-cause)
* set `{{troubleshoot_pass_active}}` to `true`, so that implement uses this reproduction and starts no new pass
* record these in the file task:
  * the root cause, the fix scope, the redacted command, the test path, and the fingerprint
  * the proofs, the pass, the iteration, the environment, and the reporting path
* bind the implement contract: objective `{{root_cause}}`, claim scope `{{fix_scope}}`, proof path `{{repro_command}}`, done state a green rerun on `{{target_environment}}`
* if this agent orchestrates and can delegate, and `{{execution_mode}}` is not `direct`
  * run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `implementer`
  * delegate to one implementer lane with `/mdscript-exec {{skills_root}}/self-implement/SKILL.md`, reporting to this lane
  * tell it that `{{red_confirmed}}` is `true`, that it must not touch `{{repro_test_path}}`, and that this lane resumes at `/mdscript-exec {{skills_root}}/self-troubleshoot/SKILL.md#rerun-reproduction`
  * own the cleanup of that lane
* otherwise run `/mdscript-exec {{skills_root}}/self-implement/SKILL.md` in this process, then restore the troubleshoot values from the file task
* the fix stays inside `{{fix_scope}}`, fixes the cause, and never edits, relaxes, skips, retries, or deletes the reproduction test
  * if a correct fix needs a wider scope, widen `{{fix_scope}}`, and say why
  * if `{{cause_owner}}` is another owner and only a workaround fits, mark it as a workaround, and record the upstream risk
* [Rerun Reproduction](../SKILL.md#rerun-reproduction)

## Rerun Reproduction

* if the reproduction values are empty, restore them from the file task
* if the content hash of `{{repro_test_path}}` is not `{{repro_test_fingerprint}}`
  * set `{{blocker}}` to `the reproduction test changed during the fix; the green run would not prove {{symptom}}`
  * [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* set `{{green_proof_path}}` to `{{artifact_dir}}/{{task_id}}-pass{{pass_number}}-rerun-{{troubleshoot_iteration}}.log`
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) with `{{repro_command}}` on `{{target_environment}}`
* run the same command, identity, and environment as the red run, and write its redacted output to `{{green_proof_path}}`
* set `{{rerun_result}}` to `passed`, or the failure; if passed, add `{{green_proof_path}}` to `{{green_proof_paths}}`
* set `{{visual_proof_stage}}` to `rerun-{{troubleshoot_iteration}}`, and run [Capture Visual Proof](../SKILL.md#capture-visual-proof)
* set `{{suite_environment}}` to `{{target_environment}}`, or a non-shared environment if no grant allows a full suite on a shared one
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target), then the surrounding suite for `{{fix_scope}}` there
* set `{{suite_result}}` to `passed`, or the redacted regression, and record it
* [Decide Troubleshoot Loop](../SKILL.md#decide-troubleshoot-loop)

## Decide Troubleshoot Loop

* if `{{red_confirmed}}` is not `true`, set `{{blocker}}` to `no observed red reproduction for {{symptom}}`, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* if the rerun and the suite passed, [Report Troubleshoot Outcome](../SKILL.md#report-troubleshoot-outcome)
* if the rerun passed and the suite found a regression, set `{{next_symptom}}` to it, and [Start New Troubleshoot Pass](../SKILL.md#start-new-troubleshoot-pass)
* record the failed try and the discarded hypothesis under `## Open Questions` of `{{rca_mdscript}}`
* add `1` to `{{troubleshoot_iteration}}`
* if it is greater than `{{max_troubleshoot_iterations}}`, [Reassess Failing Loop](#reassess-failing-loop)
* set `{{root_cause}}` to empty, and [Analyze Root Cause](../SKILL.md#analyze-root-cause)

## Reassess Failing Loop

* add `1` to `{{reassess_count}}`
* if it is greater than `2`, set `{{blocker}}` to the failure with each hypothesis and its evidence
  * [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* compare `{{red_proof_path}}` and each green proof
* if the output never changed, find which build, container, or process actually ran, and whether the fix reached it
* if the output changed each time, set `{{next_symptom}}` to the failure that stays, and [Start New Troubleshoot Pass](../SKILL.md#start-new-troubleshoot-pass)
* revert each try that did not change the failure, and keep only changes with evidence
* if this reassessment found no new hypothesis with evidence, set `{{blocker}}` to the failure with each hypothesis, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* add `2` to `{{max_troubleshoot_iterations}}`, set `{{root_cause}}` to empty, and [Analyze Root Cause](../SKILL.md#analyze-root-cause)
