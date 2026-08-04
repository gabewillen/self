<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Impl Core Apply

* set `{{impl_pack}}` to `impl-core`
* set `{{rules_basename}}` to `core.rules.md`
* run [Apply Engineering Rules](apply-engineering-rules.mdscript.md#apply-engineering-rules)
* set `{{impl_pack}}` to `impl-local`
* set `{{rules_file}}` to empty
* set `{{rules_basename}}` to `local.rules.md`
* run [Apply Engineering Rules](apply-engineering-rules.mdscript.md#apply-engineering-rules)
