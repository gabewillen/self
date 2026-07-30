---
name: gabe-goal
description: >-
  Run a goal-driven MDScript loop until reproducible proof artifacts exist and
  three adversarial blind reviewer subagents sign off after failing to prove the
  changes broken or AGENTS.md-violating, with every P-level finding resolved.
  Enforces parallel subagent multitasking, append-only logs, immutable
  runs/<run_id>/ dirs, and proof type by proof_kind. Use for /gabe-goal, /goal,
  or when the user wants a stricter goal loop than deprecated grind.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Parse Goal

* set `{{skill_root}}` to this skill directory (directory containing this `SKILL.md`)
* set `{{repo_root}}` to the working repository root when present, otherwise the current workspace root
* set `{{goal_text}}` from `/gabe-goal …`, `/goal …`, `/grind …`, or the natural-language goal in the user request
* if `{{goal_text}}` is empty
  * ask the user for one clear goal sentence as `{{goal_text}}`
  * [Parse Goal](#parse-goal)
* set `{{reviewer_model}}` to `composer-2.5-fast` when available, otherwise the closest composer-class equivalent
* set `{{orchestrator_model}}` to this chat's model slug
* run [Clarify Goal](workflows/clarify-goal.md#clarify-goal)

## Start Or Resume

* run [Start Goal Run](workflows/start-goal-run.md#start-goal-run)
* tell the user `{{goal_text}}`, `{{proof_kind}}`, `{{live_proof}}`, `{{run_id}}`, and `{{run_dir}}`
* [Pursue Goal](#pursue-goal)

## Pursue Goal

* run [Pursue Iteration](workflows/pursue-iteration.md#pursue-iteration)
* run [Capture Artifacts](workflows/capture-artifacts.md#capture-artifacts)
* if artifacts or `{{primary_user_action}}` proof are incomplete
  * [Pursue Goal](#pursue-goal)
* run [Adversarial Triple Review](workflows/adversarial-triple-review.md#adversarial-triple-review)
* if any reviewer failed, reported P-level findings, or consensus is incomplete
  * fix every finding from all reviewers
  * refresh artifacts and `artifacts/manifest.json` when proof changed
  * delete `{{run_dir}}/signoff-reviewer-a.json`, `signoff-reviewer-b.json`, and `signoff-reviewer-c.json`
  * append a `review_rejected` line to `{{run_dir}}/progress.jsonl`
  * [Pursue Goal](#pursue-goal)
* [Complete Goal](#complete-goal)

## Complete Goal

* verify all three sign-offs exist under `{{run_dir}}` with matching `goal` and `conversation_id`, `signed_off: true`, `p_findings: []`, empty `remaining_gaps`, ≥2 `evidence` items, ≥2 `attack_attempts`, non-empty `commands_run`, `rules_reviewed`, `artifact_paths`, and `objectives_checked`
* set `"active": false` in `{{run_dir}}/goal.json`
* update `{{session_dir}}/active-run.json` to mark the run inactive
* append `goal_completed` to `{{session_dir}}/session-log.jsonl` and `.cursor/goal/goal-log.jsonl`
* append `run_completed` to `{{run_dir}}/progress.jsonl`
* stop and report the completed goal, `{{run_dir}}`, artifact summary, and that A/B/C signed off with empty `p_findings`

## Stop Hook Resume

* treat `[Goal iteration N]`, `Active goal session (incomplete)`, or an incomplete active run as a hard continue signal
* load `{{session_dir}}` and `{{run_dir}}` from injected goal context or `.cursor/goal/sessions/{{conversation_id}}/active-run.json`
* do real work this turn — never summary-only stop
* [Pursue Goal](#pursue-goal)

## Manual Stop

* set `"active": false` in `{{run_dir}}/goal.json` when the user stops the goal or an external blocker cannot be cleared
* append `goal_stopped` with the blocker summary to `{{run_dir}}/progress.jsonl` and both append-only logs
* stop and report progress, `{{run_dir}}`, and the blocker

## Anti Patterns

* do not start on a vague goal — clarify first
* do not write shared `.cursor/goal.json` — use `{{session_dir}}` / `{{run_dir}}` only
* do not sign off on your own work — only reviewer subagents write `signoff-reviewer-*.json`
* do not spawn fewer than three adversarial blind reviewers
* do not keep a passing sign-off after another reviewer fails — clear all three and re-review
* do not feed reviewers a preferred verdict or treat worker narrative as truth
* do not allow any `P0`–`P3` finding to remain
* do not claim completion without on-disk artifacts and live proof when required
* do not work solo-serially when parallel subagents can run
* do not truncate or rewrite append-only logs or overwrite artifact files
* do not reuse or delete prior `runs/<run_id>/` directories
