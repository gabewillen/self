<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Create MR Comment Watcher

* create or maintain an orchestrator-owned MDScript goal for every MR/PR an implementer hands to this orchestrator
* [Write Watcher Goal](#write-watcher-goal)

## Write Watcher Goal

* run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)
* resolve `{{goal_mdscript}}` from the watcher goal path written above
* do not call `automation_update` or any automation tool for project control-plane orchestration unless the user explicitly requests external automation
* set the goal's resume condition for MR/PR comments, discussions, review threads, system notes, CI changes, target drift, and agent-addressed handoffs
* include MR/PR link, lane id, implementer reporting path, known agent identities, referenced tickets, current head, `{{goal_mdscript}}`, and `/mdscript-exec {{goal_mdscript}}#resume-goal` in the goal state
* configure the goal to monitor new MR/PR comments, discussions, review threads, and system notes from implementation agents, review agents, leased reviewer identities, goal-resumed agents, or agent-addressed mentions
* [Verify Watcher Active](#verify-watcher-active)

## Verify Watcher Active

* verify `{{goal_mdscript}}` exists and names a resume heading
* verify the implementer-owned monitor goal is recorded in the lane ledger
* verify the orchestrator-owned comment watcher goal is recorded in the lane ledger
* if either goal is missing from the ledger
  * set `{{blocker}}` to the missing watcher goal record
  * [Repair Watcher Records](#repair-watcher-records)
* treat waiting checks as lane state unless the orchestrator is deciding whether to merge into the default branch
* do not treat CI/check state alone as a blocker for comment routing, implementation repair, review, non-default integration, or source-ready handoff
* [Resume Watcher On Comment](#resume-watcher-on-comment)

## Repair Watcher Records

* rewrite missing goal or ledger records for the implementer monitor and orchestrator comment watcher
* resolve `{{goal_mdscript}}` again from the watcher goal path
* [Verify Watcher Active](#verify-watcher-active)

## Resume Watcher On Comment

* give routine watcher resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`
* on routine wakeups, refresh live MR/PR comments, discussions, review threads, system notes, CI, target head, and ledger state
* execute only the changed hot-path action after refresh
* when the goal resume finds a new relevant comment
  * update the lane ledger with comment id, author, timestamp, summary, whether it asks for action, and exact owner
  * forward implementation or review-action comments to the implementer instead of resolving them in the orchestrator
* if the lane needs steering
  * run [Monitor Implementer Lane](monitor-implementer-lane.md#monitor-implementer-lane)
* if the comment changes merge, close, or ticket-closure state
  * run [Handle Merge Or Close Decision](merge-or-close-decision.md#handle-merge-or-close-decision)
* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)
