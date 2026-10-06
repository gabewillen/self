<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Engineering Rules Blind Review

* if `{{reviewer_lane}}` is empty, set it to `eng-{{rules_pack}}`
* run [Open Lane Signoff](../triple-adversarial-blind-review.mdscript.md#open-lane-signoff)
* set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/{{rules_pack}}.rules.md`, or `../../references/engineering-rules/{{rules_pack}}.rules.md` from this file
* read `{{rules_file}}` and each file in `{{extra_rules_files}}` from start to end
  * if one is missing, put its path in `remaining_gaps`, and run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
* treat each `# <RULE-ID> <KEYWORD> <Title>` heading as a rule; follow a See-link only to read a rule in scope
* review only these rules, not instruction files, security, completeness, or UML semantics, unless a rule links to them
* map each `MUST` and `MUST NOT` rule to the diff, the done state, and the proof
* a discouraged `SHOULD` path without a packet exception is a finding; an unsafe `MAY` path blocks
* attack hidden ownership, unbounded work, unhandled failures, weak contracts, and missing validation
* attack nondeterministic tests, and the language faults that the file names
* map each `MUST` breach to `P1` or higher
* if the rule supports it, map data races, undefined behavior, secret leaks, and unvalidated input to `P0`
* if no in-scope path uses the language or framework of the pack
  * set `lane_applicable` to `false`, with the search as evidence
* set `contract` to the rule id, keyword, and title, and `rules_reviewed` to the files that you opened
* run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
