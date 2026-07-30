<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Identify Scope

* resolve `{{repo_root}}` to an absolute path that exists
  * if missing, ask the user for a valid root and [Identify Scope](#identify-scope)
* expand `{{review_scope}}` into concrete file/dir paths under `{{repo_root}}`
* set `{{policy_files}}` to any of these present under the scope or repo root: `AGENTS.md`, `CLAUDE.md`, `.agents/rules/hsm.rules.md`, `docs/rules/sml.rules.md`, `hsm.go/rules.md`, `dsl.md`
* detect `{{dialect}}`:
  * `sml.cpp` if scope is dominated by `stateforward/sml`, `emel::`, `make_transition_table`, or `emel.cpp`
  * `hsm.go` if scope uses `github.com/stateforward/hsm.go` or `hsm.Define` in Go
  * `hsm.*` if other language HSM ports following `hsm.Define` / PascalCase DSL
  * if mixed, set `{{dialect}}` to `mixed` and list per-path dialects in `{{dialect_map}}`
* if `{{dialect}}` is still ambiguous
  * ask the user to choose `hsm.go`, `sml.cpp`, `hsm.*`, or `mixed`
  * [Identify Scope](#identify-scope)
* set `{{project_overlays}}` empty then add:
  * `grantt` when path or module looks like grantt-me/grantt or policy files pin `hsm.go` v1.3.1 / NATS actor rules
  * `emel` when under emel.cpp
  * `mjw` when under Development/mjw
* set `{{run_id}}` to a new timestamp id
* set `{{out_dir}}` to `{{repo_root}}/.gabe-hsm-review/{{run_id}}` when writable, otherwise `{{skill_root}}/runs/{{run_id}}`
* create `{{out_dir}}`
* write `{{out_dir}}/scope.json` with repo_root, review_scope, dialect, dialect_map, project_overlays, policy_files
* return to the caller
