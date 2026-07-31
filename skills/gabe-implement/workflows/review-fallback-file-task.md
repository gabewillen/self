<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Run File Task Reviewer Fallback

* if subagent tooling is available
  * return to the caller and continue the live subagent path

* create one reviewer file task for this round with a distinct task id, author, and parent set to the implementer task

* add a file comment on the implementer task that records `subagent_tooling: unavailable`, the neutral packet artifact, reviewer task ids, and the fallback boundary

* run one fresh reviewer pass from `/mdscript-exec {{repo_root}}/skills/gabe-review/SKILL.md#identify-review-scope`

* require the reviewer pass to write its own reviewer file comment with `role: reviewer`, a distinct `author`, `claim_scope`, `proof_decision`, evidence, questions, and stop report

* if the reviewer file comment is missing after the pass
  * set `{{blocker}}` to the missing reviewer file comment
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* do not claim public MR/PR merge-readiness through this fallback when the repository or tracker requires live blind subagents

* use this fallback only for project control-plane source-health proof when no subagent surface exists
