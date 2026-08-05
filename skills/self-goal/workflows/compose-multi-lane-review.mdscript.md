<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Compose Multi-Lane Review

* this goal/orchestrator process owns self-review **composition** — do not spawn a subagent whose job is `/self-review` or the full self-review skill
* the only review subagents are **per-lane** blind reviewers under `self-review/workflows/blind-reviewers/`
* confirm `{{run_dir}}/artifacts/manifest.json` exists and on-disk proof matches `{{proof_kind}}` and `{{live_proof}}`
  * if proof is incomplete, stop this workflow and return incomplete to the caller
* set `{{review_skill}}` to the installed `self-review` skill path
  * prefer `{{skill_root}}/../self-review/SKILL.md` when `{{skill_root}}` is set
  * otherwise `{{skills_root}}/self-review/SKILL.md` when `{{skills_root}}` is set
  * otherwise `{{skills_root}}/self-review/SKILL.md` when that path exists
* if `{{review_skill}}` is missing
  * append `review_blocked` with missing self-review skill path
  * return incomplete to the caller
* set `{{review_skill_root}}` to the directory containing that `SKILL.md`
* set `{{proof_scope}}` from the goal:
  * `live-proof` when `{{live_proof}}` is `required`
  * otherwise `goal-completion`
* set `{{intended_done_state}}` / `{{goal_text}}` to the exact goal
* set `{{proof_claim}}` to: artifacts and live/runtime proof (when required) demonstrate `{{goal_text}}` / `{{primary_user_action}}`
* set `{{proof_path}}` from `artifacts/manifest.json` reproduce commands, preferring live-tier entries
* set `{{proof_supplied}}` to on-disk artifact paths in the manifest
* set `{{local_resource_path}}` from stack/bootstrap commands needed by those reproduce paths
* set `{{merge_target}}` from the PR base, MR target, default branch, or `main` when unknown
* run `mdscript-exec {{review_skill_root}}/workflows/rolling-code-review.mdscript.md#resolve-review-baseline` in **this** process to build `{{review_diff}}` against `{{merge_target}}` before any lane is chosen
* take the in-scope changed paths from the `{{review_diff}}` path list, not from the goal text, worker notes, or the manifest
* set `{{blocking_severities}}` to `all findings` on the first goal-completion review round for code changes
* set `{{run_dir}}` / `{{review_signoff_dir}}` to the active goal run directory
* set `{{review_round}}` to `1` when empty, otherwise to `{{review_round}}` plus `1`
* record `review_round` in the run's goal front matter, so the completion gate can date this round's sign-offs instead of accepting any set that agrees with itself
* write this round's neutral packet at the minted `{{review_packet}}` path, never a fixed name that overwrites an earlier round, containing only:
  * exact goal / conversation_id / run_id / goal_mdscript
  * `proof_kind`, `live_proof`, `primary_user_action`, `proof_scope`
  * `{{review_diff}}`, `{{review_diff_scope}}`, `{{merge_target}}`, and `{{merge_base}}`
  * in-scope changed paths from that diff
  * full `artifacts/manifest.json`
  * full `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` when present (or note absent)
  * paths to applicable rules including Cursor (`.cursor/rules/**`), VS Code (`.vscode/**` instructions), and Windsurf (`.windsurf/rules/**`) when those trees exist
  * worker notes only as claims to falsify
* do not include a preferred verdict, prior sign-off narrative, or approve language
* keep every prior round's verdict and sign-offs; this round mints its own lexicographic names and never overwrites earlier evidence
* in **this** process, run lane selection and multi-lane spawn:
  * `mdscript-exec {{review_skill_root}}/workflows/select-review-lanes.mdscript.md#select-review-lanes`
  * `mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review`
* always-on blind lanes: `rules`, `security`, `completeness`
* selected add-on lanes come from in-scope paths and `references/lane-catalog.md` (`eng-*`, optional `hsm`)
* spawn every lane in `{{blind_lanes}}` as a parallel readonly subagent at `{{lane_entrypoints}}.<lane>` from this process
* give each lane its own `{{lane_signoff_paths}}.<lane>` as `{{signoff_path}}`, plus `{{review_round}}` and `{{review_signoff_dir}}`, so no lane recomputes a fixed name
* wait for one sign-off per spawned lane at `{{lane_signoff_paths}}.<lane>`, the path this round minted for that lane
* aggregate and persist this round's minted `<stamp>-<round>-<subject>-<identity>-review-verdict.mdscript.md` only from the parent aggregate (never invent Proven-for; never nest a self-review skill subagent to aggregate)
* append `review_composed` to `{{run_dir}}/progress.jsonl`
* if every spawned lane signed off, grade starts with `Proven for`, and `blocking_findings` is empty
  * append `review_passed`
  * return complete to the caller
* if any lane failed or grade is `Not ready for …`
  * union findings into the next fix wave
  * keep every lane sign-off and verdict as this round's evidence
  * append `review_rejected`
  * return incomplete to the caller
* if grade is `Blocked for …` and the missing precondition cannot be stood up locally
  * append `review_blocked`
  * return blocked to the caller
