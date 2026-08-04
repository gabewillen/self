# self-implement engineering-rules catalog

Implementers load the **same** vendored rule files as `self-review` blind eng lanes. Selection lives in [select-implementation-rules.mdscript.md](../workflows/select-implementation-rules.mdscript.md). This catalog maps pack id → entrypoint → rule source → when to add.

Rule files are **not** duplicated. Resolve each pack's `{{rules_file}}` under `self-review/references/engineering-rules/` (see [SOURCE.md](../../self-review/references/engineering-rules/SOURCE.md)).

## Always-on code packs

| Pack id | Entrypoint | Rule file | Select when |
| --- | --- | --- | --- |
| `impl-core` | `workflows/engineering-rules/impl-core.mdscript.md#impl-core-apply` | `core.rules.md` | Any code, PR/MR, or implementation edit |
| `impl-dbc` | `workflows/engineering-rules/impl-dbc.mdscript.md#impl-dbc-apply` | `dbc.rules.md` | Code work, or claim names contract, DBC, proof, API, schema, IDL |

## Conditional architecture packs

| Pack id | Entrypoint | Rule file | Select when |
| --- | --- | --- | --- |
| `impl-patterns` | `workflows/engineering-rules/impl-patterns.mdscript.md#impl-patterns-apply` | `patterns.rules.md` | Actor, RTC, HSM pattern, pipeline, or ECS signals in scope |
| `impl-hsm` | `workflows/engineering-rules/impl-hsm.mdscript.md#impl-hsm-apply` | `hsm.rules.md` | State machine / HSM / SML / workflow-state work in scope |

Deep UML HSM semantic audit stays on the `self-review` `hsm` blind lane (`self-review/hsm/`). Implementers use `impl-hsm` as the construction checklist; they do not re-run the full adversarial HSM pack as a nested skill.

## Language packs

| Pack id | Entrypoint | Rule file | Select when |
| --- | --- | --- | --- |
| `impl-rust` | `workflows/engineering-rules/impl-rust.mdscript.md#impl-rust-apply` | `rust.rules.md` | `*.rs`, `Cargo.toml`, `Cargo.lock`, `.cargo/` |
| `impl-python` | `workflows/engineering-rules/impl-python.mdscript.md#impl-python-apply` | `python.rules.md` | `*.py`, `pyproject.toml`, `setup.py`, `requirements*.txt`, `Pipfile` |
| `impl-typescript` | `workflows/engineering-rules/impl-typescript.mdscript.md#impl-typescript-apply` | `typescript.rules.md` | `*.ts`, `*.tsx`, `tsconfig*.json`, TypeScript-owned package |
| `impl-go` | `workflows/engineering-rules/impl-go.mdscript.md#impl-go-apply` | `go.rules.md` | `*.go`, `go.mod`, `go.sum` |
| `impl-cpp` | `workflows/engineering-rules/impl-cpp.mdscript.md#impl-cpp-apply` | `cpp.rules.md` | C++ sources or C++ build files for changed sources |
| `impl-dart` | `workflows/engineering-rules/impl-dart.mdscript.md#impl-dart-apply` | `dart.rules.md` | `*.dart`, `pubspec.yaml` |

## Framework packs

| Pack id | Entrypoint | Rule file | Select when |
| --- | --- | --- | --- |
| `impl-react` | `workflows/engineering-rules/impl-react.mdscript.md#impl-react-apply` | `react.rules.md` | React paths or `react` / `react-dom` deps |
| `impl-flutter` | `workflows/engineering-rules/impl-flutter.mdscript.md#impl-flutter-apply` | `flutter.rules.md` | Flutter package markers / `flutter` in `pubspec.yaml` |
| `impl-hono` | `workflows/engineering-rules/impl-hono.mdscript.md#impl-hono-apply` | `hono.rules.md` | Hono dependency or Hono app/routes |
| `impl-pulumi` | `workflows/engineering-rules/impl-pulumi.mdscript.md#impl-pulumi-apply` | `pulumi.rules.md` | `Pulumi.yaml`, stack files, pulumi program paths |
| `impl-webcomponents` | `workflows/engineering-rules/impl-webcomponents.mdscript.md#impl-webcomponents-apply` | `webcomponents.rules.md` | Custom elements / web-component packages |
| `impl-xstate` | `workflows/engineering-rules/impl-xstate.mdscript.md#impl-xstate-apply` | `xstate.rules.md` | `xstate` / `@xstate/*` or machine definition paths |
| `impl-sml` | `workflows/engineering-rules/impl-sml.mdscript.md#impl-sml-apply` | `sml.rules.md` | Boost.SML / `sml::` / SML machine paths |

## Shared apply workflow

Every thin `impl-*` entrypoint sets `{{impl_pack}}` and `{{rules_basename}}`, then runs [apply-engineering-rules.mdscript.md](../workflows/engineering-rules/apply-engineering-rules.mdscript.md), which resolves `{{rules_file}}` from `{{review_skill_root}}` or the relative fallback. A caller may set `{{rules_file}}` directly instead.

## Caller override

- `{{forced_impl_packs}}` — pack ids the caller requires in addition to selected ones
- `{{excluded_impl_packs}}` — pack ids never to apply
- Explicit request for a language or framework name forces that pack when the rule file exists

## Review pairing

| Implement pack | Review lane that will later check the same rules |
| --- | --- |
| `impl-core` | `eng-core` |
| `impl-dbc` | `eng-dbc` |
| `impl-patterns` | `eng-patterns` |
| `impl-hsm` | `eng-hsm` (+ deep `hsm` lane for UML audit) |
| `impl-<lang/fw>` | `eng-<lang/fw>` |
