# Stop report fields

Write these only under `## Stop Report` in a file comment.

- **Stop reasons:** `done`, `blocked`, `paused`, `obsolete`, `interrupted`, `tool-failed`, `authority-boundary`, `context-limit`, `watcher-terminal`, `review-complete`
- **Every stop:** `stop_reason`, `next_owner` (`none` when no granted work remains)
- **When it applies:** `next_action`, `blocker`, `proof_decision`, `proof_supplied`, `proof_not_claimed`, `cleanup_status`, `resume_command`, `return_script` and the pending decision (when you ask for input), `resumed=true` (compaction resume), `review_round=start`
- **Terminal root:** `stop_reason=done`, `next_owner=none`, `proof_decision`, `proof_supplied`, `proof_not_claimed`, `remaining_authority_boundary`, `cleanup_status`, `blocker`
- **Child rollup:** `role: orchestrator`, `parent_visible: true`, scoped `proof_decision`, `stop_reason`, `next_owner` set to the parent, `proof_not_claimed`, `blocker`, `cleanup_status`
- For source-health rollups and final root stops, `proof_not_claimed` lists `merge-readiness`, `live-proof`, `issue-close-readiness`, `release-readiness`, `deployment-readiness`, and `publication` unless one was granted and proven.
