<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage

* if `{{repo_root}}` is not set, set `{{return_resume_heading}}` to `triage`
* if `{{repo_root}}` is not set, run [Prepare Prompt Return Script](../../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
* if `{{repo_root}}` is not set, write `{{return_script}}` as executable MDScript with the exact header and a `## Resume` entrypoint
* if `{{repo_root}}` is not set, ask for the absolute path of a repository that exists
* if `{{repo_root}}` is not set, end the prompt with `{{return_resume_command}}`
* if `{{repo_root}}` is not set, stop until the user answers
* resolve `{{repo_root}}` to an absolute path that exists
* expand `{{review_scope}}` into concrete paths under `{{repo_root}}`
* set `{{run_id}}` to a new timestamp id
* run [Resolve Agent Home](../../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{out_dir}}` to `{{project_home}}/hsm-review/{{run_id}}`
* create `{{out_dir}}`
* set `{{findings_log}}` to `{{out_dir}}/findings.jsonl`
* set `{{findings}}` to an empty list

## Find machines

* search the scope for state machine definitions by structure, not by library name
  * identify a definition by its vertices, and by transitions that have triggers, guards, or targets
* for each definition, record the path, the model name, and the builder or helper functions that it uses
* if you find no definitions
  * set `{{machine_inventory}}` to an empty list
  * continue
* write `{{out_dir}}/machines.json`
* set `{{machine_inventory}}` from `{{out_dir}}/machines.json`

## Resolve dialect and overlays

* set `{{dialect}}` to the state machine library that the code imports, with its **pinned version**
  * get the pinned version from the lockfile or module list, not from memory and not from the newest release
* if no known library is present, set `{{dialect}}` to `generic`
  * do not block on this
* set `{{policy_files}}` to the state machine rule or policy files in the scope or the repo root
* set `{{overlay_rules}}` from those files, and keep their native rule ids
* for each overlay rule, map it to a core rule id if one exists
* record each unmapped overlay rule as a coverage gap in `{{out_dir}}/rule-packs.json`
* allow an overlay to add a rule or raise a severity
* do not let an overlay weaken or lower a rule
* set `{{enforced_patterns}}` from the edit-time or pre-commit checks that the repo runs
  * do not report these rules again as findings

## Load rules

* load [hsm-core-rules.md](../references/hsm-core-rules.md) as the only primary rule set
* load [check-patterns.md](../references/check-patterns.md) for scans
* write `{{out_dir}}/scope.json` with repo_root, review_scope, dialect, dialect_version, policy_files, overlay coverage gaps, and enforced_patterns
* return to the caller
