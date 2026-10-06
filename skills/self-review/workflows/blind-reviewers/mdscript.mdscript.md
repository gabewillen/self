<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## MDScript Blind Review

* set `{{reviewer_lane}}` to `mdscript`
* run [Open Lane Signoff](../triple-adversarial-blind-review.mdscript.md#open-lane-signoff)
* set `{{mdscript_paths}}` to the `SKILL.md` bodies, `*.mdscript.md`, and linked workflows and templates in scope
* if it is empty, set `lane_applicable` to `false`, and run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
* run `/mdscript-review {{mdscript_paths}}`, and copy each unwaived finding into `p_findings` with its rule id
* if `/mdscript-review` is not available, run `node scripts/validate-mdscript.mjs {{mdscript_paths}}`, and check by hand:
  * the execution header, `SKILL.md` front matter, line budget (200 and 500), heading and file links
  * each `{{variable}}` is set earlier or documented as caller-supplied
  * each failure path ends in a link or a stop, and each prompt writes a return script first
* trace each path from the entry heading to each terminal state as a one-bullet executor:
  * name the guard of each back-edge, or record that it has none
  * enter each public heading cold, and check that its guards still hold
  * find guards that read variables that are unset or written later, and bullets that hide several actions or decisions
* run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
