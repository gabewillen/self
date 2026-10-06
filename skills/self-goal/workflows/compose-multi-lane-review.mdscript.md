<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Compose Multi-Lane Review

* compose the review in this process; never give the full `/self-review` to a subagent
* if `{{run_dir}}/artifacts/manifest.json` is missing, or the proof does not match `{{proof_kind}}` and `{{live_proof}}`, return incomplete
* set `{{review_skill_root}}` to the `self-review` directory beside this skill
  * if it is missing, append `review_blocked`, and return incomplete
* set `{{proof_scope}}` to `live-proof` if `{{live_proof}}` is `required`, else `goal-completion`
* set `{{proof_path}}` to the manifest reproduce commands, live-tier first, and `{{proof_supplied}}` to the manifest artifact paths
* set `{{merge_target}}` from the PR base, the MR target, or the default branch, or `main`
* run `mdscript-exec {{review_skill_root}}/workflows/rolling-code-review.mdscript.md#resolve-review-baseline`
* set `{{review_signoff_dir}}` to `{{run_dir}}`, add `1` to `{{review_round}}`, and record `review_round` in the run front matter
* write the packet of this round under a new minted name with only these items:
  * the goal, `conversation_id`, `run_id`, `goal_mdscript`, `proof_kind`, `live_proof`, `primary_user_action`, and `proof_scope`
  * `{{review_diff}}`, its changed paths, `{{merge_target}}`, and `{{merge_base}}`
  * the full manifest, the root agent instruction files, and the rule directories that exist
  * worker notes, only as claims to falsify
* run `mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review`
* append `review_composed` to `{{run_dir}}/progress.jsonl`
* if the grade starts with `Proven for` and `blocking_findings` is empty, append `review_passed`, and return complete
* if the grade starts with `Blocked for` and you cannot stand up the precondition, append `review_blocked`, and return blocked
* otherwise append `review_rejected`, keep this round's sign-offs, and return incomplete with the findings
