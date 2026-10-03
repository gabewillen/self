<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create MR Comment Watcher

* for each MR/PR that an implementer gives to this orchestrator, create or maintain an orchestrator-owned MDScript goal
* [Write Watcher Goal](#write-watcher-goal)

## Write Watcher Goal

* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)
* set `{{goal_mdscript}}` to the watcher goal path that you wrote
* if the user does not explicitly ask for external automation
  * do not call `automation_update` or an automation tool for project control-plane orchestration
* set the resume condition of the goal for these events:
  * MR/PR comments, discussions, review threads, and system notes
  * CI changes, target drift, and agent-addressed handoffs
* put these items in the goal state:
  * the MR/PR link, lane id, implementer reporting path, known agent identities, referenced tickets, and current head
  * `{{goal_mdscript}}` and `/mdscript-exec {{goal_mdscript}}#resume-goal`
* configure the goal to monitor new MR/PR comments, discussions, review threads, and system notes from these sources:
  * implementation agents, review agents, leased reviewer identities, and goal-resumed agents
  * agent-addressed mentions
* [Verify Watcher Active](#verify-watcher-active)

## Verify Watcher Active

* make sure that `{{goal_mdscript}}` exists and names a resume heading
* make sure that the lane ledger records the implementer-owned monitor goal
* make sure that the lane ledger records the orchestrator-owned comment watcher goal
* if the ledger does not have one of these goals
  * set `{{blocker}}` to the missing watcher goal record
  * [Repair Watcher Records](#repair-watcher-records)
* if the orchestrator does not decide on a merge into the default branch
  * treat checks that wait as lane state
* do not use the CI/check state alone to block comment routes, implementation repair, or review
* do not use the CI/check state alone to block non-default integration or source-ready handoff
* [Resume Watcher On Comment](#resume-watcher-on-comment)

## Repair Watcher Records

* write the missing goal or ledger records again for the implementer monitor and the orchestrator comment watcher
* set `{{goal_mdscript}}` again to the watcher goal path
* [Verify Watcher Active](#verify-watcher-active)

## Resume Watcher On Comment

* give routine watcher resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`
* at routine wakeups, refresh the live MR/PR comments, discussions, review threads, system notes, CI, target head, and ledger state
* after the refresh, execute only the changed hot-path action
* when the goal resume finds a new relevant comment
  * record the comment id, author, timestamp, summary, action request, and exact owner in the lane ledger
  * send implementation or review-action comments to the implementer
  * do not resolve these comments in the orchestrator
* if the lane needs a steer
  * run [Monitor Implementer Lane](monitor-implementer-lane.mdscript.md#monitor-implementer-lane)
* if the comment changes the merge, close, or ticket-closure state
  * run [Handle Merge Or Close Decision](merge-or-close-decision.mdscript.md#handle-merge-or-close-decision)
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)
