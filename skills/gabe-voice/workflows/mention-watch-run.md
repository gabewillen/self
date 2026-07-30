<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Slack Mention Watch Run

* load the `gabe` skill and preserve the authority boundary

* load the Slack skill before reading Slack context

* load the Slack outgoing-message skill before any Slack write

* infer `{{mention_permalink}}`, `{{mention_channel}}`, `{{mention_ts}}`, `{{mention_author}}`, `{{thread_context}}`, `{{automation_memory_path}}`, `{{selected_project}}`, `{{preliminary_answer}}`, `{{evidence_basis}}`, `{{child_thread_id}}`, `{{pending_worktree_id}}`, `{{clone_assignment_state}}`, `{{communication_owner}}`, `{{gabe_dm_needed}}`, and `{{slack_response}}`

* if `{{automation_memory_path}}` is empty
  * set it to the memory file for the active Gabe Slack mention watcher automation record

* if Slack tools fail before returning mention data
  * set `{{blocker}}` to the exact Slack connector error
  * [Report Slack Blocker](../SKILL.md#report-slack-blocker)

* discover recent mentions with a small overlap from the last successful scan in `{{automation_memory_path}}`

* read the parent thread, relevant nearby channel context, replies, and reactions for each candidate mention

* treat an explicit `@gabe.willen` tag as assignment to Gabe's digital clone; the watcher automation becomes the same-thread communication owner and must stay on it until the Slack conversation or underlying objective is resolved, explicitly handed off, terminally blocked with the next owner/resource named, or stopped by Gabe/user

* ignore a candidate mention when Gabe, the current Slack user, ChatGPT, Codex, an automation, or another agent has already answered it after the mention and the memory state proves the conversation or objective is resolved

* do not ignore an assigned `@gabe.willen` thread merely because ChatGPT, Codex, or the watcher acknowledged it; if memory says `assigned_open`, `investigating`, `waiting_on_child`, `waiting_on_user`, or `needs_followup`, continue owning communication

* ignore a candidate mention already recorded in `{{automation_memory_path}}` as `conversation_resolved`, `objective_resolved`, duplicate, not actionable, explicitly handed off, terminally blocked, or stopped

* if it is unclear whether the mention has already been handled
  * do not post in Slack
  * record the mention as `needs_manual_review` with the permalink and uncertainty
  * stop

* choose the newest actionable unanswered mention only

* determine the likely owning Codex project from Slack text, channel, linked artifacts, and thread context

* prefer `voice-ai-monorepo` for cross-repository Voice AI, Newman, Oz, Shield, Cortext, ingress, runtime, or subtree-shaped issues

* prefer `voice-agent` only when the issue is clearly isolated to that service repository

* create one read-only Codex investigation thread for the selected project unless the mention is fully answered by current context and no double-check is useful

* when `{{clone_assignment_state}}` is assigned from `@gabe.willen`:
  * set `{{communication_owner}}` to the watcher automation
  * post the first acknowledgement or preliminary answer in the Slack thread
  * record `assigned_open` plus the child thread or pending worktree id in automation memory
  * on later runs, inspect the child thread or pending worktree before scanning unrelated mentions
  * post same-thread progress, blocker, clarifying question, or final answer when the child thread produces a useful state
  * keep communication ownership until the conversation or objective is resolved, terminally blocked with the next owner/resource named, explicitly handed off, or the user/Gabe says to stop

* if the issue belongs in a monorepo or subtree-shaped workspace
  * require the child thread to verify relevant subtrees against upstream before investigation
  * allow adding a missing local subtree or equivalent local import only as read-only source-freshness scaffolding

* [Draft Gabe Voice Response](../SKILL.md#draft-gabe-voice-response)

* post `{{slack_response}}` in the Slack thread or original conversation only after [Check Authority And Evidence](../SKILL.md#check-authority-and-evidence) passes

* send exactly one concise DM to Gabe with the mention permalink, selected project, preliminary answer if any, created thread id or pending worktree id, and that ChatGPT is checking the mention unless the same information is already visible in Gabe's DM

* append `{{automation_memory_path}}` with run timestamp, mention permalink, author, decision, `{{clone_assignment_state}}`, `{{communication_owner}}`, preliminary answer if any, Slack ack permalink if sent, Gabe DM permalink if sent, selected project, created Codex thread id or pending worktree id, and next expected owner
