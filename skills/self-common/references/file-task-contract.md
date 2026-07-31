# File task contract

Required shape for every durable lane task under
`~/.agents/projects/<project>/tasks/<task_id>.mdscript.md`.

## Path and naming

- Path: `~/.agents/projects/{{project_name}}/tasks/{{task_id}}.mdscript.md`
- `{{task_id}}` is stable, lowercase, and path-safe

## YAML front matter fields

| Field | Notes |
| --- | --- |
| `id` | Same as `{{task_id}}` |
| `title` | Human-readable lane title |
| `type` | `root-orchestrator`, `child-orchestrator`, `implementer`, `reviewer`, `goal`, or `decision` |
| `status` | `planned`, `active`, `blocked`, `reviewing`, `proven`, `done`, `paused`, `obsolete`, or `superseded` |
| `parent` | Parent task id, or empty for root |
| `owner_role` | `orchestrator`, `implementer`, `reviewer`, or other exact role |
| `lane_id` | Durable lane key |
| `claim_scope` | Typed proof claim for this task |
| `proof_path` | How the claim is proven |
| `source_of_truth` | Owner surface for this record |
| `created_at` | UTC timestamp |
| `updated_at` | UTC timestamp |

## Body requirements

- MDScript execution header immediately after YAML front matter
- Exact `##` state headings: `Objective`, `Contract`, `Current State`, `Evidence`, `Open Questions`, `Next Action`
- Inline labels or prose mentions do not satisfy the contract
- Under `## Next Action`: one discrete executable action plus an exact
  `/mdscript-exec <task-file>#<state>` continuation or an explicit stop
- Every failure, retry, recovery, and authority branch is an explicit MDScript
  state link or an explicit stop

## Role-specific body content

- Child orchestrator scopes: write a task for the child orchestrator itself; that
  child task owns its subtasks
- Implementer scopes: name exact DBC claim, preconditions, postconditions,
  invariants, proof path, local resource path, proof supplied, proof not claimed,
  and review gate

## Source of truth

Never treat chat history as the task source of truth when a file task exists.
