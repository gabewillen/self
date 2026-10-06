<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Slack Mention Watch Run

* load the `self` skill
* keep the authority boundary
* before you read the Slack context, load the Slack skill
* before each Slack write, load the Slack outgoing-message skill
* find `{{mention_permalink}}`, `{{mention_channel}}`, `{{mention_ts}}`, `{{mention_author}}`, `{{thread_context}}`, `{{automation_memory_path}}`, `{{selected_project}}`, `{{preliminary_answer}}`, `{{evidence_basis}}`, `{{child_thread_id}}`, `{{pending_worktree_id}}`, `{{clone_assignment_state}}`, `{{communication_owner}}`, `{{self_dm_needed}}`, and `{{slack_response}}`
* if `{{automation_memory_path}}` is empty
  * set `{{automation_memory_path}}` to the memory file of the active automation record for the agent Slack mention watcher
* if Slack tools fail before they return mention data
  * set `{{blocker}}` to the exact Slack connector error
  * [Report Slack Blocker](../SKILL.md#report-slack-blocker)
* find recent mentions with a small overlap from the last successful scan in `{{automation_memory_path}}`
* for each candidate mention
  * read the parent thread, nearby channel context, replies, and reactions
* if a candidate has an explicit `@gabe.willen` tag
  * set `{{clone_assignment_state}}` to assigned
  * set `{{communication_owner}}` to the watcher automation
* if memory proves that a post-mention answer already resolved the conversation or objective
  * ignore that candidate
* if memory is `assigned_open`, `investigating`, `waiting_on_child`, `waiting_on_user`, or `needs_followup`
  * keep ownership of an assigned `@gabe.willen` thread
* if `{{automation_memory_path}}` records a candidate as one of these states, ignore that candidate:
  * `conversation_resolved`, `objective_resolved`, duplicate, or not actionable
  * explicitly handed off, terminally blocked, or stopped
* if it is not clear whether an agent already handled the mention
  * do not post to Slack for that mention
  * record the mention as `needs_manual_review` with the permalink and uncertainty
  * stop
* choose only the newest actionable unanswered mention
* find the likely Codex project that owns the issue from the Slack text, channel, linked artifacts, and thread context
* if the issue is cross-repository Voice AI, Newman, Oz, Shield, Cortext, ingress, runtime, or subtree-shaped
  * prefer `voice-ai-monorepo`
* if the issue is clearly isolated to the `voice-agent` service repository
  * prefer `voice-agent`
* if the current context does not fully answer the mention
  * create one read-only Codex investigation thread for the selected project
* if `{{clone_assignment_state}}` is assigned from `@gabe.willen`
  * [Own Assigned Mention Thread](#own-assigned-mention-thread)
* if the issue belongs in a monorepo or subtree-shaped workspace
  * tell the child thread that it must examine the relevant subtrees against upstream before the investigation
* [Draft Agent Voice Response](../SKILL.md#draft-agent-voice-response)
* post `{{slack_response}}` in the Slack thread or original conversation
* if the same information is not already visible in the DM of the user
  * send exactly one concise DM to the user with these items:
    * the mention permalink, the selected project, and the preliminary answer if one exists
    * the created thread or worktree id, and that ChatGPT examines the mention
* append one run record to `{{automation_memory_path}}` with these fields:
  * timestamp, permalink, author, decision, assignment, communication owner, and answers
  * the Slack and DM permalinks if sent, the project, the child id, and the next owner

## Own Assigned Mention Thread

* set `{{communication_owner}}` to the watcher automation
* record `assigned_open` and the child thread or pending worktree id in the automation memory
* on later runs, before you scan unrelated mentions, examine the child thread or pending worktree
* if the child thread makes a useful state
  * prepare a same-thread progress note, blocker, clarification question, or final answer for the draft
* keep communication ownership until one of these conditions occurs:
  * the conversation or objective is resolved
  * the work is terminally blocked, and the next owner or resource is named
  * the work is explicitly handed off, or the user says to stop
* return to the caller
