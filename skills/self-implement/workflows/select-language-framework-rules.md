<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Language Packs

* if any in-scope path matches `*.rs`, `Cargo.toml`, `Cargo.lock`, or `.cargo/`
  * set `{{candidate_pack}}` to `impl-rust`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-rust.mdscript.md#impl-rust-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/rust.rules.md`
  * set `{{candidate_reason}}` to `Rust paths in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if any in-scope path matches `*.py`, `pyproject.toml`, `setup.py`, `requirements*.txt`, or `Pipfile`
  * set `{{candidate_pack}}` to `impl-python`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-python.mdscript.md#impl-python-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/python.rules.md`
  * set `{{candidate_reason}}` to `Python paths in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if any in-scope path matches `*.ts`, `*.tsx`, `tsconfig*.json`, or a TypeScript-owned package manifest
  * set `{{candidate_pack}}` to `impl-typescript`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-typescript.mdscript.md#impl-typescript-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/typescript.rules.md`
  * set `{{candidate_reason}}` to `TypeScript paths in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if any in-scope path matches `*.go`, `go.mod`, or `go.sum`
  * set `{{candidate_pack}}` to `impl-go`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-go.mdscript.md#impl-go-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/go.rules.md`
  * set `{{candidate_reason}}` to `Go paths in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if any in-scope path matches `*.cpp`, `*.cc`, `*.cxx`, `*.hpp`, `*.hh`, `*.hxx`, or C++ build files for changed sources
  * set `{{candidate_pack}}` to `impl-cpp`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-cpp.mdscript.md#impl-cpp-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/cpp.rules.md`
  * set `{{candidate_reason}}` to `C++ paths in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if any in-scope path matches `*.dart` or `pubspec.yaml`
  * set `{{candidate_pack}}` to `impl-dart`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-dart.mdscript.md#impl-dart-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/dart.rules.md`
  * set `{{candidate_reason}}` to `Dart paths in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* [Detect Framework Packs](#detect-framework-packs)

## Detect Framework Packs

* if React is present in deps, imports, or UI app paths under edit
  * set `{{candidate_pack}}` to `impl-react`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-react.mdscript.md#impl-react-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/react.rules.md`
  * set `{{candidate_reason}}` to `React in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
  * set `{{candidate_pack}}` to `impl-typescript`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-typescript.mdscript.md#impl-typescript-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/typescript.rules.md`
  * set `{{candidate_reason}}` to `React implies TypeScript rules when TS is used`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if Flutter is present in `pubspec.yaml` or Flutter package paths
  * set `{{candidate_pack}}` to `impl-flutter`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-flutter.mdscript.md#impl-flutter-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/flutter.rules.md`
  * set `{{candidate_reason}}` to `Flutter in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
  * set `{{candidate_pack}}` to `impl-dart`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-dart.mdscript.md#impl-dart-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/dart.rules.md`
  * set `{{candidate_reason}}` to `Flutter implies Dart rules`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if Hono is present in deps or route app paths
  * set `{{candidate_pack}}` to `impl-hono`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-hono.mdscript.md#impl-hono-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/hono.rules.md`
  * set `{{candidate_reason}}` to `Hono in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if Pulumi project or stack files are in scope
  * set `{{candidate_pack}}` to `impl-pulumi`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-pulumi.mdscript.md#impl-pulumi-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/pulumi.rules.md`
  * set `{{candidate_reason}}` to `Pulumi in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if custom elements or web-component package paths are in scope
  * set `{{candidate_pack}}` to `impl-webcomponents`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-webcomponents.mdscript.md#impl-webcomponents-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/webcomponents.rules.md`
  * set `{{candidate_reason}}` to `Web Components in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if XState packages or machine definitions are in scope
  * set `{{candidate_pack}}` to `impl-xstate`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-xstate.mdscript.md#impl-xstate-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/xstate.rules.md`
  * set `{{candidate_reason}}` to `XState in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
  * set `{{candidate_pack}}` to `impl-patterns`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-patterns.mdscript.md#impl-patterns-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/patterns.rules.md`
  * set `{{candidate_reason}}` to `XState implies state machine patterns`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* if Boost.SML or SML machine paths are in scope
  * set `{{candidate_pack}}` to `impl-sml`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-sml.mdscript.md#impl-sml-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/sml.rules.md`
  * set `{{candidate_reason}}` to `SML in scope`
  * run [Add Pack](select-implementation-rules.md#add-pack)
  * set `{{candidate_pack}}` to `impl-cpp`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-cpp.mdscript.md#impl-cpp-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/cpp.rules.md`
  * set `{{candidate_reason}}` to `SML implies C++ rules`
  * run [Add Pack](select-implementation-rules.md#add-pack)
  * set `{{candidate_pack}}` to `impl-patterns`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-patterns.mdscript.md#impl-patterns-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/patterns.rules.md`
  * set `{{candidate_reason}}` to `SML implies pattern rules`
  * run [Add Pack](select-implementation-rules.md#add-pack)
* return to the caller
