<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Configured Model And Reasoning

* use this state for each orchestrator, implementer, or reviewer agent, thread, subagent, or goal resume
* list the models that the runtime offers now, and do not name a model from memory
* if the runtime cannot list models, set `{{required_model}}` to the model of the parent or this process
* otherwise set `{{required_model}}` to the least capable model that reliably does this task
  * judge complexity, ambiguity, consequence, proof burden, context size, tools, latency, and cost
* set `{{required_reasoning}}` to the lowest effort that reliably does the task
* use a higher model or effort only for these items:
  * multi-lane coordination, permission boundaries, or long-context state
  * multi-file, cross-package, concurrency, security, or data-loss work
* a reviewer never uses a weaker model or lower effort than the implementer of the same change
* set `{{model_selection_basis}}` to the facts that made this choice fit
* if the spawn or handoff tool has model or effort fields, set them
* otherwise put the choice in the prompt, and report that the prompt is the only enforcement
* write `model`, `reasoning`, and `model_selection_basis` in the prompt, lane ledger, review record, or goal
* if the selected model is not available, select again, and record why
* if no available model can do the task
  * set `{{blocker}}` to the missing capability
  * report it to the parent, and stop
* return to the caller
