# Lane ledger fields

One JSON object per lane-state change in `~/.agents/projects/<project>/lane-ledger.jsonl`.

- **Always:** `time`, `lane_id`, `task_id`, `parent_task_id`, `owner_role`, `phase`, `status`, `event_type`, `event_exec`, `claim_scope`, `proof_decision`, `next_action`, `next_owner`, `blocker`, `comment_file`
- **When known:** `thread_id`, `thread_title`, `parent_reporting_path`, `gitlab_sudo_alias`, `issue_or_mr`, `stop_reason`, `last_stop_report`, `proof_path`, `goal_mdscript`, `mdscript_reentry`, `return_script`, `cleanup_status`, `cleanup_blocker`, `model`, `reasoning`
