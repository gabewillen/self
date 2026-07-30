<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Rule Packs

* always load [hsm-core-rules.md](../references/hsm-core-rules.md) into the active rule set
* if `{{dialect}}` is `hsm.go` or `mixed` or `hsm.*`
  * load [hsm-go-rules.md](../references/hsm-go-rules.md)
* if `{{dialect}}` is `sml.cpp` or `mixed`
  * load [sml-cpp-rules.md](../references/sml-cpp-rules.md)
* if `grantt` is in `{{project_overlays}}`
  * enable grantt overlays in hsm-go rules (version pin, NATS actor mandate, naming, completion policies)
  * if `{{repo_root}}/.agents/rules/hsm.rules.md` or grantt `hsm.rules.md` exists, prefer that file’s HSM01–HSM98 text when it conflicts with the bundled summary
* if `emel` is in `{{project_overlays}}`
  * prefer `docs/rules/sml.rules.md` over `AGENTS.md` on conflict
* load [check-patterns.md](../references/check-patterns.md) for automated scans
* write `{{out_dir}}/rule-packs.json` listing loaded packs and overlay flags
* return to the caller
