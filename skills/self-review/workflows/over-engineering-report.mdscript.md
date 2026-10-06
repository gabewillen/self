<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Report Over Engineering

* use this workflow only when the user asks for an over-engineering review, an over-engineering audit, or "what can we delete"
* this is a one-shot report from this process
* do not spawn reviewers
* do not apply fixes
* read [Ponytail Rules](../references/engineering-rules/ponytail.rules.md) from start to end
* if the user asked about a diff, a branch, or a pull/merge request
  * set `{{report_scope}}` to `diff`
  * set `{{in_scope_paths}}` to the changed paths of that diff
* if the user asked about the full repository
  * set `{{report_scope}}` to `tree`
  * set `{{in_scope_paths}}` to the tracked source files, without vendored, generated, and build output
* find only over-engineering and complexity
* do not report correctness defects, security defects, or performance as findings here
  * tell the user to use a normal review for those
* look for these items:
  * a dependency that the standard library or the platform already gives
  * an interface with one implementation, a factory with one product, or a wrapper that only delegates
  * a file that exports one thing, a flag or configuration that nobody sets, or dead code
  * hand-written code that the standard library already does
  * a helper that duplicates an equivalent helper in this repository
* before you write a `delete:` finding, search the full tree for the symbol
  * include tests, fixtures, strings, and dynamic references in that search
* do not report a single smoke test or an `assert`-based self-check as bloat
* for each finding, run [Write Finding Line](#write-finding-line)
* if `{{report_scope}}` is `tree`, sort the findings by the size of the cut, largest first
* [Finish Over Engineering Report](#finish-over-engineering-report)

## Write Finding Line

* set `{{finding_tag}}` to one of these tags:
  * `delete:` for dead code, unused flexibility, or a speculative feature. Nothing replaces it.
  * `stdlib:` for hand-written code that the standard library does. Name the function.
  * `native:` for a dependency or code that the platform does. Name the feature.
  * `reuse:` for an equivalent helper in this repository. Name the path.
  * `yagni:` for an abstraction with one implementation, unused configuration, or a layer with one caller.
  * `shrink:` for the same logic in fewer lines. Show the shorter form.
* number the findings `1.`, `2.`, and so on across the full report
  * the user can then say "fix 2 and 5"
* write `<N>. <path>:L<line>: <tag> <what to cut>. <replacement>.`
* return to the caller

## Finish Over Engineering Report

* if no finding exists, write `Lean already. Ship.`
* if `{{report_scope}}` is `diff`, end with `net: -<N> lines possible.`
* if `{{report_scope}}` is `tree`, end with `net: -<N> lines, -<M> deps possible.`
* stop

## Report Shortcut Ledger

* use this state only when the user asks for the `ponytail:` shortcut ledger
* a request for the deferred shortcuts, or the work marked for later, is the same request
* this state reads and reports only
* do not change files
* search the repository for `ponytail:` comment markers
  * do not search `.git`, `node_modules`, `dist`, `build`, or other build output
  * match only comment prefixes such as `#`, `//`, and `/*`
  * do not make a ledger row from prose about the convention
* for each marker, write one row under its file:
  * `<file>:<line>, <what was simplified>. ceiling: <limit>. upgrade: <trigger>.`
* if a marker names no upgrade trigger, add the tag `no-trigger`
* end with `<N> markers, <M> with no trigger.`
* if no marker exists, write `No ponytail: debt. Clean ledger.`
* if the user asks to keep the ledger, write it to the file that the user names
* stop
