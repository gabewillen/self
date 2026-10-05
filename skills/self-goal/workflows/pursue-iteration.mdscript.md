<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Pursue Iteration

* read the `{{goal_mdscript}}` front matter, the latest `progress.jsonl` lines, and the `p_findings` / `remaining_gaps` of earlier reviewers
* if `{{execution_mode}}` is `direct`
  * do the tracks one after the other in this process
  * do not start worker subagents
* if independent work exists and `{{execution_mode}}` is not `direct`, plan a wave of ≥2 parallel tracks
  * the tracks can explore, implement, test, diagnose, or capture proof
* keep session records, merges, manifest changes, and the append-only `progress.jsonl` on the orchestrator
* never delegate the full goal loop to one subagent
* if the host supports it and `{{execution_mode}}` is not `direct`, start the independent worker subagents in one turn with `run_in_background: true`
* set the `Task`/`run_agents` model of each worker to `{{orchestrator_model}}`
* give each worker the exact scope, success criteria, and commands
* give each worker the artifact paths under `{{run_dir}}/artifacts/` and the evidence to return
* do not let workers read or write the goal files of other sessions
* before the next wave, combine the worker results
* append one JSON line to `{{run_dir}}/progress.jsonl` with the commands that ran, the new artifact paths, and the pass/fail evidence
* if the goal becomes ambiguous during the session
  * set the front-matter `active: false` on `{{goal_mdscript}}`
  * ask questions to make the goal clear
  * stop until the user starts the goal again with a changed goal
* if an external resource that you cannot stand up is not there, and this blocks the work
  * set the front-matter `active: false` on `{{goal_mdscript}}`
  * append `goal_blocked` with the exact resource that is not there
  * stop and report the blocker
* return to the caller
