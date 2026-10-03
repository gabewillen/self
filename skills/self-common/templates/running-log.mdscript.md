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

* read the subject, the scope, and the constraints at the start of this work
* read the evidence paths in [Done So Far](#done-so-far)
* read the current source state before you trust a record in this file

## Done So Far

* record each completed step as one bullet with its command, its result, and its evidence path
* append new entries at the end
* do not edit or delete an earlier entry
* if an entry leaked a secret, purge the secret and rotate it
* to replace an earlier decision, append the correction

## Next Steps

* write each remaining step as one executable bullet in the order that it runs
* write the steps in ASD-STE100, as the `mdscript-write` conventions tell you
* branch with an explicit `[State](#anchor)` link, not with an implied otherwise
* make sure that the first bullet here agrees with the `re_entry` in the front matter

## Open Questions

* record each unknown, each discarded hypothesis, and each open question of the owner as one bullet
* name the evidence that can answer it

## Resume This Work

* run `/mdscript-exec <this-file>#next-steps` to continue from the first remaining step
