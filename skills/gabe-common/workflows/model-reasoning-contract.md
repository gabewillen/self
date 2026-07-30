<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Configured Model And Reasoning

* list the models the current runtime actually offers before selecting; never name a model from memory, habit, a previous session, or another lane's choice

* set `{{required_model}}` to the best available model for this exact task, judged on complexity, ambiguity, consequence, proof burden, context size, tool needs, latency, and cost

* set `{{required_reasoning}}` to the effort level the task needs: the lowest that can reliably satisfy the role contract, raised when ambiguity, consequence, or proof burden demand more depth

* set `{{model_selection_basis}}` to a concise task-specific reason naming what made this model and this effort level the right fit

* if `{{gabe_role}}` is `orchestrator`
  * favor capability at multi-lane coordination, permission boundaries, long-context state, and decision-ready reporting over raw speed

* if `{{gabe_role}}` is `implementer`
  * favor capability at the exact change surface, its language and contracts, and the proof the claim requires
  * raise the effort level for multi-file, cross-package, concurrency, security, or data-loss work

* if `{{gabe_role}}` is `reviewer`
  * favor capability at falsification, contract reading, and finding what the author missed
  * do not select a weaker model or a lower effort level than the implementer used for the same change

* apply this selection to every agent acting as `gabe-orchestrate`, `gabe-implement`, or `gabe-review`

* apply it to child orchestrator threads, implementer threads, review subagents, and goal re-entries that resume one of those role flows

* before creating or handing off one of these role agents
  * configure `{{required_model}}` and `{{required_reasoning}}` in the thread, subagent, goal, or handoff tool when the surface exposes model or effort fields
  * include `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}` in the prompt, lane ledger, review record, or goal MDScript
  * verify the created role record when the surface exposes model or effort metadata

* if the current surface cannot configure model or effort but can carry prompt instructions
  * include the selected model, effort level, and basis verbatim in the role prompt or handoff
  * report that enforcement is prompt-level only

* if a selected model is unavailable
  * make a new task-appropriate selection from what the runtime currently offers, update `{{model_selection_basis}}`, and record the change before continuing
  * do not silently substitute a different model or effort level

* if no available model can meet the role's task needs
  * set `{{blocker}}` to the exact missing capability
  * report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping when this is a child orchestrator or goal-resumed lane
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for a model or runner decision, run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script)
  * stop before claiming the lane or goal is correctly configured
