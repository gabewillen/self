<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create Blocker Watcher

* examine this lane for these items that can block it:
  * an issue, MR, PR, review thread, or external ticket
  * authority that this lane does not have, or a resource that is not available
  * an upstream dependency
  * a CI/check failure that blocks an authorized default-branch merge decision now
* if none of these items blocks this lane
  * return to the caller

* if the CI/check state is failed or pending, and the lane does not wait on an authorized default-branch merge
  * run [Create MR Monitor Goal](mr-monitor.mdscript.md#create-mr-monitor-goal)
  * after the MR monitor path owns the pending checks, return to the caller

* create or keep a MDScript goal that watches the blocking item until one of these events occurs:
  * the item closes, resolves, or changes state
  * the item gets a related comment
  * the item gets to the explicit unblock condition

* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)

* if the user does not explicitly ask for external automation
  * do not call `automation_update` or an automation tool for project control-plane orchestration

* write the goal body as MDScript instructions, not as prose-only polls

* give routine blocker watcher resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`

* write the blocking item, the unblock condition, the lane id, and the orchestrator reporting path in the goal state
* write the current branch, the MR/PR link, `{{goal_mdscript}}`, and the next `/mdscript-exec` implementer re-entry command in the goal state

* on a routine wakeup, refresh the blocking item, live MR/PR, CI, review, discussion, tracker, and ledger state

* on a routine wakeup, execute only the changed hot-path action

* if the blocker clears
  * continue with `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#inspect-current-state`
  * message the orchestrator with `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#monitor-implementer-lane`

* if the blocker changes but does not clear
  * tell the orchestrator the new state, the next watcher check time, and a useful jump
  * use a jump such as `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#monitor-implementer-lane`

* if the blocker needs a coordinator decision
  * message the orchestrator with `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#handle-worker-exec-jump`

* before the blocker watcher stops for a cleared, paused, obsolete, blocked, interrupted, or tool-failed state
  * set `{{stop_reason}}` to the exact reason
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* before the blocker watcher stops for an authority-boundary or watcher-terminal state
  * set `{{stop_reason}}` to the exact reason
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
