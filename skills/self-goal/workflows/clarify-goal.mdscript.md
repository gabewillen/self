<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Clarify Goal

* decide if three adversarial reviewers can objectively sign off on `{{goal_text}}` with empty `p_findings`
  * the reviewers must use reproducible artifacts for this decision
* if the scope, success criteria, proof method, constraints, or interpretation are not clear
  * ask 2–5 focused questions to make the goal clear
  * if it helps, propose a concrete goal draft
  * before you write session files, wait for the answers
  * set `{{goal_text}}` from the answer that the user accepted
  * [Clarify Goal](#clarify-goal)
* set `{{proof_kind}}` from the type of goal:
  * use `tui` for textual/terminal UI goals
  * use `ui` for visual/web/Figma goals
  * use `default` for all other goals
* if the user named `proof_kind`, keep that value
* set `{{live_proof}}` to `required` for `tui`/`ui`
* set `{{live_proof}}` to `required` for `default` if the goal changes runtime/user paths
* set `{{live_proof}}` to `optional` only for pure static goals (docs, types, dead-code with no runtime surface)
* if the user named `live_proof` as `required` or `optional`, keep that value
* if live proof is necessary, set `{{primary_user_action}}` to one sentence that names the end-to-end path that must work
* if live proof is necessary and `{{primary_user_action}}` is empty
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
    * use the resume heading `Clarify Goal` and `{{primary_user_action}}` as the requested value
  * ask the user for the primary user/runtime path as `{{primary_user_action}}`
  * [Clarify Goal](#clarify-goal)
* return to the caller
