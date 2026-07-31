<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Language Lanes

* if any in-scope path matches `*.rs`, `Cargo.toml`, `Cargo.lock`, or `.cargo/`
  * set `{{candidate_lane}}` to `eng-rust`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-rust.mdscript.md#eng-rust-blind-review`
  * set `{{candidate_reason}}` to `Rust paths in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if any in-scope path matches `*.py`, `pyproject.toml`, `setup.py`, `requirements*.txt`, or `Pipfile`
  * set `{{candidate_lane}}` to `eng-python`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-python.mdscript.md#eng-python-blind-review`
  * set `{{candidate_reason}}` to `Python paths in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if any in-scope path matches `*.ts`, `*.tsx`, `tsconfig*.json`, or a TypeScript-owned package manifest
  * set `{{candidate_lane}}` to `eng-typescript`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-typescript.mdscript.md#eng-typescript-blind-review`
  * set `{{candidate_reason}}` to `TypeScript paths in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if any in-scope path matches `*.go`, `go.mod`, or `go.sum`
  * set `{{candidate_lane}}` to `eng-go`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-go.mdscript.md#eng-go-blind-review`
  * set `{{candidate_reason}}` to `Go paths in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if any in-scope path matches `*.cpp`, `*.cc`, `*.cxx`, `*.hpp`, `*.hh`, `*.hxx`, or C++ build files for changed sources
  * set `{{candidate_lane}}` to `eng-cpp`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-cpp.mdscript.md#eng-cpp-blind-review`
  * set `{{candidate_reason}}` to `C++ paths in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if any in-scope path matches `*.dart` or `pubspec.yaml`
  * set `{{candidate_lane}}` to `eng-dart`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-dart.mdscript.md#eng-dart-blind-review`
  * set `{{candidate_reason}}` to `Dart paths in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* [Detect Framework Lanes](#detect-framework-lanes)

## Detect Framework Lanes

* if React is present in deps, imports, or UI app paths under review
  * set `{{candidate_lane}}` to `eng-react`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-react.mdscript.md#eng-react-blind-review`
  * set `{{candidate_reason}}` to `React in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
  * set `{{candidate_lane}}` to `eng-typescript`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-typescript.mdscript.md#eng-typescript-blind-review`
  * set `{{candidate_reason}}` to `React implies TypeScript rules when TS is used`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if Flutter is present in `pubspec.yaml` or Flutter package paths
  * set `{{candidate_lane}}` to `eng-flutter`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-flutter.mdscript.md#eng-flutter-blind-review`
  * set `{{candidate_reason}}` to `Flutter in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
  * set `{{candidate_lane}}` to `eng-dart`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-dart.mdscript.md#eng-dart-blind-review`
  * set `{{candidate_reason}}` to `Flutter implies Dart rules`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if Hono is present in deps or route app paths
  * set `{{candidate_lane}}` to `eng-hono`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-hono.mdscript.md#eng-hono-blind-review`
  * set `{{candidate_reason}}` to `Hono in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if Pulumi project or stack files are in scope
  * set `{{candidate_lane}}` to `eng-pulumi`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-pulumi.mdscript.md#eng-pulumi-blind-review`
  * set `{{candidate_reason}}` to `Pulumi in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if custom elements or web-component package paths are in scope
  * set `{{candidate_lane}}` to `eng-webcomponents`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-webcomponents.mdscript.md#eng-webcomponents-blind-review`
  * set `{{candidate_reason}}` to `Web Components in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if XState packages or machine definitions are in scope
  * set `{{candidate_lane}}` to `eng-xstate`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-xstate.mdscript.md#eng-xstate-blind-review`
  * set `{{candidate_reason}}` to `XState in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
  * set `{{candidate_lane}}` to `eng-patterns`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-patterns.mdscript.md#eng-patterns-blind-review`
  * set `{{candidate_reason}}` to `XState implies state machine patterns`
  * run [Add Lane](select-review-lanes.md#add-lane)
* if Boost.SML or SML machine paths are in scope
  * set `{{candidate_lane}}` to `eng-sml`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-sml.mdscript.md#eng-sml-blind-review`
  * set `{{candidate_reason}}` to `SML in scope`
  * run [Add Lane](select-review-lanes.md#add-lane)
  * set `{{candidate_lane}}` to `eng-cpp`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-cpp.mdscript.md#eng-cpp-blind-review`
  * set `{{candidate_reason}}` to `SML implies C++ rules`
  * run [Add Lane](select-review-lanes.md#add-lane)
  * set `{{candidate_lane}}` to `eng-patterns`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-patterns.mdscript.md#eng-patterns-blind-review`
  * set `{{candidate_reason}}` to `SML implies pattern rules`
  * run [Add Lane](select-review-lanes.md#add-lane)
* return to the caller
