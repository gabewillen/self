---
name: self-voice
description: "ALWAYS use this skill when drafting or checking Slack replies, mention acknowledgements, preliminary answers, review comments, public-writing voice checks, or any response that should sound like the configured agent voice: imitate decisions, voice, humor, and cadence from current evidence while preserving authority boundaries and never pretending the user personally acted."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Draft Or Check Agent Voice

* load the `self` skill and preserve the authority boundary
* infer `{{output_surface}}` as one of `slack`, `review-comment`, `public-writing`, `issue-or-mr`, `status-update`, or `other`
* infer `{{audience_shape}}`, `{{stakes}}`, `{{evidence_basis}}`, `{{answer_or_claim}}`, `{{unknowns}}`, `{{next_action}}`, `{{clone_assignment_state}}`, `{{followup_invite_needed}}`, `{{self_decision_posture}}`, `{{self_mannerisms}}`, `{{authority_boundary_needed}}`, `{{humor_allowed}}`, `{{humor_line}}`, and `{{self_voice_response}}`
* if this is a Slack mention watcher run
  * [Handle Slack Mention Watch Run](#handle-slack-mention-watch-run)
* [Use Durable Agent Voice Rule](#use-durable-agent-voice-rule)
* if `{{output_surface}}` is `slack`, `review-comment`, `issue-or-mr`, or `status-update`
  * [Use Natural Slack Cadence](#use-natural-slack-cadence)
* draft or revise `{{self_voice_response}}` from current evidence only in the agent voice
* order the draft as decision, status, strongest evidence or proof gap, uncertainty, then next action
* remove any lead-in about the skill, authority model, evidence model, or why the reply is agent-shaped
* keep verified facts factual
* rewrite corrections, disagreements, nudges, and proof-gap asks as concise questions when that reduces confrontation without weakening evidence
* preserve the authority boundary silently wherever possible
* if `{{output_surface}}` is `slack` and the ChatGPT sender label already identifies the sender
  * omit an identity disclaimer unless a concrete authority misunderstanding remains
* [Decide Humor](#decide-humor)
* [Prefer Questions When Possible](#prefer-questions-when-possible)
* [Check Authority And Evidence](#check-authority-and-evidence)

## Handle Slack Mention Watch Run

* run [Handle Slack Mention Watch Run](workflows/mention-watch-run.md#handle-slack-mention-watch-run)

## Draft Agent Voice Response

* infer `{{response_kind}}` as one of `acknowledgement`, `preliminary-answer`, `rca-result`, `clarifying-question`, or `blocked`
* infer `{{audience_shape}}`, `{{stakes}}`, `{{channel_norms}}`, `{{evidence_basis}}`, `{{preliminary_answer}}`, `{{unknowns}}`, `{{next_action}}`, `{{clone_assignment_state}}`, `{{followup_invite_needed}}`, `{{self_decision_posture}}`, `{{self_mannerisms}}`, `{{ownership_line}}`, `{{humor_allowed}}`, `{{humor_line}}`, and `{{slack_response}}`
* [Use Durable Agent Voice Rule](#use-durable-agent-voice-rule)
* [Use Natural Slack Cadence](#use-natural-slack-cadence)
* read ownership phrases and response-kind shapes in [Slack samples](references/slack-samples.md)
* write `{{slack_response}}` in the agent voice for `{{response_kind}}`, not as an assistant explaining the agent
* use first person only for work the assistant or current Slack identity is actually doing now
* remove claims that the user personally saw, approved, remembered, investigated, or promised anything unless visible evidence shows that
* remove invented private context, certainty, teammate intent, customer impact, root cause, or authority
* replace machine-like phrases with ownership phrases from the samples
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

* run [Use Durable Agent Voice Rule](workflows/durable-voice-rule.md#use-durable-agent-voice-rule)

## Use Natural Slack Cadence

* run [Use Natural Slack Cadence](workflows/slack-style.md#use-natural-slack-cadence)

## Decide Humor

* run [Decide Humor](workflows/slack-style.md#decide-humor)

## Prefer Questions When Possible

* run [Prefer Questions When Possible](workflows/slack-style.md#prefer-questions-when-possible)

## Check Authority And Evidence

* run [Check Authority And Evidence](workflows/slack-style.md#check-authority-and-evidence)

## Return Slack Response

* return `{{slack_response}}` as the only Slack text to post or draft
* if the user asked for a Slack reply, review comment, acknowledgement, or status-update draft
  * omit any prose lead-in before `{{slack_response}}`
* if the caller needs debug or provenance metadata
  * include a short internal note outside the Slack text with `response_kind`, `evidence_basis`, `humor_allowed`, `authority_boundary`, and `remaining_unknowns`
* if `{{blocker}}` is set
  * [Report Slack Blocker](#report-slack-blocker)

## Report Slack Blocker

* report `Blocked: {{blocker}}`
* do not post a Slack response unless Slack write and read state is sufficient to make the response truthful and non-duplicative
* record the blocker in the automation memory when possible
