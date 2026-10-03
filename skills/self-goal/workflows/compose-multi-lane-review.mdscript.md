<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Compose Multi-Lane Review

* this goal/orchestrator process owns the self-review **composition**
* do not start a subagent whose job is `/self-review` or the full self-review skill
* use only **per-lane** blind reviewers under `self-review/workflows/blind-reviewers/` as review subagents
* make sure that `{{run_dir}}/artifacts/manifest.json` exists
* make sure that the on-disk proof agrees with `{{proof_kind}}` and `{{live_proof}}`
  * if the proof is incomplete, stop this workflow and return incomplete to the caller
* set `{{review_skill}}` to the installed `self-review` skill path
  * if `{{skill_root}}` is set, prefer `{{skill_root}}/../self-review/SKILL.md`
  * if not, and `{{skills_root}}` is set, use `{{skills_root}}/self-review/SKILL.md`
  * if not, and that path exists, use `{{skills_root}}/self-review/SKILL.md`
* if `{{review_skill}}` is not there
  * append `review_blocked` with the self-review skill path that is not there
  * return incomplete to the caller
* set `{{review_skill_root}}` to the directory that contains that `SKILL.md`
* set `{{proof_scope}}` from the goal:
  * use `live-proof` if `{{live_proof}}` is `required`
  * if not, use `goal-completion`
* set `{{intended_done_state}}` / `{{goal_text}}` to the exact goal
* set `{{proof_claim}}` to this claim:
  * artifacts and live/runtime proof (if necessary) show `{{goal_text}}` / `{{primary_user_action}}`
* set `{{proof_path}}` from the reproduce commands in `artifacts/manifest.json`, and prefer live-tier entries
* set `{{proof_supplied}}` to the on-disk artifact paths in the manifest
* set `{{local_resource_path}}` from the stack/bootstrap commands that those reproduce paths need
* set `{{merge_target}}` from the PR base, the MR target, or the default branch
  * if the target is not known, use `main`
* before you select a lane, run `mdscript-exec {{review_skill_root}}/workflows/rolling-code-review.mdscript.md#resolve-review-baseline` in **this** process
  * this step builds `{{review_diff}}` against `{{merge_target}}`
* take the in-scope changed paths from the path list of `{{review_diff}}`
  * do not take them from the goal text, worker notes, or the manifest
* for code changes, set `{{blocking_severities}}` to `all findings` on the first goal-completion review round
* set `{{run_dir}}` / `{{review_signoff_dir}}` to the active goal run directory
* if `{{review_round}}` is empty, set it to `1`
* if `{{review_round}}` is not empty, add `1` to it
* record `review_round` in the goal front matter of the run
  * then the completion gate can date the sign-offs of this round
  * the gate does not accept a set of sign-offs only because they agree with each other
* write the neutral packet of this round at the minted `{{review_packet}}` path
  * never use a fixed name that overwrites an earlier round
* put only these items in the packet:
  * the exact goal / conversation_id / run_id / goal_mdscript
  * `proof_kind`, `live_proof`, `primary_user_action`, `proof_scope`
  * `{{review_diff}}`, `{{review_diff_scope}}`, `{{merge_target}}`, and `{{merge_base}}`
  * the in-scope changed paths from that diff
  * the full `artifacts/manifest.json`
  * the full `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` if they exist (or a note that they do not exist)
  * the paths to the applicable rules, if those trees exist:
    * Cursor (`.cursor/rules/**`), VS Code (`.vscode/**` instructions), and Windsurf (`.windsurf/rules/**`)
  * worker notes, only as claims to falsify
* do not include a preferred verdict, an earlier sign-off narrative, or approval words
* keep the verdict and sign-offs of each earlier round
* give this round its own minted lexicographic names, and never overwrite earlier evidence
* in **this** process, run the lane selection and the multi-lane spawn:
  * `mdscript-exec {{review_skill_root}}/workflows/select-review-lanes.mdscript.md#select-review-lanes`
  * `mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review`
* always use the blind lanes `rules`, `security`, and `completeness`
* select the add-on lanes from the in-scope paths and `references/lane-catalog.md` (`eng-*`, optional `hsm`)
* from this process, start each lane in `{{blind_lanes}}` as a parallel readonly subagent at `{{lane_entrypoints}}.<lane>`
* give each lane its own `{{lane_signoff_paths}}.<lane>` as `{{signoff_path}}`
  * also give `{{review_round}}` and `{{review_signoff_dir}}`, so that no lane calculates a fixed name again
* wait for one sign-off from each started lane at `{{lane_signoff_paths}}.<lane>`
  * this is the path that this round minted for that lane
* aggregate the minted `<stamp>-<round>-<subject>-<identity>-review-verdict.mdscript.md` of this round, and write it
  * write it only from the parent aggregate
  * never invent Proven-for
  * never nest a self-review skill subagent to aggregate
* append `review_composed` to `{{run_dir}}/progress.jsonl`
* if each started lane signed off, the grade starts with `Proven for`, and `blocking_findings` is empty
  * append `review_passed`
  * return complete to the caller
* if a lane failed or the grade is `Not ready for …`
  * combine the findings into the next fix wave
  * keep each lane sign-off and verdict as the evidence of this round
  * append `review_rejected`
  * return incomplete to the caller
* if the grade is `Blocked for …` and you cannot stand up the precondition locally
  * append `review_blocked`
  * return blocked to the caller
