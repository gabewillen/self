# Engineering rule packs

Implement and review load the same rule files from `self-review/references/engineering-rules/` (see [SOURCE.md](../../self-review/references/engineering-rules/SOURCE.md)). Implement pack `impl-<id>` and review lane `eng-<id>` check the same files.

| Pack id | Rule files | Select when | Also selects |
| --- | --- | --- | --- |
| `core` | `core.rules.md`, `local.rules.md` | Any code, PR, or implementation edit | |
| `dbc` | `dbc.rules.md` | Code work, or the claim names a contract, DBC, proof boundary, API, schema, or IDL | |
| `patterns` | `patterns.rules.md` | Actor, run-to-completion, pipeline, ECS, or state-machine pattern in scope | |
| `hsm` | `hsm.rules.md` | A state machine, transition table, event dispatch, lifecycle, or mode enum changes; or the claim names HSM, SML, statechart, or workflow state; or the signal is unclear | `patterns` |
| `rust` | `rust.rules.md` | `*.rs`, `Cargo.toml`, `Cargo.lock`, `.cargo/` | |
| `python` | `python.rules.md` | `*.py`, `pyproject.toml`, `setup.py`, `requirements*.txt`, `Pipfile` | |
| `typescript` | `typescript.rules.md` | `*.ts`, `*.tsx`, `tsconfig*.json`, a TypeScript package manifest | |
| `go` | `go.rules.md` | `*.go`, `go.mod`, `go.sum` | |
| `cpp` | `cpp.rules.md` | `*.cpp`, `*.cc`, `*.cxx`, `*.hpp`, `*.hh`, `*.hxx`, C++ build files | |
| `dart` | `dart.rules.md` | `*.dart`, `pubspec.yaml` | |
| `react` | `react.rules.md` | React deps, imports, or UI app paths | `typescript` when TS is used |
| `flutter` | `flutter.rules.md` | `flutter` in `pubspec.yaml`, Flutter package paths | `dart` |
| `hono` | `hono.rules.md` | Hono dependency or route paths | |
| `pulumi` | `pulumi.rules.md` | `Pulumi.yaml`, stack files, Pulumi program paths | |
| `webcomponents` | `webcomponents.rules.md` | Custom elements or web-component packages | |
| `xstate` | `xstate.rules.md` | `xstate`, `@xstate/*`, or machine definitions | `patterns` |
| `sml` | `sml.rules.md` | Boost.SML, `sml::`, or SML machine paths | `cpp`, `patterns` |

The deep UML audit of a state machine is the `self-review` `hsm` lane, not an implement pack.
