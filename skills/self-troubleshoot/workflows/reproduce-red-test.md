<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reproduce With Red Test

* read the failing code path, `{{reported_evidence}}`, and any logs, traces, tickets, or CI output for `{{symptom}}`
* set `{{repro_kind}}` to `runtime` when `{{symptom}}` is behavior of running software
* set `{{repro_kind}}` to `artifact-check` when `{{symptom}}` is a defect in a document, MDScript, config, schema, or other non-running artifact
* run [Choose Reproduction Environment](choose-environment.md#choose-reproduction-environment)
* [Write Red Test](#write-red-test)

## Write Red Test

* do not write credentials, tokens, or connection strings into `{{repro_test_path}}`, `{{repro_command}}`, or `{{candidate_command}}`; read them from the environment or the secret store, and redact any that a runner forces inline before the command is recorded, reported, or handed to another lane
* if `{{repro_kind}}` is `artifact-check`
  * [Write Red Artifact Check](#write-red-artifact-check)
* write or extend a test that exercises `{{symptom}}` through the real entry point users hit, not through an internal helper that skips the failing path
* set `{{repro_test_path}}` to the file holding that test
* assert the exact reported wrong behavior — the wrong value, status, state, or visible output — so a different failure cannot pass for this one
* do not stub, mock, fake, or monkeypatch any component inside `{{suspect_scope}}`
* set `{{repro_command}}` to the single command that runs this test
* [Run Red Test](#run-red-test)

## Write Red Artifact Check

* write an executable check that fails on the defect, using a parser, validator, linter, link or anchor check, schema check, or diff against the expected artifact state
* set `{{repro_test_path}}` to the file holding that check
* set `{{repro_command}}` to the single command that runs it
* [Run Red Test](#run-red-test)

## Run Red Test

* set `{{red_proof_path}}` to `{{artifact_dir}}/{{task_id}}-pass{{pass_number}}-red-{{repro_attempts}}.log`
* set `{{candidate_command}}` to `{{repro_command}}`
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](choose-environment.md#confirm-safe-target) before any run against `{{target_environment}}`
* run `{{candidate_command}}` against `{{target_environment}}`, which is `{{repro_command}}` bound to `{{test_principal}}` and `{{test_isolation_surface}}` when the target is shared
* write the command output to `{{red_proof_path}}` with credentials, tokens, connection strings, private endpoints, and customer data redacted in the same write, so an unredacted log is never durable
* if the test passed
  * [Handle Non Reproducing Test](#handle-non-reproducing-test)
* if the test failed for a different reason than `{{symptom}}` — setup error, missing credential, import failure, unrelated assertion
  * [Clear Reproduction Obstacle](#clear-reproduction-obstacle)
* set `{{red_confirmed}}` to `true`
* set `{{repro_test_fingerprint}}` to the content hash of `{{repro_test_path}}`
* set `{{visual_proof_stage}}` to `red`
* run [Capture Visual Proof](../self-troubleshoot.mdscript.md#capture-visual-proof)
* record the redacted `{{repro_command}}`, `{{repro_test_path}}`, `{{repro_test_fingerprint}}`, `{{target_environment}}`, `{{fidelity_gap}}`, and `{{red_proof_path}}` in the file task as the reproduction contract
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.md#log-progress) with the confirmed reproduction and root-cause analysis as the next step
* [Analyze Root Cause](../self-troubleshoot.mdscript.md#analyze-root-cause)

## Clear Reproduction Obstacle

* set `{{obstacle_attempts}}` to `{{obstacle_attempts}}` plus `1`
* if `{{obstacle_attempts}}` is greater than `3`
  * [Escalate Reproduction Gap](#escalate-reproduction-gap)
* if the obstacle is a credential, session, token, or access this lane does not already hold
  * [Escalate Reproduction Gap](#escalate-reproduction-gap)
* set `{{candidate_command}}` to the command that clears the obstacle
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](choose-environment.md#confirm-safe-target) before running `{{candidate_command}}` against `{{target_environment}}`
* fix the obstacle that blocked the run without weakening the assertion on `{{symptom}}`, without acquiring new authority, and without disabling a verification path
* record the redacted obstacle and its fix in the file task
* [Run Red Test](#run-red-test)

## Handle Non Reproducing Test

* treat a passing test as evidence the reproduction is wrong, not as evidence the issue is absent
* set `{{repro_attempts}}` to `{{repro_attempts}}` plus `1`
* set `{{repro_mismatch}}` to the closest difference between the test and the reported failure across inputs, identity, config, data, timing, and concurrency
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.md#log-progress) with this failed reproduction attempt
* redact credentials, tokens, identifiers, and customer data from `{{repro_mismatch}}`
* record the redacted `{{repro_mismatch}}` in the file task
* if `{{repro_attempts}}` is greater than `3`
  * [Escalate Reproduction Gap](#escalate-reproduction-gap)
* if `{{repro_mismatch}}` is environmental
  * run [Choose Reproduction Environment](choose-environment.md#choose-reproduction-environment)
* align `{{repro_mismatch}}` in `{{repro_test_path}}` without asserting anything weaker than `{{symptom}}`
* [Run Red Test](#run-red-test)

## Escalate Reproduction Gap

* do not skip ahead to a fix on an unreproduced failure
* state what was tried: environments, inputs, and commands, with their actual output
* redact credentials, tokens, connection strings, private endpoints, and customer data from those commands, inputs, and their output before any of it is recorded or reported
* set `{{blocker}}` to the exact missing piece: environment access, credential access, data set, device, traffic pattern, or reporter detail
* set `{{pending_decision}}` to how to obtain access to `{{blocker}}`, never the secret value itself
* run [Add File Comment](../../self-common/workflows/file-task-comments.md#add-file-comment) with the blocker and the redacted evidence gathered so far
* if `{{parent_reporting_path}}` is set
  * report the paused state and the pending access request to `{{parent_reporting_path}}` before the prompt stops this lane
* run [Prepare Prompt Return Script](../../self-common/workflows/return-script.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this file and `{{return_resume_heading}}` set to `reproduce-with-red-test`
