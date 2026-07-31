<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Impl Typescript Apply

* set `{{impl_pack}}` to `impl-typescript`
* if `{{implement_skill_root}}` is empty
  * set `{{implement_skill_root}}` to the absolute parent of this file's `workflows/engineering-rules` directory
* if `{{skills_root}}` is empty
  * set `{{skills_root}}` to the parent of `{{implement_skill_root}}`
* if `{{review_skill_root}}` is empty and `{{skills_root}}/gabe-review` exists
  * set `{{review_skill_root}}` to `{{skills_root}}/gabe-review`
* if `{{review_skill_root}}` is empty and `~/.agents/skills/gabe-review` exists
  * set `{{review_skill_root}}` to `~/.agents/skills/gabe-review`
* set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/typescript.rules.md` when `{{review_skill_root}}` is set
* if `{{rules_file}}` is empty or missing
  * resolve `{{rules_file}}` from this file's directory as `../../../gabe-review/references/engineering-rules/typescript.rules.md`
* run [Apply Engineering Rules](apply-engineering-rules.mdscript.md#apply-engineering-rules)
