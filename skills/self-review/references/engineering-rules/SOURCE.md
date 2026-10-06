# Engineering rules source

These files are vendored from [gabewillen/rules](https://github.com/gabewillen/rules).

- **Upstream:** https://github.com/gabewillen/rules
- **Vendored commit:** `b2ee8d412a57ddd899e7a7dd3528c4ea14322781`
- **Authoring format:** see upstream `template.md` — each rule is a Markdown heading `# <RULE-ID> <RFC-2119-KEYWORD> <Title>`
- **Do not invent metadata** for these files; plain Markdown is the contract
- **Refresh:** re-copy from the upstream repo and update this commit hash; `local.rules.md` is NOT vendored and must survive the refresh untouched

Used by:

- `self-review` blind eng-* lanes selected in `workflows/select-review-lanes.mdscript.md`
- `self-implement` construction packs selected in `skills/self-implement/workflows/select-implementation-rules.mdscript.md` (`impl-*` entrypoints under `skills/self-implement/workflows/engineering-rules/`)

`local.rules.md` holds locally authored rules that upstream does not carry. Never edit a vendored file to add one; a re-vendor would delete it silently.

Do not fork these files per role. Implement holds and rechecks the same rule text that review later attacks.