<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Pursue Iteration

* read `{{run_dir}}/goal.json`, latest `progress.jsonl` lines, and any prior reviewer `p_findings` / `remaining_gaps`
* plan a wave of ≥2 parallel tracks when independent work exists (explore, implement, test, diagnose, capture proof)
* keep session bookkeeping, merges, manifest updates, and append-only `progress.jsonl` on the orchestrator
* never delegate the whole goal loop to one subagent
* spawn independent worker subagents in one turn with `run_in_background: true` when the host supports it
* set every worker `Task`/`run_agents` model to `{{orchestrator_model}}`
* give each worker exact scope, success criteria, commands, artifact paths under `{{run_dir}}/artifacts/`, and evidence to return
* forbid workers from reading or writing other sessions' goal files
* synthesize worker results before the next wave
* append one JSON line to `{{run_dir}}/progress.jsonl` with commands run, new artifact paths, and pass/fail evidence
* if the goal becomes ambiguous mid-session
  * set `"active": false` in `{{run_dir}}/goal.json`
  * ask clarifying questions
  * stop until restarted with an updated goal
* if blocked by a missing external resource that cannot be stood up
  * set `"active": false` in `{{run_dir}}/goal.json`
  * append `goal_blocked` with the exact missing resource
  * stop and report the blocker
* return to the caller
