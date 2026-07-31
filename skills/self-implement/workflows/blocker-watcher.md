<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Blocker Watcher

* if this lane is not blocked by an issue, MR, PR, review thread, external ticket, missing authority, missing resource, upstream dependency, or a CI/check failure that is currently blocking an authorized default-branch merge decision
  * return to the caller

* if CI/check state is failing or pending but the lane is not waiting on an authorized default-branch merge
  * run [Create MR Monitor Goal](mr-monitor.md#create-mr-monitor-goal)
  * return to the caller after the MR monitor path owns the pending checks

* create or maintain a MDScript goal that watches the blocking item until it closes, resolves, changes state, receives a relevant comment, or reaches the explicit unblock condition

* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.md#write-goal-mdscript)

* do not call `automation_update` or any automation tool for project control-plane orchestration unless the user explicitly requests external automation

* write the goal body as MDScript-oriented instructions, not prose-only polling

* give routine blocker watcher resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`

* include the blocking item, unblock condition, lane id, orchestrator reporting path, current branch, MR/PR link, `{{goal_mdscript}}`, and next `/mdscript-exec` implementer re-entry command in the goal state

* on routine wakeup, refresh the blocking item, live MR/PR, CI, review, discussion, tracker, and ledger state

* on routine wakeup, execute only the changed hot-path action

* when the blocker clears
  * continue with `/mdscript-exec {{repo_root}}/skills/self-implement/SKILL.md#inspect-current-state`
  * message the orchestrator with `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/monitor-implementer-lane.md#monitor-implementer-lane`

* when the blocker changes but does not clear
  * update the orchestrator with the new state, the next watcher check time, and any useful jump such as `/mdscript-exec {{repo_root}}/skills/self-orchestrate/SKILL.md#monitor-implementer-lane`

* when the blocker needs a coordinator decision
  * message the orchestrator with `/mdscript-exec {{repo_root}}/skills/self-orchestrate/workflows/handle-worker-exec-jump.md#handle-worker-exec-jump`

* before the blocker watcher stops for cleared, paused, obsolete, blocked, interrupted, tool-failed, authority-boundary, or watcher-terminal state
  * set `{{stop_reason}}` to the exact reason
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)
