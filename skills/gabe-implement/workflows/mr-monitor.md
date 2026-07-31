<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create MR Monitor Goal

* if this lane does not create or own an MR/PR
  * return to the caller

* create or maintain an implementer-owned MDScript goal that monitors the MR/PR until merge or explicit close

* keep the project goal MDScript active while CI/CD, checks, review requests, reviewer grades, or unresolved discussions are pending

* set the goal's routine monitoring cadence to ten minutes

* do not create an external automation unless the user explicitly requests one

* run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)

* set `{{mdscript_reentry}}` to `/mdscript-exec {{goal_mdscript}}#resume-goal`

* record the ten-minute cadence, stop condition, and `{{mdscript_reentry}}` in the goal and lane ledger

* if the user explicitly requests external automation
  * [Arm External MR Automation](#arm-external-mr-automation)

* write the goal body as MDScript-oriented instructions, not prose-only polling

* give routine monitor resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`

* on routine resume, refresh live MR/PR, CI, review, discussion, and tracker state

* on routine resume, execute only the changed hot-path action

* do not reread or narrate full Agent, event, watcher, and ledger context unless `{{goal_mdscript}}` is missing or stale

* when the goal reports lane state, include `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/report-to-orchestrator.md#report-to-orchestrator` as the re-entry command

* when the goal detects a merged MR/PR with referenced tickets, include `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision` so the orchestrator can close eligible tracker items

* check CI/CD failures, review comments, unresolved threads, stale base drift, merge conflicts, draft state, mergeability, required proof status, merge state, and referenced tickets

* run [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) when monitor state implies `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`

* if the MR/PR is on the current target, exact-head CI is green, one fresh current-target `Proven` review exists, and no unresolved discussions remain
  * execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`
  * set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision`
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* if the MR/PR base or tested target differs from the current integration target
  * execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`
  * refresh onto the current target within one watcher cycle
  * if refresh fails
    * set `{{blocker}}` to the exact blocker, dirty state, conflict, missing authority, or thread failure
    * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* if no head movement follows an explicit target-consume, rebase, merge-target refresh, or source-refresh instruction
  * execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`
  * set `{{blocker}}` to the blocker path, dirty state, conflict, failed command, missing authority, or thread failure
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* if a priority instruction has no acknowledgment, output, or blocker after one watcher cycle
  * execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked`
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* treat CI/CD and check failures as monitored state and repair input for the current head

* fix, rerun, requeue, reply, or escalate CI and review failures within `{{granted_permissions}}`

* if repair of a CI or review failure exceeds `{{granted_permissions}}`
  * set `{{blocker}}` to the exact missing permission or failed repair
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* keep the orchestrator updated with MR/PR link, referenced tickets, agent identities for comment watching, current head, target head, event execution and event type when present, check state, default-branch merge blocker state, next proof, and ready, watching, or blocked status

* when handing an MR/PR to the orchestrator
  * tell the orchestrator to create or confirm `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/mr-comment-watcher.md#create-mr-comment-watcher`

* after merge, report merged MR/PR, referenced tickets, likely closure status, and keep-open evidence to the orchestrator

* before the watcher stops for merge, close, obsolete, paused, blocked, or tool failure, report `{{stop_reason}}` to the orchestrator

* do not close referenced tickets after merge unless the orchestrator explicitly delegates that post-merge administrative action

* if goal writing is unavailable
  * set `{{blocker}}` to the missing goal MDScript capability
  * keep manual ownership active for the current turn
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

## Arm External MR Automation

* run [Require Automate Skill](../../gabe-common/workflows/automation-preflight.md#require-automate-skill)

* set `{{cadence}}` to `FREQ=MINUTELY;INTERVAL=10`

* use the available automation tool only after the Agent Automate contract is complete

* if the requested automation tooling is unavailable
  * record the exact automation-tooling blocker
  * keep the project goal MDScript active as the durable monitoring source of truth
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)

* record the automation id, ten-minute cadence, stop condition, and `{{mdscript_reentry}}` in the saved automation, lane ledger, or handoff before claiming the automation-backed monitor is active
