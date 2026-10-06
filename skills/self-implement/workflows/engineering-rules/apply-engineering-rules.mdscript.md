<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Apply Engineering Rules

* read each rule file of the pack from `{{engineering_rules_root}}`, start to end
  * if a file is missing, stop and report its path
* treat each `# <RULE-ID> <KEYWORD> <Title>` heading as a rule
* follow a See-link only if you need it to read a rule in scope
* if no in-scope path uses the language or framework of the pack
  * record the search, and return to the caller
* if `{{impl_rules_phase}}` is `hold`
  * map each `MUST` and `MUST NOT` rule to the planned edit, and hold it as a constraint
  * use `SHOULD` rules as defaults, unless an exception is recorded
* if `{{impl_rules_phase}}` is `recheck`
  * map each `MUST` and `MUST NOT` rule to the current diff
  * append each breach to `{{impl_rule_violations}}` with the rule id, location, summary, and fix
  * treat a discouraged `SHOULD` path without a recorded exception as a breach
  * put data races, undefined behavior, secret leaks, and unvalidated untrusted input first
* return to the caller
