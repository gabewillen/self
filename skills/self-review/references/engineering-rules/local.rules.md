# Local engineering rules

Locally authored rules that are NOT vendored from gabewillen/rules. They are held and rechecked exactly like the vendored packs, and a re-vendor of `core.rules.md` must not silently drop them.

# LOCAL-ARG-001 MUST Named Arguments At Call Sites

Arguments MUST be named at the call site wherever the code under change controls how they are named.

Where the language supports keyword or named arguments, callers MUST pass them by name rather than by position.

Where it does not, a signature the change owns and that takes more than one argument, or any boolean, MUST accept a single object, struct, or record with named fields.

A signature the change does not own — a language builtin, a framework entrypoint, a third-party API — is exempt: the caller MUST instead bind each unclear literal to a named constant, variable, or field before passing it.

Positional arguments remain acceptable for a single unambiguous argument.

A bare boolean, magic number, or bare enum at a call site is forbidden in every case; the exemption above changes how it is named, never whether it is.
