<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create MR Monitor Goal

* if this lane owns no PR, return to the caller
* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript) for a monitor that runs until merge or close
  * cadence: ten minutes, resumed with `/mdscript-exec {{goal_mdscript}}#resume-goal`
  * record the cadence, stop condition, and re-entry in the goal and the lane ledger
* create an external automation only if the user asks for one
  * then run [Load Automation Context](../../self-automate/SKILL.md#load-automation-context) with cadence `FREQ=MINUTELY;INTERVAL=10`, and keep the goal as the source of truth
* on each resume, refresh the PR, CI, reviews, discussions, base, conflicts, and draft state, and act only on what changed:
  * if an event applies, run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)
  * fix, rerun, reply to, or escalate CI and review failures inside `{{granted_permissions}}`
  * if a repair needs more permission, set `{{blocker}}`, and run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* when you hand the PR to the orchestrator, ask for `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#create-mr-comment-watcher`
* after a merge, report the PR, the tickets, and which tickets can close
  * do not close tickets unless the orchestrator delegates it
* before the monitor stops for any reason, run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

## Create Blocker Watcher

* if no issue, PR, thread, ticket, missing authority, missing resource, or upstream dependency blocks this lane, return to the caller
* if only pending or failed checks block it, [Create MR Monitor Goal](#create-mr-monitor-goal)
* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript) to watch the blocking item until it changes, gets a comment, or meets the unblock condition
  * record the item, the unblock condition, the lane, the branch, the PR, and the implementer re-entry
* on each resume, refresh the item, and act only on what changed:
  * if it cleared, continue at `/mdscript-exec {{skills_root}}/self-implement/SKILL.md#inspect-current-state`, and tell the orchestrator with `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#monitor-implementer-lane`
  * if it changed, tell the orchestrator the new state and the next check
  * if it needs a coordinator decision, send `/mdscript-exec {{skills_root}}/self-orchestrate/SKILL.md#handle-worker-exec-jump`
* before the watcher stops, set `{{stop_reason}}`, and run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
