<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Analyze Root Cause

* if `{{red_confirmed}}` is not `true`, [Reproduce With Red Test](../SKILL.md#reproduce-with-red-test)
* add `1` to `{{rca_attempts}}`
* if it is greater than `4`, set `{{blocker}}` to the unsolved failure with each traced path
  * [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* read `{{red_proof_path}}`, and name the first place where the observed state differs from the expected state
* trace it backward through the real call path, code, config, data, schema, and runtime, to the earliest wrong point
* collect direct evidence there with logs, a probe, a debugger, or `git bisect`, after [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target)
* set `{{root_cause}}` to the wrong input, assumption, or state that causes `{{symptom}}`, and where it starts
  * if it only restates where the error showed, [Analyze Root Cause](#analyze-root-cause)
* set `{{cause_owner}}` to this repository, a dependency, a provider, data, or config
  * name a masking layer (resolver, adapter, cache, dashboard) apart from the cause
  * if another owner has the cause, say if only a workaround is possible
  * record the upstream cause on the owner's tracker first
* state a prediction that is true only if `{{root_cause}}` is right, and run it after [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target)
  * record its redacted output; if it fails, set `{{root_cause}}` to empty, and [Analyze Root Cause](#analyze-root-cause)
* set `{{fix_scope}}` to the smallest change that removes `{{root_cause}}`
  * find each caller, and fix the shared function that all callers use, not each caller (`LOCAL-LEAN-001`)
* write `## Restore Troubleshoot Context`, `## Reproduce This Failure`, `## Root Cause`, `## Verify The Fix`, and `## Open Questions` into `{{rca_mdscript}}`, with each discarded hypothesis under open questions
* set `{{artifact_re_entry}}` to `/mdscript-exec {{rca_mdscript}}#verify-the-fix`, and run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress)
* [Apply Root Cause Fix](../SKILL.md#apply-root-cause-fix)
