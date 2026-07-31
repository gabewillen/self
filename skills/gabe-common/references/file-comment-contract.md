# File comment contract

Required shape for append-only comments under
`~/.agents/projects/<project>/comments/<task_id>/`.

## Path and naming

- Directory: `~/.agents/projects/{{project_name}}/comments/{{task_id}}/`
- File name: `<timestamp>-<role>-<short-slug>.mdscript.md`
- Timestamp: UTC `YYYYMMDDTHHMMSSZ`

## YAML front matter fields

| Field | Notes |
| --- | --- |
| `task_id` | Owning task id |
| `role` | Author role for this comment |
| `author` | Exact reviewer or actor id when applicable |
| `status` | Comment status for the lane |
| `event_type` | Canonical event type when one applies |
| `event_exec` | Exact `/mdscript-exec ...#heading` for the event |
| `claim_scope` | Scoped claim this comment addresses |
| `proof_decision` | Proven / Not ready / blocked decision when applicable |
| `parent_visible` | `true` when the parent must act on this comment |
| `resolves` | Prior comment ids this comment resolves |
| `supersedes` | Prior comment ids this comment supersedes |
| `created_at` | UTC timestamp |

## Body requirements

- MDScript execution header immediately after YAML front matter
- Exact `##` state headings: `Summary`, `Evidence`, `Questions`, `Next`, `Stop Report`
- Under `## Next`: one discrete executable action plus an exact
  `/mdscript-exec <comment-file>#<state>` or owning task/workflow continuation
- Every question, decision, failure, retry, recovery, and authority branch is an
  explicit MDScript state link, return-script command, or explicit stop

## Required write occasions

Write a comment for every:

- delegation, handoff, reviewer grade, reviewer question, implementer answer
- fix response, unexpected input, blocker, stop report, final decision
- cleanup of a created chat thread, reviewer subagent, worker thread, or child
  orchestrator thread that is closed, archived, deleted, transferred, superseded,
  or blocked from cleanup

## History and sanitation

- Do not edit or delete prior comments to change history; add a new comment with
  `supersedes` or `resolves`
- Keep comments portable: repo-relative paths, stable task ids, command names,
  test names, and artifact ids only
- Never write home-directory paths, private endpoints, credentials, or tokens

## Resumability checkpoints

For long-running, multi-workstream, or goal-backed lanes:

1. After the goal file exists and before the next long phase or child fanout, add
   a parent-visible `context-limit` checkpoint even when the context window has
   not hard-failed. Stop report includes `stop_reason=context-limit`, current next
   owner, and `cleanup_status=...`.
2. After rebuilding state from the task file, comments directory, goal MDScript,
   and lane ledger, add a separate parent-visible `compaction-resume` comment.
   Stop report includes `resumed=true` and
   `resume_command=/mdscript-exec {{goal_mdscript}}#resume-goal`. Body names the
   task file, comments directory, goal MDScript, lane ledger, current next owner,
   and how to rebuild state from those files.

## Review-round start

Before starting a fresh blind review round, add a parent-visible non-reviewer
comment whose stop report includes `review_round=start`, the exact reviewer
authors or planned reviewer ids, the current proof command state, and any live
subagent or thread ids that must later be cleaned up.
