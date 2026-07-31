<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Compose Gabe Review

* this goal/orchestrator process owns gabe-review **composition** — do not spawn a subagent whose job is `/gabe-review` or the full gabe-review skill
* the only review subagents are **per-lane** blind reviewers under `gabe-review/workflows/blind-reviewers/`
* confirm `{{run_dir}}/artifacts/manifest.json` exists and on-disk proof matches `{{proof_kind}}` and `{{live_proof}}`
  * if proof is incomplete, stop this workflow and return incomplete to the caller
* set `{{review_skill}}` to the installed `gabe-review` skill path
  * prefer `{{skill_root}}/../gabe-review/SKILL.md`
  * otherwise `~/.agents/skills/gabe-review/SKILL.md`
  * otherwise `{{repo_root}}/skills/gabe-review/SKILL.md` when present
* if `{{review_skill}}` is missing
  * append `review_blocked` with missing gabe-review skill path
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
* set `{{blocking_severities}}` to `all findings` on the first goal-completion review round for code changes
* set `{{run_dir}}` / `{{review_signoff_dir}}` to the active goal run directory
* write neutral `{{run_dir}}/review-packet.md` containing only:
  * exact goal / conversation_id / run_id / goal_mdscript
  * `proof_kind`, `live_proof`, `primary_user_action`, `proof_scope`
  * in-scope changed paths
  * full `artifacts/manifest.json`
  * full `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` when present (or note absent)
  * paths to applicable rules including Cursor (`.cursor/rules/**`), VS Code (`.vscode/**` instructions), and Windsurf (`.windsurf/rules/**`) when those trees exist
  * worker notes only as claims to falsify
* do not include a preferred verdict, prior sign-off narrative, or approve language
* delete stale `{{run_dir}}/review-verdict.mdscript.md` and any prior `signoff-reviewer-*.mdscript.md` before the fresh round
* in **this** process, run lane selection and multi-lane spawn:
  * `mdscript-exec {{review_skill_root}}/workflows/select-review-lanes.md#select-review-lanes`
  * `mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review`
* always-on blind lanes: `rules`, `security`, `completeness`
* selected add-on lanes come from in-scope paths and `references/lane-catalog.md` (`eng-*`, optional `hsm`)
* spawn every lane in `{{blind_lanes}}` as a parallel readonly subagent at `{{lane_entrypoints}}.<lane>` from this process
* wait for one sign-off per spawned lane under `{{run_dir}}` named `signoff-reviewer-<lane>.mdscript.md`
* aggregate and persist `{{run_dir}}/review-verdict.mdscript.md` only from the parent aggregate (never invent Proven-for; never nest a gabe-review skill subagent to aggregate)
* append `review_composed` to `{{run_dir}}/progress.jsonl`
* if every spawned lane signed off, grade starts with `Proven for`, and `blocking_findings` is empty
  * append `review_passed`
  * return complete to the caller
* if any lane failed or grade is `Not ready for …`
  * union findings into the next fix wave
  * delete every lane sign-off and `review-verdict.mdscript.md`
  * append `review_rejected`
  * return incomplete to the caller
* if grade is `Blocked for …` and the missing precondition cannot be stood up locally
  * append `review_blocked`
  * return blocked to the caller
