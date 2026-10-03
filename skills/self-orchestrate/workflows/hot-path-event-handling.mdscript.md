<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Hot Path Event Handling

* use this workflow before you load longer workflow detail again for these inputs:
  * goal resumes, worker stop reports, child-orchestrator reports, and MR/PR state changes
  * CI terminal state and reviewer verdict intake
* if a goal path exists for the active lane
  * set `{{goal_mdscript}}` to the active lane goal path
* at each goal resume, refresh the live MR/PR, tracker, CI, discussion, reviewer, and lane-ledger state
* if a current goal MDScript already holds the lane context
  * do not load the full skill context stack again at each resume
* if `{{goal_mdscript}}` exists
  * execute `/mdscript-exec {{goal_mdscript}}#resume-goal` first
* if the goal script is missing or stale, or a new human correction contradicts it
  * load the full skill context for the current lane again
  * [Route Hot Path Signal](#route-hot-path-signal)
* if the lane scope or the project changed
  * load the full skill context for the current lane again
  * [Route Hot Path Signal](#route-hot-path-signal)
* after each hot-path state change, add a file comment on the affected task before you change chat or external trackers
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
* report that no hot-path signal matched
* stop

## Handle Target Drift

* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-target-drift`
* execute `{{event_exec}}`
* interrupt the old-target proof
* tell the owner to refresh, rebase, or merge the target within one goal cycle, or to report the exact blocker
* write the old target, current target, owner, deadline, and blocker, if any, into `{{goal_mdscript}}`
* record `event_exec`, the old target, current target, current head, owner, deadline, and blocker, if any, in the lane ledger
* before you stop, report the event to the parent/root
* if the refresh cannot continue
  * report `Blocked for {{claim_scope}}` with the exact blocker
  * stop
* after the target-drift handoff, stop

## Handle Stale Mr

* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-stale-mr`
* execute `{{event_exec}}`
* stop the acceptance of repeated old-head proof
* tell the owner to report the blocker path, dirty state, conflict, failed command, missing authority, or thread failure
* keep the goal active at interrupt cadence until a new head or an exact blocker appears
* record `event_exec`, the requested refresh, last observed head, expected target head, tries, owner, and blocker in the lane ledger
* before you stop or wait, report to the parent/root
* do not go back to routine polls
* after the stale-mr handoff, stop

## Handle Handoff Unacked

* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-handoff-unacked`
* execute `{{event_exec}}`
* escalate to the parent/root
* send the handoff again with a deadline, assign a different owner, or record an explicit wait reason
* write the ack/output/blocker deadline and the escalation path into the goal
* record `event_exec`, the instruction, owner, last contact, deadline, escalation path, and next owner in the lane ledger
* if this is a child orchestrator
  * before you stop, report the escalation to the parent
* if this is the parent
  * deny, assign a different owner, or set a deadline
* after the escalation or the deadline record, stop

## Handle Disposition Ready

* set `{{event_exec}}` to `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
* make sure that the target is current
* make sure that the exact-head CI is green
* make sure that one fresh current-target `Proven` review exists
* make sure that no unresolved discussions remain
* if a disposition precondition fails
  * set `{{blocker}}` to the failed disposition precondition
  * report the incomplete disposition preconditions
  * stop
* execute `{{event_exec}}`
* immediately start the merge/closure/disposition workflow, or record an explicit root denial
* mark the routine proof polls as complete in the goal
* in the goal, track only the disposition outcome, a denial, or a new drift
* record `event_exec`, the head, CI id, reviewer id/grade, discussion state, disposition owner, and authority in the lane ledger
* report to the root/parent
* if the disposition did not start and no root denial record exists
  * set `{{blocker}}` to `disposition neither started nor denied`
  * report the incomplete disposition action
  * stop
* after the disposition starts or the root denial record exists, stop

## Handle Ci Terminal State

* record the pipeline/check id, exact head, failed job names, retry/rerun availability, and next check time in the goal
* record `ci_state`, the exact head, affected proof scope, repair owner, and default-branch merge blocker state in the lane ledger
* if CI is terminal green
  * examine the reviews and discussions again for `DISPOSITION_READY`
  * if all disposition preconditions hold
    * [Handle Disposition Ready](#handle-disposition-ready)
* if CI is terminal fail
  * classify the work as source-health or CI-repair
  * if the failure blocks more than the default-branch merge
    * tell the owner to repair
  * after the CI-repair handoff, stop
* if the changed state enables disposition, blocks the assigned claim, needs authority, or changes the next owner
  * report the changed state
* after you record the CI terminal state and the next owner action, stop

## Handle Reviewer Verdict

* if the grade is `Proven`
  * keep the scoped verdict
  * examine whether the aggregate state creates `DISPOSITION_READY`
  * if all disposition preconditions hold
    * [Handle Disposition Ready](#handle-disposition-ready)
  * record the reviewer id/alias, grade, proof scope, head, target, findings, questions, and GitLab note/thread ids in the lane ledger
  * if the aggregate state change changes the next owner or disposition readiness
    * report it to the parent/root
  * after you record the proven reviewer verdict, stop
* if the grade is `Not ready`
  * send the implementer the exact remediation, or keep the GitLab thread unresolved
  * watch for a remediation acknowledgment within one watcher cycle
  * watch for a new reviewer grade after the repair
  * record the reviewer id/alias, grade, proof scope, head, target, findings, questions, and GitLab note/thread ids in the lane ledger
  * after you record the not-ready remediation handoff, stop
* report that the reviewer grade was neither Proven nor Not ready
* stop
