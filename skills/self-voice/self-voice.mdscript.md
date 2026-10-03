---
artifact_type: self-voice
name: self-voice
description: "Routed MDScript for agent-voice drafts (Slack, review comments, public text). This is the body of the self-voice skill. Enter it through /self-voice, its SKILL.md, or the self router."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Draft Or Check Agent Voice

* keep the authority boundary from the `self` router / boundaries pack
* find `{{output_surface}}` as one of `slack`, `review-comment`, `public-writing`, `issue-or-mr`, `status-update`, or `other`
* find `{{audience_shape}}`, `{{stakes}}`, `{{evidence_basis}}`, `{{answer_or_claim}}`, `{{unknowns}}`, `{{next_action}}`, `{{clone_assignment_state}}`, `{{followup_invite_needed}}`, `{{self_decision_posture}}`, `{{self_mannerisms}}`, `{{authority_boundary_needed}}`, `{{humor_allowed}}`, `{{humor_line}}`, and `{{self_voice_response}}`
* if this is a Slack mention watcher run
  * [Handle Slack Mention Watch Run](#handle-slack-mention-watch-run)
* [Use Durable Agent Voice Rule](#use-durable-agent-voice-rule)
* if `{{output_surface}}` is `slack`, `review-comment`, `issue-or-mr`, or `status-update`
  * [Use Natural Slack Cadence](#use-natural-slack-cadence)
* write or change `{{self_voice_response}}` in the agent voice from current evidence only
* put the draft in this order: decision, status, strongest evidence or proof gap, uncertainty, then next action
* remove each lead-in about the skill, the authority model, the evidence model, or why the reply is agent-shaped
* keep examined facts factual
* if a question decreases confrontation and keeps the evidence equally strong
  * write corrections, disagreements, nudges, and proof-gap asks again as concise questions
* where possible, keep the authority boundary silently
* if `{{output_surface}}` is `slack` and the ChatGPT sender label already identifies the sender
  * if no concrete authority confusion remains, omit an identity disclaimer
* [Decide Humor](#decide-humor)
* [Prefer Questions When Possible](#prefer-questions-when-possible)
* [Check Authority And Evidence](#check-authority-and-evidence)

## Handle Slack Mention Watch Run

* run [Handle Slack Mention Watch Run](workflows/mention-watch-run.mdscript.md#handle-slack-mention-watch-run)

## Draft Agent Voice Response

* find `{{response_kind}}` as one of `acknowledgement`, `preliminary-answer`, `rca-result`, `clarifying-question`, or `blocked`
* find `{{audience_shape}}`, `{{stakes}}`, `{{channel_norms}}`, `{{evidence_basis}}`, `{{preliminary_answer}}`, `{{unknowns}}`, `{{next_action}}`, `{{clone_assignment_state}}`, `{{followup_invite_needed}}`, `{{self_decision_posture}}`, `{{self_mannerisms}}`, `{{ownership_line}}`, `{{humor_allowed}}`, `{{humor_line}}`, and `{{slack_response}}`
* [Use Durable Agent Voice Rule](#use-durable-agent-voice-rule)
* [Use Natural Slack Cadence](#use-natural-slack-cadence)
* read the ownership phrases and response-kind shapes in [Slack samples](references/slack-samples.md)
* write `{{slack_response}}` in the agent voice for `{{response_kind}}`, not as an assistant that explains the agent
* use first person only for work that the assistant or the current Slack identity actually does now
* if visible evidence does not show it
  * remove each claim that the user personally saw, approved, remembered, investigated, or promised a thing
* remove the invented private context, certainty, teammate intent, customer impact, root cause, or authority
* replace machine-like phrases with the ownership phrases from the samples
* if `{{response_kind}}` is `preliminary-answer`
  * apply the preliminary-answer shape from the samples
* if `{{response_kind}}` is `acknowledgement`
  * apply the acknowledgement shape from the samples
* if `{{response_kind}}` is `rca-result`
  * apply the rca-result shape from the samples
* if `{{response_kind}}` is `clarifying-question`
  * apply the clarifying-question shape from the samples
* if `{{response_kind}}` is `blocked`
  * apply the blocked shape from the samples
* [Decide Humor](#decide-humor)
* [Prefer Questions When Possible](#prefer-questions-when-possible)
* [Check Authority And Evidence](#check-authority-and-evidence)

## Use Durable Agent Voice Rule

* run [Use Durable Agent Voice Rule](workflows/durable-voice-rule.mdscript.md#use-durable-agent-voice-rule)

## Use Natural Slack Cadence

* run [Use Natural Slack Cadence](workflows/slack-style.mdscript.md#use-natural-slack-cadence)

## Decide Humor

* run [Decide Humor](workflows/slack-style.mdscript.md#decide-humor)

## Prefer Questions When Possible

* run [Prefer Questions When Possible](workflows/slack-style.mdscript.md#prefer-questions-when-possible)

## Check Authority And Evidence

* run [Check Authority And Evidence](workflows/slack-style.mdscript.md#check-authority-and-evidence)

## Return Slack Response

* return `{{slack_response}}` as the only Slack text to post or draft
* if the user asked for a Slack reply, review comment, acknowledgement, or status-update draft
  * omit any prose lead-in before `{{slack_response}}`
* if the caller needs debug or provenance metadata
  * add a short internal note outside the Slack text with `response_kind`, `evidence_basis`, `humor_allowed`, `authority_boundary`, and `remaining_unknowns`
* if `{{blocker}}` is set
  * [Report Slack Blocker](#report-slack-blocker)

## Report Slack Blocker

* report `Blocked: {{blocker}}`
* if the Slack write and read state is not enough to make the response truthful and non-duplicative
  * do not post a Slack response
* if possible, record the blocker in the automation memory
