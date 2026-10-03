<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reproduce With Red Test

* read the code path that fails, `{{reported_evidence}}`, and the logs, traces, tickets, or CI output for `{{symptom}}`
* if `{{symptom}}` is behavior of software that runs
  * set `{{repro_kind}}` to `runtime`
* if `{{symptom}}` is a defect in a document, MDScript, config, schema, or other artifact that does not run
  * set `{{repro_kind}}` to `artifact-check`
* run [Choose Reproduction Environment](choose-environment.mdscript.md#choose-reproduction-environment)
* [Write Red Test](#write-red-test)

## Write Red Test

* do not write credentials, tokens, or connection strings into `{{repro_test_path}}`, `{{repro_command}}`, or `{{candidate_command}}`
* read these values from the environment or the secret store
* if a runner forces a secret inline
  * redact it before you record, report, or give the command to another lane
* if `{{repro_kind}}` is `artifact-check`
  * [Write Red Artifact Check](#write-red-artifact-check)
* write or extend a test for `{{symptom}}` through the real entry point that users use
* do not use an internal helper that skips the failure path
* set `{{repro_test_path}}` to the file that contains that test
* assert the exact reported wrong behavior: the wrong value, status, state, or visible output
* make the assertion exact, so that a different failure cannot pass as this failure
* do not stub, mock, fake, or monkeypatch a component inside `{{suspect_scope}}`
* set `{{repro_command}}` to the single command that runs this test
* [Run Red Test](#run-red-test)

## Write Red Artifact Check

* write an executable check that fails on the defect
* use a parser, validator, linter, link or anchor check, schema check, or diff against the expected artifact state
* set `{{repro_test_path}}` to the file that contains that check
* set `{{repro_command}}` to the single command that runs it
* [Run Red Test](#run-red-test)

## Run Red Test

* set `{{red_proof_path}}` to `{{artifact_dir}}/{{task_id}}-pass{{pass_number}}-red-{{repro_attempts}}.log`
* set `{{candidate_command}}` to `{{repro_command}}`
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before each run against `{{target_environment}}`
* run `{{candidate_command}}` against `{{target_environment}}`
* if the target is shared, `{{candidate_command}}` is `{{repro_command}}` bound to `{{test_principal}}` and `{{test_isolation_surface}}`
* write the command output to `{{red_proof_path}}`
* in the same write, redact credentials, tokens, connection strings, private endpoints, and customer data
* do not keep an unredacted log on disk at any time
* if the test passed
  * [Handle Non Reproducing Test](#handle-non-reproducing-test)
* if the test failed for a setup error, missing credential, import failure, or unrelated assertion
  * [Clear Reproduction Obstacle](#clear-reproduction-obstacle)
* if the test failed for a different reason that is not `{{symptom}}`
  * [Clear Reproduction Obstacle](#clear-reproduction-obstacle)
* set `{{red_confirmed}}` to `true`
* set `{{repro_test_fingerprint}}` to the content hash of `{{repro_test_path}}`
* set `{{visual_proof_stage}}` to `red`
* run [Capture Visual Proof](../self-troubleshoot.mdscript.md#capture-visual-proof)
* record these values in the file task as the reproduction contract:
  * the redacted `{{repro_command}}`, `{{repro_test_path}}`, and `{{repro_test_fingerprint}}`
  * `{{target_environment}}`, `{{fidelity_gap}}`, and `{{red_proof_path}}`
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with the red reproduction, and with root-cause analysis as the next step
* [Analyze Root Cause](../self-troubleshoot.mdscript.md#analyze-root-cause)

## Clear Reproduction Obstacle

* set `{{obstacle_attempts}}` to `{{obstacle_attempts}}` plus `1`
* if `{{obstacle_attempts}}` is greater than `3`
  * [Escalate Reproduction Gap](#escalate-reproduction-gap)
* if the obstacle is a credential, session, token, or access that this lane does not already have
  * [Escalate Reproduction Gap](#escalate-reproduction-gap)
* set `{{candidate_command}}` to the command that removes the obstacle
* set `{{candidate_environment}}` to `{{target_environment}}`
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) before you run `{{candidate_command}}` against `{{target_environment}}`
* fix the obstacle that blocked the run
* do not make the assertion on `{{symptom}}` weaker
* do not get new authority
* do not disable a check path
* record the redacted obstacle and its fix in the file task
* [Run Red Test](#run-red-test)

## Handle Non Reproducing Test

* use a test that passed as evidence that the reproduction is wrong, not as evidence that the issue is absent
* set `{{repro_attempts}}` to `{{repro_attempts}}` plus `1`
* set `{{repro_mismatch}}` to the closest difference between the test and the reported failure
* compare inputs, identity, config, data, timing, and concurrency
* redact credentials, tokens, identifiers, and customer data from `{{repro_mismatch}}`
* set `{{mdscript_artifact}}` to `{{rca_mdscript}}`
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) with this failed reproduction try and the redacted mismatch
* record the redacted `{{repro_mismatch}}` in the file task
* if `{{repro_attempts}}` is greater than `3`
  * [Escalate Reproduction Gap](#escalate-reproduction-gap)
* if `{{repro_mismatch}}` is environmental
  * run [Choose Reproduction Environment](choose-environment.mdscript.md#choose-reproduction-environment)
* align `{{repro_mismatch}}` in `{{repro_test_path}}`, and do not assert anything weaker than `{{symptom}}`
* [Run Red Test](#run-red-test)

## Escalate Reproduction Gap

* do not go to a fix for a failure that is not reproduced
* state what you tried: environments, inputs, and commands, with their actual output
* redact credentials, tokens, connection strings, private endpoints, and customer data from these commands, inputs, and output
* do this redaction before you record or report any of it
* set `{{blocker}}` to the exact missing item: environment access, credential access, data set, device, traffic pattern, or reporter detail
* set `{{pending_decision}}` to a question about how to get access to `{{blocker}}`, never the secret value
* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment) with the blocker and the redacted evidence that you collected
* if `{{parent_reporting_path}}` is set
  * report the paused state and the open access request to `{{parent_reporting_path}}` before the prompt stops this lane
* run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_source_workflow}}` set to this file and `{{return_resume_heading}}` set to `reproduce-with-red-test`
