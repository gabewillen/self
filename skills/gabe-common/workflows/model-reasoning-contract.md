<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Select Configured Model And Reasoning

* if `{{gabe_role}}` is `orchestrator`
  * set `{{required_model}}` to `gpt-5.6 Sol`
  * set `{{required_reasoning}}` to `medium`
  * set `{{model_selection_basis}}` to `Gabe orchestrator default`

* if `{{gabe_role}}` is `implementer` or `reviewer`
  * select `{{required_model}}` from the `gpt-5.6` model family and select `{{required_reasoning}}` for the exact delegated task, proof scope, complexity, risk, context size, tool needs, latency, and cost
  * use the lowest reasoning level that can reliably satisfy the role contract and increase it when the task's ambiguity, consequence, or proof burden requires more depth
  * set `{{model_selection_basis}}` to a concise task-specific reason for the selection

* apply this selection to every agent acting as `gabe-orchestrate`, `gabe-implement`, or `gabe-review`

* apply it to child orchestrator threads, implementer threads, review subagents, and goal re-entries that resume one of those role flows

* before creating or handing off one of these role agents
  * configure `{{required_model}}` and `{{required_reasoning}}` in the thread, subagent, goal, or handoff tool when the surface exposes model or reasoning fields
  * include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}` in the prompt, lane ledger, review record, or goal MDScript
  * verify the created role record when the surface exposes model or reasoning metadata

* if the current surface cannot configure model or reasoning but can carry prompt instructions
  * include the selected model, reasoning, and basis verbatim in the role prompt or handoff
  * report that enforcement is prompt-level only

* if an orchestrator cannot be run or resumed with `gpt-5.6 Sol` and `medium` reasoning
  * set `{{blocker}}` to the exact missing model or reasoning capability
  * report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping when this is a child orchestrator or goal-resumed lane
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for a model or runner decision, run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script)
  * stop before claiming the orchestrator lane or goal is correctly configured

* if a selected implementer or reviewer model is unavailable
  * make a new task-appropriate selection from the `gpt-5.6` model family, update `{{model_selection_basis}}`, and record the change before continuing
  * do not silently substitute a different model or reasoning level
