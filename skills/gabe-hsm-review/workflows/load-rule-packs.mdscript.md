<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Rule Packs

* always load [hsm-core-rules.md](../references/hsm-core-rules.md) as the **only** primary rule set (framework-agnostic / UML 2.5-oriented)
* do not treat framework notes as additional hard standards
* if remediation needs local API names and `{{dialect}}` is known
  * optionally skim [hsm-go-rules.md](../references/hsm-go-rules.md) or [sml-cpp-rules.md](../references/sml-cpp-rules.md) for wording only
* if a project overlay file exists (e.g. `.agents/rules/hsm.rules.md`), map extras onto core ids; never override CF/BH/HI
* load [check-patterns.md](../references/check-patterns.md) for scans
* write `{{out_dir}}/rule-packs.json` with primary=`hsm-core-rules` and optional dialect hint only
* return to the caller
