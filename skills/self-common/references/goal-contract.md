# Goal MDScript contract

Required shape for orchestrator-owned goal files under
`~/.agents/projects/<project>/goals/<goal_id>.mdscript.md`.

## Path and naming

- Path: `~/.agents/projects/{{project_name}}/goals/{{goal_id}}.mdscript.md`
- Prefer `{{goal_id}}` shaped as `<task-id>-goal`

## YAML front matter fields

| Field | Notes |
| --- | --- |
| `id` | Same as `{{goal_id}}` |
| `task_id` | Owning task id |
| `owner_role` | Owner role for the goal lane |
| `status` | Active or terminal goal status |
| `claim_scope` | Scoped claim the goal tracks |
| `goal_type` | Goal kind for this lane |
| `source_of_truth` | Owner surface for the goal |
| `model` | Selected model for the lane |
| `reasoning` | Selected effort level |
| `model_selection_basis` | Why model and effort fit this task |
| `created_at` | UTC timestamp |
| `updated_at` | UTC timestamp |

## Body requirements

- Exact execution header matching the pack's standard MDScript header comment
  (the `mdscript` comment that requires mdscript-exec or the published spec)
- Every heading is a `##` state, never `#`
- Required states: `## Goal Contract`, `## Resume Goal`, `## Hot Path`, `## Stop`
- Each state body uses executable bullets with one discrete action per bullet
- Every branch, retry, and recovery path is an explicit `[State](#anchor)` link
- Do not write goal states as prose paragraphs

## Content that must appear in the goal

- Objective, scoped done state, source of truth, parent reporting path
- Claim scope, contract preconditions, postconditions, invariants
- Proof path, local resource path, lane ledger keys
- `model`, `reasoning`, `model_selection_basis`
- Exact role continuation jumps and exact event `event_exec` values
- Stop/report conditions and authority boundaries
- When a prompt may pause for authority input: pending decision field,
  `{{return_script}}`, `{{return_resume_command}}`, and the caller heading that
  resumes after the answer
- Cleanup ownership for created chat threads, child threads, reviewer threads,
  worker threads, and subagents when the lane may create them

## Ownership rules

- Every active `root-orchestrator` and `child-orchestrator` task needs a matching
  goal MDScript before implementer lanes or resumability claims
- When a parent fanout creates multiple child-orchestrator tasks in one pass,
  create child goal files in the same pass before any child implementer work
- Goals are the durable re-entry surface; do not require orchestrator-owned
  automations for project control-plane lanes unless the user explicitly asks
- If a goal API exists, mirror the objective only after the project goal file
  exists; the file remains source of truth

## Resume command

`/mdscript-exec {{goal_mdscript}}#resume-goal` must resolve to a real `## Resume Goal`
state before reporting the lane resumable.
