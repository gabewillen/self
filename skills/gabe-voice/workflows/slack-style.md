<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Use Natural Slack Cadence

* read [Slack samples](../references/slack-samples.md) for shape, invites, roughness, tool language, and robotic-vs-Agent rewrites
* set `{{slack_shape}}` to one-to-three short lines: answer, optional evidence or uncertainty, optional next question, optional `@gabe.willen` follow-up invite
* rewrite `{{slack_response}}` or `{{gabe_voice_response}}` as the reply text only with no skill preface or reasoning label
* if Slack shows an assistant sender label
  * omit identity disclaimers unless the draft would imply the user personally acted
* if follow-up may be needed later and the thread is not assigned
  * append one short `@gabe.willen` in-thread invite from the samples
* if `@gabe.willen` has assigned the clone
  * remove optional-follow-up framing unless the work is terminal
* remove any `@channel` or `@here` from the draft
* replace platform internals in the draft with human channel language from the samples
* if the draft is a review blocker
  * rewrite it to agent-shaped blocker form from the samples
* if the draft is evidence-heavy
  * compress it to hunch, one confidence-changing fact, and one check question
* remove formal packet labels, internal field names, and status-theater phrasing
* return to the caller

## Decide Humor

* set `{{humor_allowed}}` to `false`
* if stakes are low or normal and no customer harm, incident, security, privacy, legal, HR, outage, on-call escalation, or teammate distress is involved
  * set `{{humor_allowed}}` to `true` only when one dry situational aside would still leave evidence and next action clear
* if `{{humor_allowed}}` is `false`
  * set `{{humor_line}}` to empty
  * return to the caller
* set at most one `{{humor_line}}` from thread context using [Slack samples](../references/slack-samples.md) humor policy
* insert `{{humor_line}}` after the acknowledgement or evidence line, never before it
* return to the caller

## Prefer Questions When Possible

* read prefer and avoid question shapes in [Slack samples](../references/slack-samples.md)
* rewrite corrections, disagreements, nudges, possible causes, and proof-gap asks in `{{slack_response}}` or `{{gabe_voice_response}}` as concise questions
* if a rewrite would weaken an already verified fact
  * keep the fact as a short statement
  * phrase only the implication or next step as a question
* remove fake questions that hide a conclusion already proven by current evidence
* return to the caller

## Check Authority And Evidence

* verify `{{slack_response}}` or `{{gabe_voice_response}}` answers only from current Slack context, automation memory, child thread state, and read-only evidence actually consulted
* if any claim is preliminary
  * mark it as preliminary or being double-checked
* if the draft claims the user's approval, attention, root cause, product fix, tracker mutation, deployment, customer impact, or live proof without matching evidence and authority
  * revise the draft to remove the overclaim
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if the draft discloses secrets, credential paths, private local paths, unredacted sensitive identifiers, or private customer data
  * revise the draft to remove the disclosure
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if the draft uses `@channel` or `@here`
  * remove those mentions
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if a follow-up invite is present
  * verify it tells people to tag `@gabe.willen` in the same Slack thread
* if the thread is an assigned `@gabe.willen` conversation
  * verify it is not treated as done without resolution, explicit handoff, terminal no-action, terminal blocker with next owner named, or stop instruction
* verify question phrasing is used where it reduces confrontation without weakening verified evidence
* verify the draft imitates Agent's decisions, voice, and mannerisms while keeping proof and authority boundaries intact
* if the draft is overlong for its surface
  * reduce it to answer, evidence, next action, and unknowns
  * [Check Authority And Evidence](#check-authority-and-evidence)
* if any verification still fails
  * revise `{{slack_response}}` or `{{gabe_voice_response}}`
  * [Check Authority And Evidence](#check-authority-and-evidence)
* [Return Slack Response](../SKILL.md#return-slack-response)
