<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Configured Model And Reasoning

* before you select, list the models that the current runtime actually offers
* do not name a model from memory, habit, a previous session, or the choice of a different lane
* if the runtime cannot list its models
  * set `{{required_model}}` to the model of the parent or of this process
  * record that the runtime gave no model list
* if the runtime lists its models, set `{{required_model}}` to the least capable available model that reliably satisfies this exact task
  * judge the task on complexity, ambiguity, consequence, proof burden, and context size
  * also judge the task on tool needs, latency, and cost
* set `{{required_reasoning}}` to the effort level that the task needs
  * use the lowest level that can reliably satisfy the role contract
  * if ambiguity, consequence, or proof burden needs more depth, use a higher level
* set `{{model_selection_basis}}` to a short reason that is specific to the task
  * name the facts that made this model and this effort level the correct fit
* if `{{self_role}}` is `orchestrator`
  * use a higher tier only for multi-lane coordination, permission boundaries, or long-context state
  * for a narrow coordination task, use the same lower tier as for other narrow work
* if `{{self_role}}` is `implementer`
  * prefer capability in the exact change surface, its language and contracts, and the proof that the claim needs
  * for multi-file, cross-package, concurrency, security, or data-loss work, use a higher effort level
* if `{{self_role}}` is `reviewer`
  * prefer capability in falsification, contract analysis, and the discovery of errors that the author missed
  * do not select a weaker model or a lower effort level than the implementer used for the same change
* apply this selection to each agent that acts as `self-orchestrate`, `self-implement`, or `self-review`
* apply it to child orchestrator threads, implementer threads, and review subagents
* apply it to goal re-entries that resume one of those role flows
* before you create or hand off one of these role agents
  * [Apply Model Selection](#apply-model-selection)
* if a selected model is not available
  * [Reselect Available Model](#reselect-available-model)
* if no available model can meet the task needs of the role
  * [Block Model Selection](#block-model-selection)
* return to the caller

## Apply Model Selection

* if the thread, subagent, goal, or handoff tool has model or effort fields
  * set `{{required_model}}` and `{{required_reasoning}}` in those fields
* put these lines in the prompt, lane ledger, review record, or goal MDScript:
  * `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`
* if the surface shows model or effort metadata
  * examine the created role record
  * if the examination fails, [Reselect Available Model](#reselect-available-model)
* if the current surface has no model or effort fields and can carry prompt instructions
  * put the selected model, effort level, and basis word for word in the role prompt or handoff
  * report that the prompt is the only enforcement
  * return to [Select Configured Model And Reasoning](#select-configured-model-and-reasoning)
* return to [Select Configured Model And Reasoning](#select-configured-model-and-reasoning)

## Reselect Available Model

* make a new selection for the task from the models that the runtime offers now
* change `{{model_selection_basis}}` to include the reason for the change
* before you continue, record the change in the lane ledger or goal
* do not silently use a different model or effort level without a record of it
* return to [Apply Model Selection](#apply-model-selection)

## Block Model Selection

* set `{{blocker}}` to the exact capability that is not there
* if this is a child orchestrator or goal-resumed lane
  * before you stop, report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}`
* if the caller will ask the user, a repository owner, or another authority surface for a model or runner decision
  * run [Prepare Prompt Return Script](return-script.mdscript.md#prepare-prompt-return-script)
* stop before you claim that the lane or goal has the correct configuration
