# gabe-goal contracts

Portable reference for the MDScript `gabe-goal` skill. Session layout matches the Cursor `goal` skill so existing hooks under `scripts/cursor-hooks/` remain usable.

## Paths

| Path | Rule |
|------|------|
| `.cursor/goal/goal-log.jsonl` | Project-wide append-only events |
| `.cursor/goal/sessions/<conversation_id>/` | One chat session |
| `session-log.jsonl` | Session append-only log |
| `active-run.json` | Pointer to current run |
| `runs/<run_id>/` | Immutable run directory |
| `runs/<run_id>/goal.json` | Active goal state |
| `runs/<run_id>/progress.jsonl` | Append-only iteration log |
| `runs/<run_id>/artifacts/**` | New timestamped files only |
| `runs/<run_id>/artifacts/manifest.json` | Reproduce map |
| `runs/<run_id>/review-packet.md` | Neutral blind packet |
| `runs/<run_id>/signoff-reviewer-{a,b,c}.json` | Reviewer-only sign-offs |

## goal.json

```json
{
  "active": true,
  "goal": "<one-sentence goal>",
  "conversation_id": "<chat id>",
  "run_id": "<runs/<run_id> name>",
  "proof_kind": "tui|ui|default",
  "live_proof": "required|optional",
  "primary_user_action": "<end-to-end path when live proof required>",
  "started_at": "<ISO-8601>"
}
```

## proof_kind

| Kind | Required proof |
|------|----------------|
| `tui` | Capture + live proof when required |
| `ui` | Image + live proof when required |
| `default` | Log; live proof when runtime/user path changes |

## manifest entry

```json
{
  "path": "artifacts/live/20260526T220000Z-action.txt",
  "kind": "log",
  "tier": "live",
  "reproduce": "<exact command>",
  "proves": "<what this proves about primary_user_action or goal>"
}
```

## Sign-off schema

```json
{
  "goal": "<exact goal>",
  "conversation_id": "<exact id>",
  "reviewer_id": "a|b|c",
  "signed_off": true,
  "verifier_summary": "≥40 chars covering attacks, rules, artifacts, empty p_findings",
  "evidence": ["≥2 items"],
  "commands_run": ["…"],
  "attack_attempts": ["≥2 items"],
  "p_findings": [],
  "rules_reviewed": ["AGENTS.md", "…"],
  "artifact_paths": ["…"],
  "objectives_checked": ["…"],
  "remaining_gaps": [],
  "signed_off_at": "<ISO-8601>"
}
```

### p_findings item

```json
{
  "severity": "P0|P1|P2|P3",
  "location": "file:line",
  "summary": "…",
  "contract": "…",
  "remediation": "…"
}
```

All P-levels block completion. Full consensus required: any fail or P-level finding clears all three sign-offs and forces a fresh triple review.

## Models

| Role | Model |
|------|-------|
| Orchestrator / workers | chat `orchestrator_model` |
| Reviewers A/B/C | `composer-2.5-fast` (composer-2.5) or closest equivalent |

## Cursor hooks (optional)

`scripts/cursor-hooks/` retains the original TypeScript hooks (`goal-lib.ts`, `goal-session-start.ts`, `goal-session-touch.ts`, `goal-stop.ts`) for Cursor Nightly hook wiring. MDScript execution does not require them, but stop-hook resume semantics in `SKILL.md#stop-hook-resume` match their behavior.
