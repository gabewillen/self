<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Create MR Comment Watcher

* create or maintain an orchestrator-owned MDScript goal for every MR/PR an implementer hands to this orchestrator

* before claiming the watcher is active
  * run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)
  * do not call `automation_update` or any automation tool for project control-plane orchestration unless the user explicitly requests external automation

* set the goal's resume condition for MR/PR comments, discussions, review threads, system notes, CI changes, target drift, and agent-addressed handoffs

* treat waiting checks as lane state unless the orchestrator is deciding whether to merge into the default branch

* do not treat CI/check state alone as a blocker for comment routing, implementation repair, review, non-default integration, or source-ready handoff

* configure the goal to monitor new MR/PR comments, discussions, review threads, and system notes from implementation agents, review agents, leased reviewer identities, goal-resumed agents, or agent-addressed mentions

* include MR/PR link, lane id, implementer reporting path, known agent identities, referenced tickets, current head, `{{goal_mdscript}}`, and the chosen `/mdscript-exec {{goal_mdscript}}#resume-goal` command in the goal state

* give routine watcher resumes `/mdscript-exec {{goal_mdscript}}#resume-goal`

* routine wakeups should refresh live MR/PR comments, discussions, review threads, system notes, CI, target head, and ledger state, then execute only the changed hot-path action

* when the goal resume finds a new relevant comment
  * update the lane ledger with comment id, author, timestamp, summary, whether it asks for action, and exact owner
  * forward implementation or review-action comments to the implementer instead of resolving them in the orchestrator
  * use `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/monitor-implementer-lane.md#monitor-implementer-lane` when the lane needs steering
  * use `/mdscript-exec {{repo_root}}/skills/gabe-orchestrate/workflows/merge-or-close-decision.md#handle-merge-or-close-decision` when the comment changes merge, close, or ticket-closure state

* do not count an implementer-handoff MR/PR as watched until both the implementer-owned monitor goal and orchestrator-owned comment watcher goal are recorded in the lane ledger

* run [Report Status](../../gabe-common/workflows/report-boundary.md#report-status)
