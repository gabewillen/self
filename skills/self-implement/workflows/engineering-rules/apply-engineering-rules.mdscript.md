<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Engineering Rules

* if `{{impl_pack}}` is empty
  * stop and report that the pack entrypoint must set `{{impl_pack}}`
* if `{{implement_skill_root}}` is empty
  * set `{{implement_skill_root}}` to the absolute parent of the `workflows/engineering-rules` directory of this file
* if `{{skills_root}}` is empty
  * set `{{skills_root}}` to the parent of `{{implement_skill_root}}`
* if `{{review_skill_root}}` is empty and `{{skills_root}}/self-review` exists
  * set `{{review_skill_root}}` to `{{skills_root}}/self-review`
* if `{{review_skill_root}}` is empty and the `{{implement_skill_root}}/../self-review` directory exists
  * set `{{review_skill_root}}` to `{{implement_skill_root}}/../self-review`
* if `{{rules_file}}` is empty and `{{rules_basename}}` is set and `{{review_skill_root}}` is set
  * set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/{{rules_basename}}`
* if `{{rules_file}}` is empty or missing and `{{rules_basename}}` is set
  * set `{{rules_file}}` to `../../../self-review/references/engineering-rules/{{rules_basename}}`, relative to the directory of this file
* if `{{rules_file}}` is empty
  * stop and report that the pack entrypoint must set `{{rules_basename}}` or `{{rules_file}}`
* if `{{impl_rules_phase}}` is empty
  * set `{{impl_rules_phase}}` to `hold`
* if `{{rules_file}}` does not exist
  * stop and report the missing rules path `{{rules_file}}` for `{{impl_pack}}`
* read all of `{{rules_file}}`
* parse each top-level `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` heading as a rule of this pack
* follow a Markdown See-link only when you must have it to interpret a rule in scope
* set `{{pack_rules_loaded}}` to `{{rules_file}}` and each linked rule file that you opened
* if `{{impl_rules_phase}}` is `hold`
  * [Hold Construction Constraints](#hold-construction-constraints)
* if `{{impl_rules_phase}}` is `recheck`
  * [Check Diff Against Rules](#check-diff-against-rules)
* [Finish Pack](#finish-pack)

## Hold Construction Constraints

* map each `MUST` and `MUST NOT` rule to the planned edit, the claim scope, and the files in `{{in_scope_paths}}`
* keep these rules as active construction constraints for Implement Narrowly
* use `SHOULD` and `SHOULD NOT` rules as preferred defaults, unless an explicit exception is already recorded
* use `MAY` rules as optional, unless the design uses the optional path in an unsafe way
* reject a design that hides ownership or does unbounded work
* reject a design that has silent failure, a weak API contract, or missing validation
* reject a design that has ambient non-determinism or a language or framework violation that the file names
* if the pack is specific to a language or framework and no path in scope uses that language or framework
  * set `{{pack_applicable}}` to `false`
  * record the search that proved that the pack does not apply
  * [Finish Pack](#finish-pack)
* set `{{pack_applicable}}` to `true`
* record the constraints that `{{impl_pack}}` holds on the file task
* [Finish Pack](#finish-pack)

## Check Diff Against Rules

* map each `MUST` and `MUST NOT` rule to the current diff and the claimed done state
* if the change clearly selects the path that a `SHOULD` or `SHOULD NOT` rule discourages, without a recorded exception
  * record that path as a finding
* if the pack is specific to a language or framework and no path in scope uses that language or framework
  * set `{{pack_applicable}}` to `false`
  * record the search that proved that the pack does not apply
  * [Finish Pack](#finish-pack)
* set `{{pack_applicable}}` to `true`
* for each `MUST` or `MUST NOT` breach that stays in the current diff
  * append a violation with `pack`, `rule_id`, `keyword`, `title`, `location`, `summary`, and `remediation` to `{{impl_rule_violations}}`
* give the highest priority in the violation list to release-blocking defects
* include data races, undefined behavior, secret leakage, and unvalidated untrusted input as release-blocking defects
* [Finish Pack](#finish-pack)

## Finish Pack

* record `{{impl_pack}}`, `{{pack_applicable}}`, `{{pack_rules_loaded}}`, and `{{impl_rules_phase}}` on the file task
* return to the caller with each new item in `{{impl_rule_violations}}`
