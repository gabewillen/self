<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Choose Reproduction Environment

* set `{{environment_candidates}}` to the available targets ordered by fidelity to where `{{symptom}}` was reported: the live or staging service, a local run of the same services against real dependencies, then a same-runtime local process
* set `{{target_environment}}` to the highest-fidelity candidate that is safe to run `{{symptom}}`'s failing path against
* name the services, versions, data source, and runtime path of `{{target_environment}}`
* use the real runtime path when `{{symptom}}` depends on a provider, adapter, release level, hosted architecture, or hardware path
* set `{{fidelity_gap}}` to the exact difference between `{{target_environment}}` and where `{{symptom}}` was reported, or to `none` when they match; never leave it unset
* set `{{target_is_shared}}` to `true` when `{{target_environment}}` is live, staging, multi-tenant, or otherwise shared with real users or other teams
* otherwise set `{{target_is_shared}}` to `false`
* if `{{fidelity_gap}}` names a component inside `{{suspect_scope}}`
  * [Raise Environment Fidelity](#raise-environment-fidelity)
* return to the caller

## Confirm Safe Target

* require the caller to have set `{{candidate_command}}` to the exact command it is about to run and `{{candidate_environment}}` to the environment it will run against
* if `{{candidate_command}}` is empty
  * set `{{blocker}}` to `safe-target check called without the command it must classify`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* if `{{candidate_environment}}` is empty
  * set `{{blocker}}` to `safe-target check called without the environment it must classify`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* classify `{{candidate_environment}}`, not a different environment, for the rest of this check
* if `{{candidate_environment}}` is not live, staging, multi-tenant, or otherwise shared with real users or other teams
  * [Release Safe Target Binding](#release-safe-target-binding)
* determine whether `{{candidate_command}}` only reads state on `{{candidate_environment}}`, or whether it writes, mutates, sends, charges, or deletes
* if `{{candidate_command}}` mutates shared state and no explicit grant covers that mutation on `{{candidate_environment}}`
  * set `{{blocker}}` to the missing mutation grant for `{{candidate_command}}` on `{{candidate_environment}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* [Confirm Shared Target Hygiene](#confirm-shared-target-hygiene)

## Confirm Shared Target Hygiene

* set `{{test_isolation_surface}}` to the dedicated test tenant, test account, or scoped test data set available on `{{candidate_environment}}`
* set `{{test_principal}}` to a test identity whose role and permissions match the reporter's
* if `{{test_isolation_surface}}` is empty or `{{test_principal}}` is empty
  * set `{{blocker}}` to the missing test-isolation surface on `{{target_environment}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* bind `{{candidate_command}}` to run as `{{test_principal}}` against `{{test_isolation_surface}}`, never against a real customer record
* require the calling state to run `{{candidate_command}}` itself, never an earlier unbound copy of the command
* never reuse a real user's credentials, session, or token
* if only a real user's identity reproduces `{{symptom}}`
  * set `{{blocker}}` to the identity boundary that blocks reproduction on `{{target_environment}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* record the cleanup needed for any state `{{candidate_command}}` creates on `{{candidate_environment}}`
* state which side effects a failed or cancelled run commits, rolls back, or leaves unknown
* [Release Safe Target Binding](#release-safe-target-binding)

## Release Safe Target Binding

* keep `{{candidate_command}}` and `{{candidate_environment}}` bound only for the single run the caller is about to perform
* clear `{{candidate_environment}}` after that run so no later state inherits this classification
* return to the caller

## Raise Environment Fidelity

* set `{{fidelity_attempts}}` to `{{fidelity_attempts}}` plus `1`
* if `{{fidelity_attempts}}` is greater than `2`
  * [Escalate Reproduction Gap](reproduce-red-test.md#escalate-reproduction-gap)
* set `{{candidate_command}}` to the command that stands up the real component named by `{{fidelity_gap}}`
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](#confirm-safe-target) before running `{{candidate_command}}` against `{{target_environment}}`
* stand up that real component — service, dependency, dataset, device, or provider path — instead of substituting it
* use provider sandbox credentials and de-identified data for any component that charges, sends messages, or writes to real customer records
* if only a real production provider path or a production data set can reproduce `{{symptom}}`
  * name the blast radius of that path
  * set `{{blocker}}` to the missing grant for that production path when no grant covers it
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* if the component named by `{{fidelity_gap}}` is now real
  * [Choose Reproduction Environment](#choose-reproduction-environment)
* [Escalate Reproduction Gap](reproduce-red-test.md#escalate-reproduction-gap)
