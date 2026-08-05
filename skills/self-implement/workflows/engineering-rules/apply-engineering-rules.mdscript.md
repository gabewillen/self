<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Engineering Rules

* if `{{impl_pack}}` is empty
  * stop and report that the pack entrypoint must set `{{impl_pack}}`
* if `{{implement_skill_root}}` is empty
  * set `{{implement_skill_root}}` to the absolute parent of this file's `workflows/engineering-rules` directory
* if `{{skills_root}}` is empty
  * set `{{skills_root}}` to the parent of `{{implement_skill_root}}`
* if `{{review_skill_root}}` is empty and `{{skills_root}}/self-review` exists
  * set `{{review_skill_root}}` to `{{skills_root}}/self-review`
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to `{{implement_skill_root}}/../self-review` when that directory exists
* set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/{{rules_basename}}` when `{{rules_file}}` is empty and `{{rules_basename}}` is set and `{{review_skill_root}}` is set
* if `{{rules_file}}` is empty or missing and `{{rules_basename}}` is set
  * resolve `{{rules_file}}` from this file's directory as `../../../self-review/references/engineering-rules/{{rules_basename}}`
* if `{{rules_file}}` is empty
  * stop and report that the pack entrypoint must set `{{rules_basename}}` or `{{rules_file}}`
* if `{{impl_rules_phase}}` is empty
  * set `{{impl_rules_phase}}` to `hold`
* if `{{rules_file}}` does not exist
  * stop and report the missing rules path `{{rules_file}}` for `{{impl_pack}}`
* read `{{rules_file}}` end-to-end
* parse every top-level `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` heading as a rule under this pack
* follow Markdown See-links only when needed to interpret an in-scope rule
* set `{{pack_rules_loaded}}` to `{{rules_file}}` plus any linked rule files actually opened
* if `{{impl_rules_phase}}` is `hold`
  * [Hold Construction Constraints](#hold-construction-constraints)
* if `{{impl_rules_phase}}` is `recheck`
  * [Check Diff Against Rules](#check-diff-against-rules)
* [Finish Pack](#finish-pack)

## Hold Construction Constraints

* map each MUST and MUST NOT rule to the planned edit, claim scope, and files in `{{in_scope_paths}}`
* hold those rules as active construction constraints for Implement Narrowly
* treat SHOULD / SHOULD NOT as preferred defaults unless an explicit exception is already recorded
* treat MAY as optional unless the design relies on the optional path unsafely
* reject designs that hide ownership, unbounded work, silent failure, weak API contracts, missing validation, ambient non-determinism, or language- or framework-specific violations named by the file
* if the pack is language- or framework-specific and no in-scope path uses that language or framework
  * set `{{pack_applicable}}` to `false`
  * record the search that proved non-applicability
  * [Finish Pack](#finish-pack)
* set `{{pack_applicable}}` to `true`
* record `{{impl_pack}}` held constraints on the file task
* [Finish Pack](#finish-pack)

## Check Diff Against Rules

* map each MUST and MUST NOT rule to the current diff and claimed done state
* treat SHOULD / SHOULD NOT as findings only when the change clearly chooses the discouraged path without a recorded exception
* if the pack is language- or framework-specific and no in-scope path uses that language or framework
  * set `{{pack_applicable}}` to `false`
  * record the non-applicability search
  * [Finish Pack](#finish-pack)
* set `{{pack_applicable}}` to `true`
* for each standing MUST or MUST NOT breach in the current diff
  * append a violation with `pack`, `rule_id`, `keyword`, `title`, `location`, `summary`, and `remediation` to `{{impl_rule_violations}}`
* grade release-blocking defects (data races, undefined behavior, secret leakage, unvalidated untrusted input) as highest priority in the violation list
* [Finish Pack](#finish-pack)

## Finish Pack

* record `{{impl_pack}}`, `{{pack_applicable}}`, `{{pack_rules_loaded}}`, and `{{impl_rules_phase}}` on the file task
* return to the caller with any new items in `{{impl_rule_violations}}`
