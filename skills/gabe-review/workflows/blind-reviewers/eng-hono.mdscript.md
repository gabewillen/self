<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Eng Hono Blind Review

* set `{{reviewer_lane}}` to `eng-hono`
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute parent of this file's `workflows/blind-reviewers` directory
* set `{{rules_file}}` to the absolute path of `../../references/engineering-rules/hono.rules.md` relative to this skill file
* if `{{review_skill_root}}` is set
  * set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/hono.rules.md`
* if `{{rules_file}}` is still relative or missing
  * resolve it from this file's directory as `../../references/engineering-rules/hono.rules.md`
* run [Engineering Rules Blind Review](engineering-rules.mdscript.md#engineering-rules-blind-review)
