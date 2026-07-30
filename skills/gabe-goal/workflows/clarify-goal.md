<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Clarify Goal

* decide whether three adversarial reviewers could objectively sign off with empty `p_findings` using reproducible artifacts for `{{goal_text}}`
* if scope, success criteria, proof method, constraints, or interpretation are ambiguous
  * ask 2–5 focused clarifying questions
  * propose a concrete goal draft when helpful
  * wait for answers before writing session files
  * set `{{goal_text}}` from the confirmed answer
  * [Clarify Goal](#clarify-goal)
* set `{{proof_kind}}` to `tui` for textual/terminal UI goals, `ui` for visual/web/Figma goals, otherwise `default`
* if the user named `proof_kind`, keep that value
* set `{{live_proof}}` to `required` for `tui`/`ui`, and for `default` when the goal changes runtime/user paths
* set `{{live_proof}}` to `optional` only for pure static goals (docs, types, dead-code with no runtime surface)
* if the user named `live_proof` as `required` or `optional`, keep that value
* set `{{primary_user_action}}` to one sentence naming the end-to-end path that must work when live proof is required
* if live proof is required and `{{primary_user_action}}` is empty
  * run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script) with the resume heading `Clarify Goal` and `{{primary_user_action}}` as the requested value
  * ask the user for the primary user/runtime path as `{{primary_user_action}}`
  * [Clarify Goal](#clarify-goal)
* return to the caller
