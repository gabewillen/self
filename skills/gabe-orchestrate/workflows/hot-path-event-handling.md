<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Hot Path Event Handling

* use this workflow for goal resumes, worker stop reports, child-orchestrator reports, MR/PR state changes, CI terminal state, and reviewer verdict intake before reloading longer workflow detail
* resolve `{{goal_mdscript}}` from the active lane goal path when present
* refresh live MR/PR, tracker, CI, discussion, reviewer, and lane-ledger state on every goal resume
* do not reload the full skill context stack on every resume when a current goal MDScript already captures the lane context
* if `{{goal_mdscript}}` exists
  * execute `/mdscript-exec {{goal_mdscript}}#resume-goal` first
* if the goal script is missing, stale, contradicted by a new human correction, or the lane scope or project changed
  * reload the full skill context for the current lane
  * [Route Hot Path Signal](#route-hot-path-signal)
* after any hot-path state change, add a file comment on the affected task before updating chat or external trackers
* [Route Hot Path Signal](#route-hot-path-signal)

## Route Hot Path Signal

* if the signal is `TARGET_DRIFT`
  * [Handle Target Drift](#handle-target-drift)
* if the signal is `STALE_MR`
  * [Handle Stale Mr](#handle-stale-mr)
* if the signal is `HANDOFF_UNACKED`
  * [Handle Handoff Unacked](#handle-handoff-unacked)
* if the signal is `DISPOSITION_READY`
  * [Handle Disposition Ready](#handle-disposition-ready)
* if the signal is CI terminal green or fail
  * [Handle Ci Terminal State](#handle-ci-terminal-state)
* if the signal is reviewer `Proven` or `Not ready`
  * [Handle Reviewer Verdict](#handle-reviewer-verdict)
* stop and report that no matching hot-path signal was identified

## Handle Target Drift

* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-target-drift`
* execute `{{event_exec}}`
* interrupt old-target proof
* send the owner to refresh, rebase, or merge the target within one goal cycle, or report the exact blocker
* update `{{goal_mdscript}}` with old target, current target, owner, deadline, and blocker if any
* record `event_exec`, old target, current target, current head, owner, deadline, and blocker if any in the lane ledger
* report the event to parent/root before stopping
* if refresh cannot proceed
  * report `Blocked for {{claim_scope}}` with the exact blocker
  * stop
* stop after the target-drift handoff

## Handle Stale Mr

* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-stale-mr`
* execute `{{event_exec}}`
* stop accepting repeated old-head proof
* require the owner to report blocker path, dirty state, conflict, failed command, missing authority, or thread failure
* keep the goal active at interrupt cadence until new head or exact blocker appears
* record `event_exec`, requested refresh, last observed head, expected target head, attempts, owner, and blocker in the lane ledger
* report to parent/root before stopping or waiting
* do not downgrade to routine polling
* stop after the stale-mr handoff

## Handle Handoff Unacked

* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-handoff-unacked`
* execute `{{event_exec}}`
* escalate to parent/root
* reissue the handoff with a deadline, reassign owner, or record an explicit wait reason
* update the goal with ack/output/blocker deadline and escalation path
* record `event_exec`, instruction, owner, last contact, deadline, escalation path, and next owner in the lane ledger
* if this is a child orchestrator
  * report escalation to parent before stopping
* if this is the parent
  * deny, reassign, or set a deadline
* stop after escalation or deadline recording

## Handle Disposition Ready

* set `{{event_exec}}` to `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready`
* verify current target, exact-head CI green, one fresh current-target `Proven` review, and no unresolved discussions
* if any disposition precondition fails
  * set `{{blocker}}` to the failed disposition precondition
  * stop and report the incomplete disposition preconditions
* execute `{{event_exec}}`
* start merge/closure/disposition workflow immediately or record explicit root denial
* mark routine proof polling complete in the goal
* track only disposition outcome, denial, or new drift in the goal
* record `event_exec`, head, CI id, reviewer id/grade, discussion state, disposition owner, and authority in the lane ledger
* report to root/parent
* if disposition has not started and root denial is not recorded
  * set `{{blocker}}` to `disposition neither started nor denied`
  * stop and report the incomplete disposition action
* stop after disposition starts or root denial is recorded

## Handle Ci Terminal State

* record pipeline/check id, exact head, failed job names, retry/rerun availability, and next check time in the goal
* record `ci_state`, exact head, proof scope affected, repair owner, and default-branch merge blocker state in the lane ledger
* if CI is terminal green
  * re-evaluate reviews and discussions for `DISPOSITION_READY`
  * if all disposition preconditions hold
    * [Handle Disposition Ready](#handle-disposition-ready)
* if CI is terminal fail
  * classify source-health or CI-repair
  * send the owner to repair unless only default-branch merge is blocked
  * stop after the CI-repair handoff
* report changed state when it enables disposition, blocks the assigned claim, needs authority, or changes next owner
* stop after recording CI terminal state and next owner action

## Handle Reviewer Verdict

* if the grade is `Proven`
  * preserve the scoped verdict
  * check whether aggregate state creates `DISPOSITION_READY`
  * if all disposition preconditions hold
    * [Handle Disposition Ready](#handle-disposition-ready)
  * record reviewer id/alias, grade, proof scope, head, target, findings, questions, and GitLab note/thread ids in the lane ledger
  * report aggregate state change to parent/root when it changes next owner or disposition readiness
  * stop after recording the proven reviewer verdict
* if the grade is `Not ready`
  * send the implementer exact remediation or keep the GitLab thread unresolved
  * watch remediation acknowledgment within one watcher cycle
  * watch for a new reviewer grade after repair
  * record reviewer id/alias, grade, proof scope, head, target, findings, questions, and GitLab note/thread ids in the lane ledger
  * stop after recording the not-ready remediation handoff
* stop and report that the reviewer grade was neither Proven nor Not ready
