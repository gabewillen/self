<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create MR Monitor Goal

* if this lane creates or owns an MR/PR
  * create or maintain an implementer-owned MDScript goal that monitors it until merge or explicit close
  * keep the project goal MDScript active while CI/CD, checks, review requests, reviewer grades, or unresolved discussions are pending
  * set the goal's routine monitoring cadence to ten minutes
  * do not create an external automation unless the user explicitly requests one

* before claiming the monitor is active
  * run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)
  * set `{{mdscript_reentry}}` to `/mdscript-exec {{goal_mdscript}}#resume-goal`
  * record the ten-minute cadence, stop condition, and `{{mdscript_reentry}}` in the goal and lane ledger
  * if the user explicitly requests external automation
    * run [Require Gabe Automate](../../gabe-common/workflows/automation-preflight.md#require-gabe-automate)
    * set `{{cadence}}` to `FREQ=MINUTELY;INTERVAL=10`
    * use the available automation tool only after the Gabe Automate contract is complete
    * do not claim the automation-backed monitor is active until the saved automation, lane ledger, or handoff records the automation id, ten-minute cadence, stop condition, and `{{mdscript_reentry}}`

* write the goal body as MDScript-oriented instructions, not prose-only polling

* give routine monitor resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`

* routine resumes should refresh live MR/PR, CI, review, discussion, and tracker state, then execute only the changed hot-path action; do not reread or narrate full Gabe, event, watcher, and ledger context unless `{{goal_mdscript}}` is missing or stale

* when the goal reports lane state, include `/mdscript-exec {{repo_root}}/skills/gabe-implement/workflows/report-to-orchestrator.md#report-to-orchestrator` as the re-entry command

* when the goal detects a merged MR/PR with referenced tickets, include `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision` so the orchestrator can close eligible tracker items

* check CI/CD failures, review comments, unresolved threads, stale base drift, merge conflicts, draft state, mergeability, required proof status, merge state, and referenced tickets

* run [Handle Thread Event Contracts](../../gabe-common/workflows/thread-event-contracts.md#handle-thread-event-contracts) when monitor state implies `DISPOSITION_READY`, `TARGET_DRIFT`, `HANDOFF_UNACKED`, or `STALE_MR`

* execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready` when the MR/PR is on the current target, exact-head CI is green, one fresh current-target `Proven` review exists, and no unresolved discussions remain
  * report `{{event_exec}}` to the orchestrator immediately with `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision`

* execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift` when the MR/PR base or tested target differs from the current integration target
  * refresh onto the current target within one watcher cycle or report exact blocker, dirty state, conflict, missing authority, or thread failure

* execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr` when no head movement follows an explicit target-consume, rebase, merge-target refresh, or source-refresh instruction
  * report blocker path, dirty state, conflict, failed command, missing authority, or thread failure before repeating old-head proof

* execute `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked` when a priority instruction has no acknowledgment, output, or blocker after one watcher cycle
  * escalate to the orchestrator instead of waiting silently

* treat CI/CD and check failures as monitored state and repair input; they block only default-branch merge decisions unless the repository or user explicitly defines a narrower proof gate

* fix, rerun, requeue, reply, or escalate within `{{granted_permissions}}`

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

* if explicitly requested automation tooling is unavailable
  * record the exact automation-tooling blocker
  * keep the project goal MDScript active as the durable monitoring source of truth
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)
