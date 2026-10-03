<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Watcher Control Plane

* load the `self`, `self-automate`, `slack`, `slack-outgoing-message`, `self-review`, and `self-voice` skills

* run [Resolve File Task Root](../../self-common/workflows/file-task-comments.mdscript.md#resolve-file-task-root)

* find `{{watched_channel}}`, `{{automation_memory}}`, `{{file_task_id}}`, `{{goal_mdscript}}`, `{{last_handled_slack_timestamp}}`, and `{{blocking_severity_threshold}}` in the saved automation contract

* if `{{blocking_severity_threshold}}` is empty, set it to these unresolved findings:
  * each finding that blocks the exact approval scope
  * each finding that is an agent-unacceptable maintainability smell

* use `{{automation_memory}}` as an operational observation log, not as the durable owner of the watcher state

* run [Read File Task Packet](../../self-common/workflows/file-task-comments.mdscript.md#read-file-task-packet)

* if the task or goal MDScript is missing, continue at [Repair Watcher Control Plane](#repair-watcher-control-plane)

* continue at [Acquire Router Lease](#acquire-router-lease)

## Repair Watcher Control Plane

* run [Ensure File Task](../../self-common/workflows/file-task-comments.mdscript.md#ensure-file-task)

* run [Write Goal MDScript](../../self-common/workflows/goal-mdscript.mdscript.md#write-goal-mdscript)

* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment)

* continue at [Load Watcher Control Plane](#load-watcher-control-plane)

## Acquire Router Lease

* read the tail of `{{automation_memory}}`

* if an unexpired `router_run_started` entry has no `router_run_finished` that matches it, continue at [Stop Quietly](#stop-quietly)

* append one `router_run_started` observation with a unique run id and an expiry about twenty minutes from now

* record the lease in the project lane ledger

* continue at [Reconcile In Flight Reviewer](#reconcile-in-flight-reviewer)

## Reconcile In Flight Reviewer

* find the reviewer records that have no later terminal result for the same artifact

* for each candidate, refresh these GitHub items:
  * the current replies, re-review requests, head SHA, and unresolved conversations
  * the review state, checks, conflicts, and mergeability

* if an in-flight reviewer still runs, continue at [Stop For In Flight Reviewer](#stop-for-in-flight-reviewer)

* if an in-flight reviewer is stale for about fifteen minutes, continue at [Refresh Stale Reviewer](#refresh-stale-reviewer)

* continue at [Scan Slack](#scan-slack)

## Stop For In Flight Reviewer

* append `skip_inflight_reviewer` to the observation log

* continue at [Finish Watcher Run](#finish-watcher-run)

## Refresh Stale Reviewer

* if the watcher sent a refresh in the last fifteen minutes, continue at [Stop Quietly](#stop-quietly)

* send one concise refresh message to the reviewer thread

* append `reviewer_refresh_sent` to the observation log

* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment)

* continue at [Finish Watcher Run](#finish-watcher-run)

## Scan Slack

* read `{{watched_channel}}` and the thread and reaction context for candidate review requests

* exclude bot-only merge notices, artifact-free bumps, and already-handled messages
* exclude messages that the current Slack identity already acknowledged

* choose the oldest actionable unhandled review request

* if no request exists, continue at [Stop Quietly](#stop-quietly)

* continue at [Create Reviewer Thread](#create-reviewer-thread)

## Create Reviewer Thread

* find the Codex project that owns the review artifact from the artifact and the Slack context

* before you create a reviewer thread, list the current Codex projects

* if the thread tools are not available after exact tool discovery, continue at [Report Watcher Blocker](#report-watcher-blocker)

* run [Select Configured Model And Reasoning](../../self-common/workflows/model-reasoning-contract.mdscript.md#select-configured-model-and-reasoning) with `{{self_role}}` set to `reviewer`

* create one reviewer thread with `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`

* tell the reviewer that it must use `self-review` for judgment and `self-voice` for public comments

* tell the reviewer that it must examine the current GitHub state on the exact head before it returns a verdict

* record the thread id, artifact, model fields, and parent reporting path in the lane ledger

* record `{{blocking_severity_threshold}}` in the watcher goal and the reviewer handoff

* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment)

* continue at [Evaluate Review Result](#evaluate-review-result)

## Evaluate Review Result

* read the current-head findings, proof decision, stop report, and cleanup state of the reviewer

* if any finding meets or exceeds `{{blocking_severity_threshold}}`, continue at [Post Blocking Result](#post-blocking-result)

* if a pack-unacceptable maintainability smell exists below the configured severity threshold, continue at [Post Blocking Result](#post-blocking-result)

* if a lower-severity finding is below `{{blocking_severity_threshold}}`, does not block the exact approval scope, and is not a pack-unacceptable smell
  * record it as nonblocking

* if the reviewer verdict is not `Proven` for the exact approval scope, continue at [Report Watcher Blocker](#report-watcher-blocker)

* refresh the GitHub head, replies, conversations, checks, conflicts, and mergeability

* if the reviewed head or gate state changed, continue at [Create Reviewer Thread](#create-reviewer-thread)

* continue at [Post Proven Result](#post-proven-result)

## Post Blocking Result

* post one concise agent-voice blocker sentence in the original Slack thread

* keep the blocking GitHub thread unresolved until the concern is fixed, withdrawn, or explicitly accepted as closed

* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment)

* continue at [Finish Watcher Run](#finish-watcher-run)

## Post Proven Result

* if the current authority allows it, submit GitHub approval on the exact reviewed head

* add the configured approval reaction to the original Slack request

* run [Add File Comment](../../self-common/workflows/file-task-comments.mdscript.md#add-file-comment)

* continue at [Finish Watcher Run](#finish-watcher-run)

## Report Watcher Blocker

* write the exact missing tool, access, project, source, or authority as a project comment MDScript

* if delivery is authorized
  * post one concise agent-voice blocker sentence and the smallest useful question in the original Slack thread

* continue at [Finish Watcher Run](#finish-watcher-run)

## Stop Quietly

* continue at [Finish Watcher Run](#finish-watcher-run)

## Finish Watcher Run

* append `router_run_finished` to the observation log

* change the watcher goal MDScript to include the next exact re-entry command

* record the changed state, blocker, deadline, or terminal status in a project comment MDScript

* report the stop state to the parent path

* stop
