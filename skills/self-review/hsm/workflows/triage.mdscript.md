<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Triage

* if `{{repo_root}}` is missing, set `{{return_resume_heading}}` to `triage`
* if `{{repo_root}}` is missing, run [Prepare Prompt Return Script](../../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
* if `{{repo_root}}` is missing, write `{{return_script}}` as executable MDScript with the exact header and a `## Resume` entrypoint
* if `{{repo_root}}` is missing, prompt for the existing absolute repository path and end with `{{return_resume_command}}`
* if `{{repo_root}}` is missing, stop while waiting for the answer
* resolve `{{repo_root}}` to an existing absolute path
* expand `{{review_scope}}` into concrete paths under `{{repo_root}}`
* set `{{run_id}}` to a new timestamp id
* run [Resolve Agent Home](../../../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{out_dir}}` to `{{project_home}}/hsm-review/{{run_id}}`
* create `{{out_dir}}` and set `{{findings_log}}` to `{{out_dir}}/findings.jsonl`
* set `{{findings}}` to an empty list

## Find machines

* search scope for state machine definitions by structure, not by library name: a definition that
  declares vertices plus transitions with triggers, guards, or targets
* record for each: path, model name, and the builder or helper functions it composes
* if nothing is found, set `{{machine_inventory}}` to an empty list and continue
* write `{{out_dir}}/machines.json` and set `{{machine_inventory}}` from it

## Resolve dialect and overlays

* set `{{dialect}}` to the state machine library actually imported, with its **pinned version**,
  resolved from the lockfile or module list — not from memory and not from the newest release
* set `{{dialect}}` to `generic` when no known library is present; do not block on this
* set `{{policy_files}}` to any state machine rule or policy files present under the scope or repo root
* set `{{overlay_rules}}` from those files, keeping their native rule ids
* map each overlay rule onto a core rule id where one exists; record unmapped overlay rules as
  coverage gaps in `{{out_dir}}/rule-packs.json`
* allow an overlay to add a rule or raise a severity
* do not let an overlay weaken or lower a rule
* set `{{enforced_patterns}}` from any edit-time or pre-commit enforcement the repo runs, so those
  rules are not re-reported as findings

## Load rules

* load [hsm-core-rules.md](../references/hsm-core-rules.md) as the only primary rule set
* load [check-patterns.md](../references/check-patterns.md) for scans
* write `{{out_dir}}/scope.json` with repo_root, review_scope, dialect, dialect_version,
  policy_files, overlay coverage gaps, and enforced_patterns
* return to the caller
