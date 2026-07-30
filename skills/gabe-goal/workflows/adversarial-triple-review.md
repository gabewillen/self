<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Adversarial Triple Review

* confirm `{{run_dir}}/artifacts/manifest.json` exists and on-disk proof matches `{{proof_kind}}` and `{{live_proof}}`
  * if proof is incomplete, stop this workflow and return incomplete to the caller
* write a neutral `{{run_dir}}/review-packet.md` containing only: exact goal, `proof_kind`, `live_proof`, `primary_user_action`, in-scope paths, full `artifacts/manifest.json`, full `AGENTS.md` text when present (or note absent), paths to applicable rules, and worker notes only as claims to falsify
* do not include a preferred verdict, prior sign-off narrative, or approve language
* delete any existing `signoff-reviewer-a.json`, `signoff-reviewer-b.json`, and `signoff-reviewer-c.json` in `{{run_dir}}` before spawning a new round
* spawn three readonly adversarial blind reviewers A, B, and C in one turn
* set every reviewer model to `{{reviewer_model}}` (`composer-2.5-fast` or equivalent) — never the orchestrator model unless no composer-equivalent exists
* give each reviewer only the neutral packet plus permission to read listed paths and re-run reproduce commands
* forbid each reviewer from reading other reviewers' sign-offs, prompts, verdicts, or chat narratives before writing their own
* instruct each reviewer to default to `signed_off: false` and actively try to prove the change will not work or violates `AGENTS.md` / project rules
* require attacks covering correctness, `AGENTS.md`, project rules, completeness (TODO/stub/mock), proof authenticity, and goal-literal criteria
* require ≥2 real `attack_attempts`, including failed attacks
* require every issue graded `P0`/`P1`/`P2`/`P3` in `p_findings` — any non-empty list blocks sign-off
* allow sign-off only when attacks fail, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* reviewer A may write only `{{run_dir}}/signoff-reviewer-a.json` with `reviewer_id: "a"`
* reviewer B may write only `{{run_dir}}/signoff-reviewer-b.json` with `reviewer_id: "b"`
* reviewer C may write only `{{run_dir}}/signoff-reviewer-c.json` with `reviewer_id: "c"`
* the orchestrator must not write sign-off files
* wait for all three reviewers to finish
* read all three sign-off files
* if any file is missing, `signed_off` is false, `p_findings` is non-empty, required fields are missing, summaries are identical across reviewers, or goal/conversation_id mismatch
  * treat consensus as incomplete
  * union all `p_findings`, `attack_attempts`, and `remaining_gaps` for the next fix wave
  * delete all three sign-off files
  * append `review_consensus_failed` to `{{run_dir}}/progress.jsonl`
  * return incomplete to the caller
* append `review_consensus_passed` to `{{run_dir}}/progress.jsonl`
* return complete to the caller
