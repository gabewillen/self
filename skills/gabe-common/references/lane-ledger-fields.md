# Lane ledger fields

Append one JSON object per lane-state change to
`~/.agents/projects/{{project_name}}/lane-ledger.jsonl`.

## Required JSON keys for file-lane ledger rows

`time`, `lane_id`, `task_id`, `parent_task_id`, `owner_role`, `phase`, `status`,
`event_type`, `event_exec`, `claim_scope`, `proof_decision`, `next_action`,
`next_owner`, `blocker`, `comment_file`

## Expanded durable lane record fields

When maintaining the full lane ledger, also retain:

`thread_id`, `thread_title`, `parent_agent`, `parent_reporting_path`,
`gitlab_sudo_alias`, `repository_or_system`, `issue_or_mr`, `referenced_tickets`,
`agent_identities`, `event_deadline`, `stop_reason`, `last_stop_report`,
contract preconditions, postconditions, invariants, proof path, local resource
path, proof decision, proof supplied, proof not claimed, `next_proof`,
`next_check_time`, `goal_id`, `goal_mdscript`, `context_snapshot`,
`mdscript_reentry`, `return_script`, `return_resume_command`, `pending_exec_jump`,
`reporting_path`, `cleanup_status`, `cleanup_blocker`

## Incomplete ledger rules

Treat the ledger as incomplete when an active lane lacks owner, parent, status,
proof path, next action, reporting path, or parent-visible stop report.

Treat the ledger as incomplete when a terminal, paused, obsolete, blocked,
interrupted, goal-terminal, or closed lane lacks `last_stop_report`.

Treat the ledger as incomplete when a terminal or superseded lane has a created
`thread_id` and lacks `cleanup_status`.
