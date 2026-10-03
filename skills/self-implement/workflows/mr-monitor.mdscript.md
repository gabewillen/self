<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create MR Monitor Goal

* if this lane does not create or own an MR/PR
  * return to the caller

* create or keep an implementer-owned MDScript goal that monitors the MR/PR until merge or explicit close

* while CI/CD, checks, review requests, reviewer grades, or unresolved discussions are pending, keep the project goal MDScript active

* set the routine monitor cadence of the goal to ten minutes

* if the user does not explicitly ask for an external automation
  * do not create an external automation

* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)

* set `{{mdscript_reentry}}` to `/mdscript-exec {{goal_mdscript}}#resume-goal`

* record the ten-minute cadence, stop condition, and `{{mdscript_reentry}}` in the goal and lane ledger

* if the user explicitly asks for external automation
  * [Arm External MR Automation](#arm-external-mr-automation)

* write the goal body as MDScript instructions, not as prose-only polls

* give routine monitor resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`

* on a routine resume, refresh the live MR/PR, CI, review, discussion, and tracker state

* on a routine resume, execute only the changed hot-path action

* if `{{goal_mdscript}}` exists and is not stale
  * do not read again or narrate the full skill-pack, event, watcher, and ledger context

* if the goal reports the lane state
  * include `/mdscript-exec {{skills_root}}/self-implement/workflows/report-to-orchestrator.mdscript.md#report-to-orchestrator` as the re-entry command

* if the goal finds a merged MR/PR with referenced tickets
  * include `/mdscript-exec {{skills_root}}/self-orchestrate/workflows/merge-or-close-decision.mdscript.md#handle-merge-or-close-decision` so that the orchestrator can close eligible tracker items

* check CI/CD failures, review comments, unresolved threads, stale base drift, merge conflicts, and the draft state
* check the mergeability, the status of necessary proof, the merge state, and the referenced tickets

* if the monitor state shows `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`
  * run [Handle Thread Event Contracts](../../self-common/workflows/thread-event-contracts.mdscript.md#handle-thread-event-contracts)

* if the MR/PR is on the current target and exact-head CI is green
  * if one fresh current-target `Proven` review exists and no unresolved discussions remain
    * execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
    * set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-orchestrate/workflows/merge-or-close-decision.mdscript.md#handle-merge-or-close-decision`
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* if the MR/PR base or tested target is not the same as the current integration target
  * execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
  * refresh onto the current target in one watcher cycle
  * if the refresh fails
    * set `{{blocker}}` to the exact blocker, dirty state, conflict, absent authority, or thread failure
    * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* if the head does not move after an explicit target-consume, rebase, merge-target refresh, or source-refresh instruction
  * execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr`
  * set `{{blocker}}` to the blocker path, dirty state, conflict, failed command, absent authority, or thread failure
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* if a priority instruction has no acknowledgment, output, or blocker after one watcher cycle
  * execute `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* treat CI/CD and check failures as monitored state and repair input for the current head

* fix, rerun, requeue, reply to, or escalate CI and review failures inside `{{granted_permissions}}`

* if the repair of a CI or review failure goes beyond `{{granted_permissions}}`
  * set `{{blocker}}` to the exact absent permission or failed repair
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* keep the orchestrator current with these items:
  * the MR/PR link, the referenced tickets, and the agent identities for the comment watch
  * the current head, the target head, and the event execution and event type, if present
  * the check state, the default-branch merge blocker state, and the next proof
  * the status: ready, watching, or blocked

* if you hand an MR/PR to the orchestrator
  * tell the orchestrator to create or make sure of `/mdscript-exec {{skills_root}}/self-orchestrate/workflows/mr-comment-watcher.mdscript.md#create-mr-comment-watcher`

* after the merge, tell the orchestrator the merged MR/PR, referenced tickets, likely closure status, and keep-open evidence

* before the watcher stops for merge, close, obsolete, paused, blocked, or tool failure, report `{{stop_reason}}` to the orchestrator

* if the orchestrator does not explicitly delegate that post-merge administrative action
  * do not close referenced tickets after the merge

* if the goal write is not available
  * set `{{blocker}}` to the goal MDScript capability that is absent
  * keep the manual ownership active for the current turn
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

## Arm External MR Automation

* run [Require Automate Skill](../../self-common/workflows/automation-preflight.mdscript.md#require-automate-skill)

* set `{{cadence}}` to `FREQ=MINUTELY;INTERVAL=10`

* after the automate skill contract is complete, use the available automation tool

* if the automation tool that the user asked for is not available
  * record the exact automation-tool blocker
  * keep the project goal MDScript active as the durable monitor source of truth
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)

* before you say that the automation-backed monitor is active
  * record the automation id, ten-minute cadence, stop condition, and `{{mdscript_reentry}}`
  * record them in the saved automation, the lane ledger, or the handoff
