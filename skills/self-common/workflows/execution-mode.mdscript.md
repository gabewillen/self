<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Decide Execution Mode

* use this workflow only on a parentless main agent
* if `{{execution_mode}}` is empty
  * if the user explicitly asked for orchestration, subagents, worker lanes, or a team in this conversation
    * set `{{execution_mode}}` to `orchestrate`
  * if the user explicitly asked for direct work, no subagents, no team, or "just do it yourself" in this conversation
    * set `{{execution_mode}}` to `direct`
  * if the user answered the execution-mode question earlier in this conversation
    * set `{{execution_mode}}` to that answer
* do not set `{{execution_mode}}` from a skill rule, a hook, `AGENTS.md`, a default, or a different task
* if `{{execution_mode}}` is `orchestrate` or `direct`
  * return to the caller
* if the request does not write or edit anything
  * set `{{execution_mode}}` to `orchestrate`
  * do not ask the question
  * return to the caller
* if `{{can_spawn_subagents}}` is `false`
  * set `{{execution_mode}}` to `orchestrate`
  * use the single-process fallback of the orchestrate role
  * do not ask the question
  * return to the caller
* [Ask For Execution Mode](#ask-for-execution-mode)

## Ask For Execution Mode

* do not spawn a subagent, a worker lane, or a child thread before the user answers
* do not edit a file before the user answers
* ask the user for `{{execution_mode}}`: "Do I orchestrate this with subagents, or do the work directly with no subagents?"
  * if the answer is orchestrate, subagents, or a team, set `{{execution_mode}}` to `orchestrate`
  * if the answer is direct, implement, or no subagents, set `{{execution_mode}}` to `direct`
* keep `{{execution_mode}}` for the next requests in this conversation until the user changes it
* return to the caller
