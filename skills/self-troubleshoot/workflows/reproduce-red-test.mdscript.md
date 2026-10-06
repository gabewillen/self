<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reproduce With Red Test

* read the failing code path, `{{reported_evidence}}`, and the logs, traces, tickets, or CI output
* run [Choose Reproduction Environment](choose-environment.mdscript.md#choose-reproduction-environment)
* keep credentials out of the test and the command; read them from the environment or the secret store
* if `{{symptom}}` is a defect in a document, MDScript, config, or schema
  * write an executable check that fails on it: a parser, validator, linter, link check, schema check, or diff
* otherwise write or extend a test through the real entry point that users use
  * assert the exact reported wrong value, status, state, or output, so that no other failure can pass as it
  * do not stub, mock, fake, or patch anything inside `{{suspect_scope}}`
* set `{{repro_test_path}}` to its file, and `{{repro_command}}` to the one command that runs it
* [Run Red Test](#run-red-test)

## Run Red Test

* set `{{red_proof_path}}` to `{{artifact_dir}}/{{task_id}}-pass{{pass_number}}-red-{{repro_attempts}}.log`
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) with `{{repro_command}}` on `{{target_environment}}`
* run it, and write its redacted output to `{{red_proof_path}}`; never keep an unredacted log
* if it passed, [Handle Non Reproducing Test](#handle-non-reproducing-test)
* if it failed for setup, credentials, imports, or a reason other than `{{symptom}}`, [Clear Reproduction Obstacle](#clear-reproduction-obstacle)
* set `{{red_confirmed}}` to `true`, and `{{repro_test_fingerprint}}` to the content hash of `{{repro_test_path}}`
* set `{{visual_proof_stage}}` to `red`, and run [Capture Visual Proof](../SKILL.md#capture-visual-proof)
* record the redacted command, test path, fingerprint, environment, fidelity gap, and red proof in the file task
* run [Log Progress](../../self-common/workflows/mdscript-artifact.mdscript.md#log-progress) on `{{rca_mdscript}}`
* [Analyze Root Cause](../SKILL.md#analyze-root-cause)

## Clear Reproduction Obstacle

* add `1` to `{{obstacle_attempts}}`
* if it is greater than `3`, or the obstacle is access that this lane does not have, [Escalate Reproduction Gap](#escalate-reproduction-gap)
* run [Confirm Safe Target](choose-environment.mdscript.md#confirm-safe-target) for the command that removes the obstacle, and fix it
* never weaken the assertion, gain authority, or disable a check
* record the redacted obstacle and fix, then [Run Red Test](#run-red-test)

## Handle Non Reproducing Test

* a passing test means the reproduction is wrong, not that the issue is absent
* add `1` to `{{repro_attempts}}`
* set `{{repro_mismatch}}` to the closest redacted difference in inputs, identity, config, data, timing, or concurrency, and log it
* if `{{repro_attempts}}` is greater than `3`, [Escalate Reproduction Gap](#escalate-reproduction-gap)
* if the mismatch is environmental, run [Choose Reproduction Environment](choose-environment.mdscript.md#choose-reproduction-environment)
* align the test without asserting anything weaker, then [Run Red Test](#run-red-test)

## Escalate Reproduction Gap

* never fix a failure that is not reproduced
* set `{{blocker}}` to the exact missing access, credential, data set, device, traffic pattern, or reporter detail
* record what you tried, with redacted commands and output, in a file comment
* report the paused state to `{{parent_reporting_path}}` if it is set
* ask how to get the access, never for a secret value, through [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script) with `{{return_resume_heading}}` set to `reproduce-with-red-test`
