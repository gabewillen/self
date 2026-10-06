<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Choose Reproduction Environment

* set `{{target_environment}}` to the safe target closest to where `{{symptom}}` was reported, in this order:
  * the live or staging service
  * a local run of the same services against real dependencies
  * a local process with the same runtime
* use the real runtime path for a provider, adapter, release, hosted architecture, or hardware dependency
* name its services, versions, data source, and runtime path
* set `{{fidelity_gap}}` to the exact difference from the reported place, or `none`; never leave it unset
* set `{{target_is_shared}}` to `true` if the target is live, staging, multi-tenant, or shared with users or other teams, else `false`
* if `{{fidelity_gap}}` names a component in `{{suspect_scope}}`, [Raise Environment Fidelity](#raise-environment-fidelity)
* return to the caller

## Confirm Safe Target

* use this state before each command against a target
* the caller sets `{{candidate_command}}` and `{{candidate_environment}}`
  * if either is empty, set `{{blocker}}` to it, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* if the environment is not shared, return to the caller
* if the command writes, mutates, sends, charges, or deletes, and no explicit grant allows that there
  * set `{{blocker}}` to the missing mutation grant, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* set `{{test_isolation_surface}}` to a test tenant, test account, or scoped data set
* set `{{test_principal}}` to a test identity with the reporter's role
  * if either is missing, set `{{blocker}}` to it, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* run the command as `{{test_principal}}` against `{{test_isolation_surface}}`
  * never against a real customer record, and never with a real user's credentials
  * if only a real user's identity reproduces it, set `{{blocker}}` to that boundary, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* record the cleanup for each state the command creates, and which side effects a failed run leaves
* keep this binding for the next run only, then clear `{{candidate_environment}}`
* return to the caller

## Raise Environment Fidelity

* add `1` to `{{fidelity_attempts}}`; if it is greater than `2`, run [Escalate Reproduction Gap](reproduce-red-test.mdscript.md#escalate-reproduction-gap)
* run [Confirm Safe Target](#confirm-safe-target) for the command that starts the real component that `{{fidelity_gap}}` names
* start the real service, dependency, dataset, device, or provider path, not a substitute
  * use sandbox credentials and de-identified data for a component that charges, sends, or writes customer records
* if only a production path or data set reproduces it and no grant allows it
  * name the blast radius, set `{{blocker}}` to the missing grant, and [Report Troubleshoot Blocker](../SKILL.md#report-troubleshoot-blocker)
* if the component is now real, [Choose Reproduction Environment](#choose-reproduction-environment)
* run [Escalate Reproduction Gap](reproduce-red-test.mdscript.md#escalate-reproduction-gap)
