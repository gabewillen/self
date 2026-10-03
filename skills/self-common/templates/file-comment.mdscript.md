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

* state the event or decision that this comment records
* write all text in ASD-STE100, as the `mdscript-write` conventions tell you

## Evidence

* list the evidence, the artifact ids, and the command results for this comment

## Questions

* list the open questions
* if no open questions remain, stop

## Next

* do the next single action of the owner
* continue with `/mdscript-exec {{comment_file}}#next` or the entry point of the task or workflow that owns this comment

## Stop Report

* write `stop_reason=...`
* write `next_owner=...`
* if the lane is blocked
  * write `blocker=...`
* if the lane owns cleanup
  * write `cleanup_status=...`
* if a return script or a goal resume continues the lane
  * write `resume_command=...`
