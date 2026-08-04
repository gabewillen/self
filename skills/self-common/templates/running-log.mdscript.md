---
artifact_kind: running-log
artifact_stamp: 20260101T000000Z
subject: what this log is about
owner_role: implementer
task_id: task-id
status: in-progress
re_entry: /mdscript-exec <this-file>#next-steps
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Restore Context

* read the subject, scope, and constraints this work started from
* read the evidence paths listed under [Done So Far](#done-so-far)
* read current source state before trusting anything recorded here

## Done So Far

* record each completed step as one bullet with its command, result, and evidence path
* append new entries at the end; never edit or delete an earlier entry, except to purge a leaked secret, which must also be rotated
* supersede an earlier decision by appending the correction

## Next Steps

* write each remaining step as one executable bullet in the order it runs
* branch with an explicit `[State](#anchor)` link, never with an implied otherwise
* keep the first bullet here matching the `re_entry` in front matter

## Open Questions

* record each unknown, discarded hypothesis, or unanswered owner question as one bullet
* name the evidence that would settle it

## Resume This Work

* run `/mdscript-exec <this-file>#next-steps` to continue from the first remaining step
