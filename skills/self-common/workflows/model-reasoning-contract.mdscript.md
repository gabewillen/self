<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Configured Model And Reasoning

* list the models the current runtime actually offers before selecting
* never name a model from memory, habit, a previous session, or another lane's choice
* set `{{required_model}}` to the best available model for this exact task, judged on complexity, ambiguity, consequence, proof burden, context size, tool needs, latency, and cost
* set `{{required_reasoning}}` to the effort level the task needs: the lowest that can reliably satisfy the role contract, raised when ambiguity, consequence, or proof burden demand more depth
* set `{{model_selection_basis}}` to a concise task-specific reason naming what made this model and this effort level the right fit
* if `{{self_role}}` is `orchestrator`
  * favor capability at multi-lane coordination, permission boundaries, long-context state, and decision-ready reporting over raw speed
* if `{{self_role}}` is `implementer`
  * favor capability at the exact change surface, its language and contracts, and the proof the claim requires
  * raise the effort level for multi-file, cross-package, concurrency, security, or data-loss work
* if `{{self_role}}` is `reviewer`
  * favor capability at falsification, contract reading, and finding what the author missed
  * do not select a weaker model or a lower effort level than the implementer used for the same change
* apply this selection to every agent acting as `self-orchestrate`, `self-implement`, or `self-review`
* apply it to child orchestrator threads, implementer threads, review subagents, and goal re-entries that resume one of those role flows
* before creating or handing off one of these role agents
  * [Apply Model Selection](#apply-model-selection)
* if a selected model is unavailable
  * [Reselect Available Model](#reselect-available-model)
* if no available model can meet the role's task needs
  * [Block Model Selection](#block-model-selection)
* return to the caller

## Apply Model Selection

* configure `{{required_model}}` and `{{required_reasoning}}` in the thread, subagent, goal, or handoff tool when the surface exposes model or effort fields
* include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}` in the prompt, lane ledger, review record, or goal MDScript
* verify the created role record when the surface exposes model or effort metadata
  * if verification fails, [Reselect Available Model](#reselect-available-model)
* if the current surface has no model or effort fields and can carry prompt instructions
  * include the selected model, effort level, and basis verbatim in the role prompt or handoff
  * report that enforcement is prompt-level only
  * return to [Select Configured Model And Reasoning](#select-configured-model-and-reasoning)
* return to [Select Configured Model And Reasoning](#select-configured-model-and-reasoning)

## Reselect Available Model

* make a new task-appropriate selection from what the runtime currently offers
* update `{{model_selection_basis}}` with the change reason
* record the change in the lane ledger or goal before continuing
* do not silently substitute a different model or effort level without recording it
* return to [Apply Model Selection](#apply-model-selection)

## Block Model Selection

* set `{{blocker}}` to the exact missing capability
* report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping when this is a child orchestrator or goal-resumed lane
* if the caller will prompt the user, a repository owner, or another authority surface for a model or runner decision
  * run [Prepare Prompt Return Script](return-script.mdscript.md#prepare-prompt-return-script)
* stop before claiming the lane or goal is correctly configured
