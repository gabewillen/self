<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Completeness Blind Review

* set `{{reviewer_lane}}` to `completeness`
* run [Open Lane Signoff](../triple-adversarial-blind-review.mdscript.md#open-lane-signoff)
* read the goal, the done state, `{{proof_scope}}`, and the primary user action word by word
* for a completion claim, reject TODO, FIXME, stubs, placeholders, mocks, no-ops, "structure exists", and "mostly done"
* make sure that each proof artifact exists on disk, and that the reproduce commands prove the primary path
* for a live claim, reject unit-only or partial-UI substitutes
* map each stated criterion to concrete evidence, and record each criterion without evidence as a finding
* set `contract` to the goal criterion, and `objectives_checked` to the criteria that you evaluated
* run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
