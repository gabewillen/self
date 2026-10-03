---
artifact_kind: review-packet
artifact_stamp: 20260101T000000Z
subject: what is under review
owner_role: reviewer
review_round: 1
blocking_severities: all findings
status: open
re_entry: /mdscript-exec <this-file>#review-this-change
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Review This Change

* read the claim in [Claim Under Review](#claim-under-review)
* read only the paths listed in [In Scope](#in-scope)
* do not read the sign-off of a different lane
* do not read the repair narrative of the author or a preferred verdict
* run the entrypoint of this lane
* answer [Open Questions](#open-questions)
* write the findings to the `{{signoff_path}}` that the composer gave

## Claim Under Review

* write all text in ASD-STE100, as the `mdscript-write` conventions tell you
* state the claim in one bullet, in the words that the author wants the reviewer to accept
* state `proof_scope`, `merge_target`, and the frozen commit or head under review

## In Scope

* list each in-scope path as one bullet
* list the path of the diff artifact that holds the change
* list the neutral support paths that a lane can read to understand the change

## Proof Supplied

* list each proof as one bullet with the exact command and its exit code
* if you did not examine the exit code of a proof, do not record that proof as a pass

## Proof Not Claimed

* list each gap this review does not close as one bullet
* name the evidence that can close the gap

## Open Questions

* ask each falsification question as one bullet
* aim each question at a possible error in the claim, not at a proof of the claim

## Resume This Review

* run `/mdscript-exec <this-file>#review-this-change` to enter this round's review
