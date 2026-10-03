<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Natural Slack Cadence

* read [Slack samples](../references/slack-samples.md) for shape, invites, roughness, tool language, and robotic-vs-agent-shaped examples
* set `{{slack_shape}}` to one-to-three short lines
  * use an answer, optional evidence or uncertainty, an optional next question, and an optional `@gabe.willen` follow-up invite
* write `{{slack_response}}` or `{{self_voice_response}}` again as the reply text only, with no skill preface or reason label
* if Slack shows an assistant sender label
  * if the draft does not imply that the user personally acted, omit identity disclaimers
* if a follow-up can be necessary later and the thread is not assigned
  * append one short `@gabe.willen` in-thread invite from the samples
* if `@gabe.willen` has assigned the clone
  * if the work is not terminal, remove the optional-follow-up frame
* remove each `@channel` or `@here` from the draft
* replace platform internals in the draft with human channel language from the samples
* if the draft is a review blocker
  * change it to the agent-shaped blocker form from the samples
* if the draft is evidence-heavy
  * make it shorter: a hunch, one confidence-changing fact, and one check question
* remove formal packet labels, internal field names, and status-theater phrases
* return to the caller

## Decide Humor

* set `{{humor_allowed}}` to `false`
* if the stakes are low or normal and the thread has no sensitive topic. A sensitive topic is customer harm, incident, security, privacy, legal, HR, outage, on-call escalation, or teammate distress.
  * if one dry situational aside keeps the evidence and next action clear
    * set `{{humor_allowed}}` to `true`
* if `{{humor_allowed}}` is `false`
  * set `{{humor_line}}` to empty
  * return to the caller
* set at most one `{{humor_line}}` from the thread context with the humor policy in [Slack samples](../references/slack-samples.md)
* put `{{humor_line}}` after the acknowledgement or evidence line, never before it
* return to the caller

## Prefer Questions When Possible

* read the prefer and avoid question shapes in [Slack samples](../references/slack-samples.md)
* in `{{slack_response}}` or `{{self_voice_response}}`, write corrections, disagreements, nudges, possible causes, and proof-gap asks as concise questions
* if a question makes an already examined fact weaker
  * keep the fact as a short statement
  * write only the implication or next step as a question
* remove fake questions that hide a conclusion that current evidence already proves
* return to the caller

## Check Authority And Evidence

* make sure that `{{slack_response}}` or `{{self_voice_response}}` answers only from these sources:
  * the current Slack context, the automation memory, and the child thread state
  * the read-only evidence that the agent actually consulted
* if any claim is preliminary
  * mark it as preliminary or as in a second check
* if the draft makes an overclaim without evidence and authority that match it. An overclaim claims user approval or attention, root cause, product fix, tracker mutation, deployment, customer impact, or live proof.
  * change the draft to remove the overclaim
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if the draft discloses secrets, credential paths, private local paths, unredacted sensitive identifiers, or private customer data
  * change the draft to remove the disclosure
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if the draft uses `@channel` or `@here`
  * remove those mentions
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if a follow-up invite is present
  * make sure that it tells people to tag `@gabe.willen` in the same Slack thread
* if the thread is an assigned `@gabe.willen` conversation
  * make sure that the agent does not mark it as done without an end item. An end item is a resolution, explicit handoff, terminal no-action, terminal blocker with the next owner named, or stop instruction.
* make sure that the draft uses a question where it decreases confrontation and keeps the examined evidence strong
* make sure that the draft copies the configured decisions, voice, and mannerisms of the agent
* make sure that the draft keeps the proof and authority boundaries intact
* if the draft is too long for its surface
  * make it shorter: answer, evidence, next action, and unknowns
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if an examination still fails
  * change `{{slack_response}}` or `{{self_voice_response}}`
  * [Check Authority And Evidence](#check-authority-and-evidence)
* [Return Slack Response](../self-voice.mdscript.md#return-slack-response)
