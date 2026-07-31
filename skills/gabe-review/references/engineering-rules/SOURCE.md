# Engineering rules source

These files are vendored from [gabewillen/rules](https://github.com/gabewillen/rules).

- **Upstream:** https://github.com/gabewillen/rules
- **Vendored commit:** `b2ee8d412a57ddd899e7a7dd3528c4ea14322781`
- **Authoring format:** see upstream `template.md` — each rule is a Markdown heading `# <RULE-ID> <RFC-2119-KEYWORD> <Title>`
- **Do not invent metadata** for these files; plain Markdown is the contract
- **Refresh:** re-copy from the upstream repo and update this commit hash

Used by:

- `gabe-review` blind eng-* lanes selected in `workflows/select-review-lanes.md`
- `gabe-implement` construction packs selected in `skills/gabe-implement/workflows/select-implementation-rules.md` (`impl-*` entrypoints under `skills/gabe-implement/workflows/engineering-rules/`)

Do not fork these files per role. Implement holds and rechecks the same rule text that review later attacks.