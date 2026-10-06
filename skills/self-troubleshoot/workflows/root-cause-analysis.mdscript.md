<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Analyze Root Cause

* if `{{red_confirmed}}` is not `true`
  * [Reproduce With Red Test](../self-troubleshoot.mdscript.md#reproduce-with-red-test)
* set `{{rca_attempts}}` to `{{rca_attempts}}` plus `1`
* if `{{rca_attempts}}` is greater than `4`
  * set `{{blocker}}` to the failure that root-cause analysis did not solve, with each traced path and its evidence
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* read the failure output in `{{red_proof_path}}`
* name the first place where the observed state is different from the expected state
* trace that difference backward through the real call path to the earliest point that is wrong
* include code, config, data, schema, and runtime boundaries in that trace
* set `{{candidate_environment}}` to `{{target_environment}}`
* set `{{candidate_command}}` to the command that collects direct evidence at that point
* use logs, instrumentation, a debugger, a probe, or `git bisect` in that command
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before you run `{{candidate_command}}` against `{{target_environment}}`
* run `{{candidate_command}}` and read its evidence
* set `{{root_cause}}` to the causal mechanism
* in `{{root_cause}}`, name the wrong input, wrong assumption, or wrong state that causes `{{symptom}}`, and where it starts
* if `{{root_cause}}` only states again where the error occurred
  * [Analyze Root Cause](#analyze-root-cause)
* [Separate Upstream From Local Cause](#separate-upstream-from-local-cause)

## Separate Upstream From Local Cause

* find whether `{{root_cause}}` is in this repository, a dependency, a provider or platform, data, or configuration
* set `{{cause_owner}}` to that owner surface
* if a downstream resolver, adapter, cache, dashboard, or review surface hides or changes the failure
  * name that masking layer separately from `{{root_cause}}`
* if `{{cause_owner}}` is not this repository
  * state whether a correct local fix is possible, or only a workaround
  * record the upstream cause and the follow-up risk in the owner tracker or the file task
  * do this record before you accept a workaround as the state
* [Verify Root Cause By Prediction](#verify-root-cause-by-prediction)

## Verify Root Cause By Prediction

* state one prediction that is true only when `{{root_cause}}` is correct
* in the prediction, name the input, config, or state that makes `{{symptom}}` occur or stop
* set `{{candidate_environment}}` to `{{target_environment}}`
* set `{{candidate_command}}` to the command that runs that prediction
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before you run `{{candidate_command}}` against `{{target_environment}}`
* run `{{candidate_command}}` against `{{target_environment}}`
* redact credentials, tokens, connection strings, private endpoints, and customer data from its output
* record the redacted output in the file task as root-cause evidence
* if the prediction was not true
  * set `{{root_cause}}` to empty
  * [Analyze Root Cause](#analyze-root-cause)
* set `{{fix_scope}}` to the smallest change that removes `{{root_cause}}`
* find each caller of the function that `{{fix_scope}}` changes
* put the fix in the shared function that all callers use, not a guard in each caller (`LOCAL-LEAN-001`)
* [Record Root Cause Analysis](#record-root-cause-analysis)

## Record Root Cause Analysis

* set `{{artifact_kind}}` to `rca`
* set `{{artifact_subject}}` to `{{symptom}}`
* set `{{artifact_ordinal}}` to `{{pass_number}}`
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* write these states into the artifact: `## Restore Troubleshoot Context`, `## Reproduce This Failure`, `## Root Cause`, `## Verify The Fix`, and `## Open Questions`
* under `## Restore Troubleshoot Context`, record `{{symptom}}`, `{{failing_surface}}`, `{{suspect_scope}}`, `{{target_environment}}`, and `{{fidelity_gap}}`
* under `## Reproduce This Failure`, record the redacted `{{repro_command}}`, `{{repro_test_path}}`, `{{repro_test_fingerprint}}`, and `{{red_proof_path}}`
* write them as the executable step that makes the test red again
* under `## Root Cause`, record the causal mechanism, `{{cause_owner}}`, the masking layer if one exists, and the prediction that proved it
* under `## Verify The Fix`, record `{{fix_scope}}` and the rerun step that decides green
* under `## Open Questions`, record each discarded hypothesis with its evidence, so that a later pass does not try it again
* set `{{artifact_re_entry}}` to `/mdscript-exec {{rca_mdscript}}#verify-the-fix`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the proved root cause, so that the append-only history stays complete
* [Apply Root Cause Fix](../self-troubleshoot.mdscript.md#apply-root-cause-fix)
