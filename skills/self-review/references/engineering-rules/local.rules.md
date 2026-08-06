# Local engineering rules

Locally authored rules that are NOT vendored from gabewillen/rules. They are held and rechecked exactly like the vendored packs, and a re-vendor of `core.rules.md` must not silently drop them.

# LOCAL-ARG-001 MUST Named Arguments At Call Sites

Arguments MUST be named at the call site wherever the code under change controls how they are named.

A signature is owned when it is declared in this repository; a language builtin, framework entrypoint, or third-party API is not owned. Where clauses below appear to conflict, the narrower one governs: the ban on unnamed literals always applies, and the allowance for a single argument applies only when that argument is not a boolean, number, or enum.

Where the language supports keyword or named arguments, callers MUST pass them by name rather than by position.

Where it does not, a signature the change owns and that takes more than one argument, or any boolean, MUST accept a single object, struct, or record with named fields.

A signature the change does not own — a language builtin, a framework entrypoint, a third-party API — is exempt: the caller MUST instead bind each unclear literal to a named constant, variable, or field before passing it.

Positional arguments remain acceptable for a single unambiguous argument that is not a boolean, number, or bare enum, in any language.

A bare boolean, magic number, or bare enum at a call site is forbidden in every case; the exemption above changes how it is named, never whether it is.

# LOCAL-CUT-001 MUST Hard Cutover Before Release

Code that has not reached a 1.0 release and has not been deployed to a production or user-facing environment carries no external compatibility obligation, so every replacement, rename, or migration in it MUST be a hard cutover.

The same change MUST move every call site to the replacement and MUST delete the replaced code path, its tests, its configuration, and its documentation.

Deprecated shims, compatibility aliases, legacy fallbacks, re-export bridges, dual code paths kept in case the new one fails, version-suffixed duplicates such as `fooV2` beside `foo`, flags that gate the old path, and orphaned files left unreferenced MUST NOT survive the change.

Deprecation markers such as `@deprecated`, `DEPRECATED`, `legacy`, `old`, or "kept for backwards compatibility" MUST NOT be introduced for pre-1.0 or undeployed code; deletion is the only allowed disposition, because version control preserves the replaced code.

See:
- [CORE-DOC-001](core.rules.md#core-doc-001-must-not-keep-change-history-in-comments-and-docs)

A staged migration, dual-write window, or retained old path is allowed only when a released or deployed consumer depends on the old path today.

The change MUST name that consumer and the condition that retires the old path; an unnamed or hypothetical future consumer does not justify keeping it.

Deprecated, legacy, or unreferenced code left behind by a pre-1.0 or predeployment cutover is a release-blocking defect.
