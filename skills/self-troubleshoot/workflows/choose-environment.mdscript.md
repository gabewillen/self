<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Choose Reproduction Environment

* set `{{environment_candidates}}` to the available targets, in order of fidelity to the place where `{{symptom}}` was reported
* use this order:
  * the live or staging service
  * a local run of the same services against real dependencies
  * a local process with the same runtime
* set `{{target_environment}}` to the candidate with the highest fidelity that is safe for the failure path of `{{symptom}}`
* name the services, versions, data source, and runtime path of `{{target_environment}}`
* if `{{symptom}}` depends on a provider, adapter, release level, hosted architecture, or hardware path
  * use the real runtime path
* set `{{fidelity_gap}}` to the exact difference between `{{target_environment}}` and the place where `{{symptom}}` was reported
* if `{{target_environment}}` and that place are the same
  * set `{{fidelity_gap}}` to `none`
* never leave `{{fidelity_gap}}` unset
* if `{{target_environment}}` is live, staging, multi-tenant, or shared with real users or other teams
  * set `{{target_is_shared}}` to `true`
* if `{{target_environment}}` is not live, staging, multi-tenant, or shared with real users or other teams
  * set `{{target_is_shared}}` to `false`
* if `{{fidelity_gap}}` names a component inside `{{suspect_scope}}`
  * [Raise Environment Fidelity](#raise-environment-fidelity)
* return to the caller

## Confirm Safe Target

* the caller must set `{{candidate_command}}` to the exact command that it will run next
* the caller must set `{{candidate_environment}}` to the environment that the command will run against
* if `{{candidate_command}}` is empty
  * set `{{blocker}}` to `safe-target check called without the command it must classify`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* if `{{candidate_environment}}` is empty
  * set `{{blocker}}` to `safe-target check called without the environment it must classify`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* classify `{{candidate_environment}}`, not a different environment, for the other steps of this check
* if `{{candidate_environment}}` is not live, staging, multi-tenant, or shared with real users or other teams
  * [Release Safe Target Binding](#release-safe-target-binding)
* find whether `{{candidate_command}}` only reads state on `{{candidate_environment}}`
* find whether `{{candidate_command}}` writes, mutates, sends, charges, or deletes
* if `{{candidate_command}}` mutates shared state and no explicit grant permits that mutation on `{{candidate_environment}}`
  * set `{{blocker}}` to the missing mutation grant for `{{candidate_command}}` on `{{candidate_environment}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* [Confirm Shared Target Hygiene](#confirm-shared-target-hygiene)

## Confirm Shared Target Hygiene

* set `{{test_isolation_surface}}` to the dedicated test tenant, test account, or scoped test data set on `{{candidate_environment}}`
* set `{{test_principal}}` to a test identity with the same role and permissions as the reporter
* if `{{test_isolation_surface}}` is empty or `{{test_principal}}` is empty
  * set `{{blocker}}` to the missing test-isolation surface on `{{target_environment}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* bind `{{candidate_command}}` to run as `{{test_principal}}` against `{{test_isolation_surface}}`
* never run `{{candidate_command}}` against a real customer record
* the state that calls this check must run `{{candidate_command}}` itself, never an earlier unbound copy of the command
* never use the credentials, session, or token of a real user
* if only the identity of a real user reproduces `{{symptom}}`
  * set `{{blocker}}` to the identity boundary that blocks reproduction on `{{target_environment}}`
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* record the cleanup that is necessary for each state that `{{candidate_command}}` creates on `{{candidate_environment}}`
* state which side effects a failed or cancelled run commits, rolls back, or leaves unknown
* [Release Safe Target Binding](#release-safe-target-binding)

## Release Safe Target Binding

* keep `{{candidate_command}}` and `{{candidate_environment}}` bound only for the single run that the caller does next
* after that run, clear `{{candidate_environment}}` so that no later state gets this classification
* return to the caller

## Raise Environment Fidelity

* set `{{fidelity_attempts}}` to `{{fidelity_attempts}}` plus `1`
* if `{{fidelity_attempts}}` is greater than `2`
  * [Escalate Reproduction Gap](reproduce-red-test.mdscript.md#escalate-reproduction-gap)
* set `{{candidate_command}}` to the command that starts the real component that `{{fidelity_gap}}` names
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](#confirm-safe-target) before you run `{{candidate_command}}` against `{{target_environment}}`
* start that real component, and do not use a substitute
* the real component can be a service, dependency, dataset, device, or provider path
* if a component charges, sends messages, or writes to real customer records
  * use provider sandbox credentials and de-identified data for that component
* if only a real production provider path or a production data set can reproduce `{{symptom}}`
  * name the blast radius of that path
  * if no grant permits that production path
    * set `{{blocker}}` to the missing grant for that production path
  * [Report Troubleshoot Blocker](../self-troubleshoot.mdscript.md#report-troubleshoot-blocker)
* if the component that `{{fidelity_gap}}` names is now real
  * [Choose Reproduction Environment](#choose-reproduction-environment)
* [Escalate Reproduction Gap](reproduce-red-test.mdscript.md#escalate-reproduction-gap)
