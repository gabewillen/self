<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Watcher Control Plane

* load the `gabe`, `gabe-automate`, `slack`, `slack-outgoing-message`, `gabe-review`, and `gabe-voice` skills

* run [Resolve File Task Root](../../gabe-common/workflows/file-task-comments.md#resolve-file-task-root)

* infer `{{watched_channel}}`, `{{automation_memory}}`, `{{file_task_id}}`, `{{goal_mdscript}}`, `{{last_handled_slack_timestamp}}`, and `{{blocking_severity_threshold}}` from the saved automation contract

* if `{{blocking_severity_threshold}}` is empty, set it to every unresolved finding that blocks the exact approval scope or is an agent-unacceptable maintainability smell

* treat `{{automation_memory}}` as an operational observation log, not as the durable owner of watcher state

* run [Read File Task Packet](../../gabe-common/workflows/file-task-comments.md#read-file-task-packet)

* if the task or goal MDScript is missing, continue at [Repair Watcher Control Plane](#repair-watcher-control-plane)

* continue at [Acquire Router Lease](#acquire-router-lease)

## Repair Watcher Control Plane

* run [Ensure File Task](../../gabe-common/workflows/file-task-comments.md#ensure-file-task)

* run [Write Goal MDScript](../../gabe-common/workflows/goal-mdscript.md#write-goal-mdscript)

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment)

* continue at [Load Watcher Control Plane](#load-watcher-control-plane)

## Acquire Router Lease

* read the tail of `{{automation_memory}}`

* if an unexpired `router_run_started` entry has no matching `router_run_finished`, continue at [Stop Quietly](#stop-quietly)

* append one `router_run_started` observation with a unique run id and an expiry about twenty minutes in the future

* record the lease in the project lane ledger

* continue at [Reconcile In Flight Reviewer](#reconcile-in-flight-reviewer)

## Reconcile In Flight Reviewer

* identify reviewer records without a later terminal result for the same artifact

* refresh current GitHub replies, re-review requests, head SHA, unresolved conversations, review state, checks, conflicts, and mergeability for each candidate

* if an in-flight reviewer is still running, continue at [Stop For In Flight Reviewer](#stop-for-in-flight-reviewer)

* if an in-flight reviewer is stale for about fifteen minutes, continue at [Refresh Stale Reviewer](#refresh-stale-reviewer)

* continue at [Scan Slack](#scan-slack)

## Stop For In Flight Reviewer

* append `skip_inflight_reviewer` to the observation log

* continue at [Finish Watcher Run](#finish-watcher-run)

## Refresh Stale Reviewer

* if a refresh was sent within fifteen minutes, continue at [Stop Quietly](#stop-quietly)

* send one concise refresh message to the reviewer thread

* append `reviewer_refresh_sent` to the observation log

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment)

* continue at [Finish Watcher Run](#finish-watcher-run)

## Scan Slack

* read `{{watched_channel}}` and the thread and reaction context for candidate review requests

* exclude bot-only merge notices, artifact-free bumps, already-handled messages, and messages already acknowledged by the current Slack identity

* choose the oldest actionable unhandled review request

* if no request exists, continue at [Stop Quietly](#stop-quietly)

* continue at [Create Reviewer Thread](#create-reviewer-thread)

## Create Reviewer Thread

* infer the owning Codex project from the review artifact and Slack context

* list current Codex projects before creating a reviewer thread

* if thread tooling is unavailable after exact tool discovery, continue at [Report Watcher Blocker](#report-watcher-blocker)

* run [Select Configured Model And Reasoning](../../gabe-common/workflows/model-reasoning-contract.md#select-configured-model-and-reasoning) with `{{gabe_role}}` set to `reviewer`

* create one reviewer thread with `model: {{required_model}}`, `reasoning: {{required_reasoning}}`, and `model_selection_basis: {{model_selection_basis}}`

* require the reviewer to use `gabe-review` for judgment and `gabe-voice` for public comments

* require the reviewer to inspect current GitHub state on the exact head before returning a verdict

* record the thread id, artifact, model fields, and parent reporting path in the lane ledger

* record `{{blocking_severity_threshold}}` in the watcher goal and reviewer handoff

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment)

* continue at [Evaluate Review Result](#evaluate-review-result)

## Evaluate Review Result

* read the reviewer's current-head findings, proof decision, stop report, and cleanup state

* if any finding meets or exceeds `{{blocking_severity_threshold}}`, continue at [Post Blocking Result](#post-blocking-result)

* if any pack-unacceptable maintainability smell exists below the configured severity threshold, continue at [Post Blocking Result](#post-blocking-result)

* record lower-severity findings below `{{blocking_severity_threshold}}` as nonblocking only when they do not block the exact approval scope and are not pack-unacceptable smells

* if the reviewer verdict is not `Proven` for the exact approval scope, continue at [Report Watcher Blocker](#report-watcher-blocker)

* refresh GitHub head, replies, conversations, checks, conflicts, and mergeability

* if the reviewed head or gate state changed, continue at [Create Reviewer Thread](#create-reviewer-thread)

* continue at [Post Proven Result](#post-proven-result)

## Post Blocking Result

* post one concise agent-voice blocker sentence in the original Slack thread

* keep the blocking GitHub thread unresolved until the concern is fixed, withdrawn, or explicitly accepted as closed

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment)

* continue at [Finish Watcher Run](#finish-watcher-run)

## Post Proven Result

* submit GitHub approval on the exact reviewed head when current authority allows it

* add the configured approval reaction to the original Slack request

* run [Add File Comment](../../gabe-common/workflows/file-task-comments.md#add-file-comment)

* continue at [Finish Watcher Run](#finish-watcher-run)

## Report Watcher Blocker

* write the exact missing tool, access, project, source, or authority as a project comment MDScript

* post one concise agent-voice blocker sentence and the smallest useful question in the original Slack thread when delivery is authorized

* continue at [Finish Watcher Run](#finish-watcher-run)

## Stop Quietly

* continue at [Finish Watcher Run](#finish-watcher-run)

## Finish Watcher Run

* append `router_run_finished` to the observation log

* update the watcher goal MDScript with the next exact re-entry command

* record changed state, blocker, deadline, or terminal status in a project comment MDScript

* report the stop state to the parent path

* stop
