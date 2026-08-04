<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Analyze Root Cause

* if `{{red_confirmed}}` is not `true`
  * [Reproduce With Red Test](../self-troubleshoot.mdscript.md#reproduce-with-red-test)
* set `{{rca_attempts}}` to `{{rca_attempts}}` plus `1`
* if `{{rca_attempts}}` is greater than `4`
  * set `{{blocker}}` to the failure that resisted root-cause analysis, with every traced path and its evidence
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* read the failure output in `{{red_proof_path}}`
* name the first place the observed state diverges from the expected state
* trace that divergence backward through the real call path — code, config, data, schema, and runtime boundaries — to the earliest point that is wrong
* set `{{candidate_environment}}` to `{{target_environment}}`
* set `{{candidate_command}}` to the command that gathers direct evidence at that point with logs, instrumentation, a debugger, a probe, or `git bisect`
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before running `{{candidate_command}}` against `{{target_environment}}`
* run `{{candidate_command}}` and read its evidence
* set `{{root_cause}}` to the causal mechanism: what wrong input, wrong assumption, or wrong state produces `{{symptom}}`, and where it originates
* if `{{root_cause}}` only restates where the error surfaced
  * [Analyze Root Cause](#analyze-root-cause)
* [Separate Upstream From Local Cause](#separate-upstream-from-local-cause)

## Separate Upstream From Local Cause

* decide whether `{{root_cause}}` lives in this repository, in a dependency, in a provider or platform, in data, or in configuration
* set `{{cause_owner}}` to that owning surface
* if the failure is masked or transformed by a downstream resolver, adapter, cache, dashboard, or review surface
  * name that masking layer separately from `{{root_cause}}`
* if `{{cause_owner}}` is not this repository
  * state whether a correct local fix is possible, or whether only a workaround is
  * record the upstream cause and the follow-up risk in the owning tracker or file task before treating a workaround as accepted state
* [Verify Root Cause By Prediction](#verify-root-cause-by-prediction)

## Verify Root Cause By Prediction

* state one prediction that holds only when `{{root_cause}}` is correct, naming the input, config, or state that makes `{{symptom}}` appear or disappear
* set `{{candidate_environment}}` to `{{target_environment}}`
* set `{{candidate_command}}` to the command that runs that prediction
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before running `{{candidate_command}}` against `{{target_environment}}`
* run `{{candidate_command}}` against `{{target_environment}}`
* redact credentials, tokens, connection strings, private endpoints, and customer data from its output
* record the redacted output in the file task as root-cause evidence
* if the prediction did not hold
  * set `{{root_cause}}` to empty
  * [Analyze Root Cause](#analyze-root-cause)
* set `{{fix_scope}}` to the narrowest change that removes `{{root_cause}}`
* [Record Root Cause Analysis](#record-root-cause-analysis)

## Record Root Cause Analysis

* set `{{artifact_kind}}` to `rca`
* set `{{artifact_slug}}` to a slug of `{{symptom}}`
* set `{{artifact_ordinal}}` to `{{pass_number}}`
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* write these states into the artifact: `## Restore Troubleshoot Context`, `## Reproduce This Failure`, `## Root Cause`, `## Verify The Fix`, and `## Open Questions`
* record under `## Restore Troubleshoot Context` the `{{symptom}}`, `{{failing_surface}}`, `{{suspect_scope}}`, `{{target_environment}}`, and `{{fidelity_gap}}`
* record under `## Reproduce This Failure` the redacted `{{repro_command}}`, `{{repro_test_path}}`, `{{repro_test_fingerprint}}`, and `{{red_proof_path}}` as the executable step to re-establish red
* record under `## Root Cause` the causal mechanism, `{{cause_owner}}`, the masking layer when one exists, and the prediction that confirmed it
* record under `## Verify The Fix` the `{{fix_scope}}` and the rerun step that decides green
* record under `## Open Questions` every discarded hypothesis with its evidence, so a later pass does not repeat it
* set `{{artifact_re_entry}}` to `/mdscript-exec {{rca_mdscript}}#verify-the-fix`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the confirmed root cause, so the append-only history is kept
* [Apply Root Cause Fix](../self-troubleshoot.mdscript.md#apply-root-cause-fix)
