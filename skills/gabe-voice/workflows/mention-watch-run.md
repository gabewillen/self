<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Slack Mention Watch Run

* load the `gabe` skill and preserve the authority boundary
* load the Slack skill before reading Slack context
* load the Slack outgoing-message skill before any Slack write
* infer `{{mention_permalink}}`, `{{mention_channel}}`, `{{mention_ts}}`, `{{mention_author}}`, `{{thread_context}}`, `{{automation_memory_path}}`, `{{selected_project}}`, `{{preliminary_answer}}`, `{{evidence_basis}}`, `{{child_thread_id}}`, `{{pending_worktree_id}}`, `{{clone_assignment_state}}`, `{{communication_owner}}`, `{{gabe_dm_needed}}`, and `{{slack_response}}`
* if `{{automation_memory_path}}` is empty
  * set `{{automation_memory_path}}` to the memory file for the active agent Slack mention watcher automation record
* if Slack tools fail before returning mention data
  * set `{{blocker}}` to the exact Slack connector error
  * [Report Slack Blocker](../SKILL.md#report-slack-blocker)
* discover recent mentions with a small overlap from the last successful scan in `{{automation_memory_path}}`
* for each candidate mention
  * read the parent thread, nearby channel context, replies, and reactions
* if a candidate has an explicit `@gabe.willen` tag
  * set `{{clone_assignment_state}}` to assigned
  * set `{{communication_owner}}` to the watcher automation
* ignore a candidate when memory proves the conversation or objective is already resolved after a post-mention answer
* keep ownership of an assigned `@gabe.willen` thread when memory is `assigned_open`, `investigating`, `waiting_on_child`, `waiting_on_user`, or `needs_followup`
* ignore a candidate recorded in `{{automation_memory_path}}` as `conversation_resolved`, `objective_resolved`, duplicate, not actionable, explicitly handed off, terminally blocked, or stopped
* if it is unclear whether the mention has already been handled
  * leave Slack unposted for that mention
  * record the mention as `needs_manual_review` with the permalink and uncertainty
  * stop
* choose the newest actionable unanswered mention only
* determine the likely owning Codex project from Slack text, channel, linked artifacts, and thread context
* prefer `voice-ai-monorepo` for cross-repository Voice AI, Newman, Oz, Shield, Cortext, ingress, runtime, or subtree-shaped issues
* prefer `voice-agent` only when the issue is clearly isolated to that service repository
* if the mention is not fully answered by current context
  * create one read-only Codex investigation thread for the selected project
* if `{{clone_assignment_state}}` is assigned from `@gabe.willen`
  * [Own Assigned Mention Thread](#own-assigned-mention-thread)
* if the issue belongs in a monorepo or subtree-shaped workspace
  * require the child thread to verify relevant subtrees against upstream before investigation
* [Draft Agent Voice Response](../SKILL.md#draft-agent-voice-response)
* post `{{slack_response}}` in the Slack thread or original conversation
* if the same information is not already visible in the user's DM
  * send exactly one concise DM to the user with mention permalink, selected project, preliminary answer if any, created thread or worktree id, and that ChatGPT is checking the mention
* append one run record to `{{automation_memory_path}}` with timestamp, permalink, author, decision, assignment, communication owner, answers, Slack and DM permalinks if sent, project, child id, and next owner

## Own Assigned Mention Thread

* set `{{communication_owner}}` to the watcher automation
* record `assigned_open` plus the child thread or pending worktree id in automation memory
* on later runs, inspect the child thread or pending worktree before scanning unrelated mentions
* when the child thread produces a useful state, prepare same-thread progress, blocker, clarifying question, or final answer for drafting
* keep communication ownership until the conversation or objective is resolved, terminally blocked with the next owner or resource named, explicitly handed off, or the user says to stop
* return to the caller
