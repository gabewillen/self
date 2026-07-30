# Bindings (remediation wording only)

Not a rule source. Use only to phrase a remediation after a core finding exists.

**Before naming any API, resolve the version actually in use** (lockfile / module list / package
manifest) and confirm the symbol exists there. An API that exists in the latest release is not
evidence about the pinned one. If you cannot confirm it, describe the remediation in UML terms.

| Concept | Typical binding |
|---------|-----------------|
| Choice | choice pseudostate constructor, or ordered guarded transitions ending in an unguarded default |
| Machine-owned time | `after` / `every` / `at` transition triggers |
| Long-running work | activity / do-activity element |
| Deferral | native defer element |
| Internal transition | source with no target |
| Reusable child behavior | submachine state |
| Cross-actor request | dispatch event carrying a response channel |
| Graph extraction | model introspection / transition-snapshot API, model dump, or diagram export |

Record the resolved `{{dialect}}` and version in `scope.json` so remediation stays checkable.
