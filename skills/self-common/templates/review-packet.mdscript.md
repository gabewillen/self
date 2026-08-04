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
* do not read another lane's sign-off, the author's repair narrative, or any preferred verdict
* run this lane's entrypoint and answer [Open Questions](#open-questions)
* write findings to the `{{signoff_path}}` the composer supplied

## Claim Under Review

* state the claim in one bullet, as the author would have it accepted
* state `proof_scope`, `merge_target`, and the frozen commit or head under review

## In Scope

* list each in-scope path as one bullet
* list the diff artifact path that holds the change
* list the neutral supporting paths a lane may read to understand it

## Proof Supplied

* list each proof as one bullet with the exact command and its exit code
* never record a proof as passing unless its exit code was checked

## Proof Not Claimed

* list each gap this review does not close as one bullet
* name what evidence would close it

## Open Questions

* ask each falsification question as one bullet
* aim each at a way the claim could be wrong, not at confirming it

## Resume This Review

* run `/mdscript-exec <this-file>#review-this-change` to enter this round's review
