# Review blind lane catalog

Lane selection lives in [select-review-lanes.mdscript.md](../workflows/select-review-lanes.mdscript.md). This catalog is the durable map of lane id → entrypoint → rule source → when to add.

## Always-on terminal lanes

| Lane id | Entrypoint | Rules / attack surface |
| --- | --- | --- |
| `rules` | `workflows/blind-reviewers/rules.mdscript.md#rules-blind-review` | Repo/agent instruction files (AGENTS, Cursor, VS Code, Windsurf) — **not** gabewillen/rules |
| `security` | `workflows/blind-reviewers/security.mdscript.md#security-blind-review` | Penetration and security attack surface |
| `completeness` | `workflows/blind-reviewers/completeness.mdscript.md#completeness-blind-review` | Goal-literal completeness |

## Content-selected lanes

| Lane id | Entrypoint | Select when |
| --- | --- | --- |
| `mdscript` | `workflows/blind-reviewers/mdscript.mdscript.md#mdscript-blind-review` | Any `SKILL.md` body, `*.mdscript.md`, or linked MDScript workflow/check/template in scope — runs the `/mdscript-review` gates plus execution-path attacks |

Lanes are selected from what is in scope, never by habit: `eng-*` lanes need executable source in scope (a manifest- or data-only code change takes `eng-core` alone), and MDScript heading-and-link control flow alone does not select the HSM lanes. Every selected lane must name the in-scope path or packet signal that selected it, and skipped candidates are recorded with the reason.

## Engineering-rules lanes (from [engineering-rules/](engineering-rules/))

Each uses the shared reviewer [engineering-rules.mdscript.md](../workflows/blind-reviewers/engineering-rules.mdscript.md) via a thin lane entrypoint under `workflows/blind-reviewers/eng-*.mdscript.md`.

| Lane id | Entrypoint | Rule file | Select when |
| --- | --- | --- | --- |
| `eng-core` | `eng-core.mdscript.md#eng-core-blind-review` | `core.rules.md` | Code, PR/MR, or branch readiness review |
| `eng-dbc` | `eng-dbc.mdscript.md#eng-dbc-blind-review` | `dbc.rules.md` | Code review, or claim/packet names contract, DBC, proof, API boundary, schema, IDL |
| `eng-patterns` | `eng-patterns.mdscript.md#eng-patterns-blind-review` | `patterns.rules.md` | Actor, RTC, HSM pattern, pipeline, or ECS signals in scope |
| `eng-rust` | `eng-rust.mdscript.md#eng-rust-blind-review` | `rust.rules.md` | `*.rs`, `Cargo.toml`, `Cargo.lock`, `.cargo/` |
| `eng-python` | `eng-python.mdscript.md#eng-python-blind-review` | `python.rules.md` | `*.py`, `pyproject.toml`, `setup.py`, `requirements*.txt`, `Pipfile` |
| `eng-typescript` | `eng-typescript.mdscript.md#eng-typescript-blind-review` | `typescript.rules.md` | `*.ts`, `*.tsx`, `tsconfig*.json`, or TypeScript-owned `package.json` |
| `eng-go` | `eng-go.mdscript.md#eng-go-blind-review` | `go.rules.md` | `*.go`, `go.mod`, `go.sum` |
| `eng-cpp` | `eng-cpp.mdscript.md#eng-cpp-blind-review` | `cpp.rules.md` | `*.cpp`, `*.cc`, `*.cxx`, `*.hpp`, `*.hh`, `*.hxx`, CMake/Bazel C++ paths |
| `eng-dart` | `eng-dart.mdscript.md#eng-dart-blind-review` | `dart.rules.md` | `*.dart`, `pubspec.yaml` (Dart without Flutter-only) |
| `eng-react` | `eng-react.mdscript.md#eng-react-blind-review` | `react.rules.md` | React paths, `react`/`react-dom` deps, `*.tsx`/`*.jsx` under UI apps |
| `eng-flutter` | `eng-flutter.mdscript.md#eng-flutter-blind-review` | `flutter.rules.md` | Flutter package/plugin markers, `flutter` in `pubspec.yaml` |
| `eng-hono` | `eng-hono.mdscript.md#eng-hono-blind-review` | `hono.rules.md` | `hono` dependency or Hono app/routes paths |
| `eng-pulumi` | `eng-pulumi.mdscript.md#eng-pulumi-blind-review` | `pulumi.rules.md` | `Pulumi.yaml`, `Pulumi.*.yaml`, pulumi program paths |
| `eng-webcomponents` | `eng-webcomponents.mdscript.md#eng-webcomponents-blind-review` | `webcomponents.rules.md` | Custom elements, `customElements`, web-component package paths |
| `eng-xstate` | `eng-xstate.mdscript.md#eng-xstate-blind-review` | `xstate.rules.md` | `xstate` / `@xstate/*` usage or machine definition paths |
| `eng-sml` | `eng-sml.mdscript.md#eng-sml-blind-review` | `sml.rules.md` | Boost.SML / `sml::` / SML machine paths |
| `eng-hsm` | `eng-hsm.mdscript.md#eng-hsm-blind-review` | `hsm.rules.md` | HSM/statechart rule checklist when HSM is in scope (normative rules file) |

## Deep specialty lanes

| Lane id | Entrypoint | Select when |
| --- | --- | --- |
| `hsm` | `hsm.mdscript.md#hsm-blind-review` | State machine / HSM / SML structural ownership in scope — runs the internal `self-review/hsm` UML pack (deeper than `eng-hsm` rules) |

When HSM is in scope, both `eng-hsm` (rules checklist) and `hsm` (semantic audit) may run. `eng-hsm` may sign off `n/a` only when the rules file is inapplicable; `hsm` has its own ownership gate.

## Caller override

- `{{forced_lanes}}` — comma-separated lane ids the caller requires in addition to selected ones
- `{{excluded_lanes}}` — comma-separated lane ids never to spawn
- Explicit request for a language or framework name forces that engineering lane when the rule file exists
