---
task_id: {{task_id}}
role: {{role}}
author: {{author}}
status: {{status}}
event_type: {{event_type}}
event_exec: {{event_exec}}
claim_scope: {{claim_scope}}
proof_decision: {{proof_decision}}
parent_visible: {{parent_visible}}
resolves: {{resolves}}
supersedes: {{supersedes}}
created_at: {{created_at}}
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Summary

* state the event or decision this comment records

## Evidence

* list the evidence, artifact ids, and command results for this comment

## Questions

* list open questions, or stop if none remain

## Next

* perform the next discrete owner action
* continue with `/mdscript-exec {{comment_file}}#next` or the owning task/workflow entry point

## Stop Report

* write `stop_reason=...`
* write `next_owner=...`
* write `blocker=...` when blocked
* write `cleanup_status=...` when cleanup ownership applies
* write `resume_command=...` when a return or goal resume continues the lane
