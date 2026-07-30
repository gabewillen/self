---
name: gabe-goal
description: >-
  Run a goal-driven MDScript loop until reproducible proof artifacts exist and
  gabe-review composes a Proven-for verdict with empty blocking findings.
  Enforces parallel subagent multitasking, append-only logs, immutable
  runs/<run_id>/ dirs, proof type by proof_kind, and MDScript-only run state.
  Use for /gabe-goal, /goal, or when the user wants a stricter goal loop than
  deprecated grind.
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Parse Goal

* set `{{skill_root}}` to this skill directory (directory containing this `SKILL.md`)
* set `{{repo_root}}` to the working repository root when present, otherwise the current workspace root
* set `{{goal_text}}` from `/gabe-goal …`, `/goal …`, `/grind …`, or the natural-language goal in the user request
* if `{{goal_text}}` is empty
  * ask the user for one clear goal sentence as `{{goal_text}}`
  * [Parse Goal](#parse-goal)
* set `{{orchestrator_model}}` to this chat's model slug
* run [Clarify Goal](workflows/clarify-goal.md#clarify-goal)

## Start Or Resume

* if the user message or injected context is executable MDScript (or ends with `mdscript-exec …/goal.mdscript.md#…`)
  * run that MDScript via the `mdscript-exec` skill starting at the named heading
  * do not start a new run
* else if an active run already exists for this conversation
  * set `{{goal_mdscript}}` from `active-run.json` / `{{run_dir}}/goal.mdscript.md`
  * execute `mdscript-exec {{goal_mdscript}}#resume-goal`
* else
  * run [Start Goal Run](workflows/start-goal-run.md#start-goal-run)
  * tell the user `{{goal_text}}`, `{{proof_kind}}`, `{{live_proof}}`, `{{run_id}}`, `{{run_dir}}`, and `{{goal_mdscript}}`
  * [Pursue Goal](#pursue-goal)

## Pursue Goal

* keep `{{run_dir}}/goal.mdscript.md` current — it is the durable tracker and stop-hook resume target
* set front-matter `resume_heading` to `pursue-goal` while implementing/proofing, `complete-goal` only when ready to finish, or `manual-stop` when blocked
* run [Pursue Iteration](workflows/pursue-iteration.md#pursue-iteration)
* run [Capture Artifacts](workflows/capture-artifacts.md#capture-artifacts)
* if artifacts or `{{primary_user_action}}` proof are incomplete
  * refresh `{{goal_mdscript}}` completion_gate notes from the current gaps
  * [Pursue Goal](#pursue-goal)
* run [Compose Gabe Review](workflows/compose-gabe-review.md#compose-gabe-review) which execs gabe-review triple adversarial blind (rules + security + completeness MDScripts)
* if any blind lane fails, gabe-review returns `Not ready for …`, or blocking findings remain
  * fix every blocking finding
  * refresh artifacts and `artifacts/manifest.json` when proof changed
  * delete stale `{{run_dir}}/review-verdict.json`
  * append a `review_rejected` line to `{{run_dir}}/progress.jsonl`
  * refresh `{{goal_mdscript}}` with the unioned findings and `resume_heading: pursue-goal`
  * [Pursue Goal](#pursue-goal)
* if gabe-review returns `Blocked for …` and the missing precondition cannot be stood up locally
  * [Manual Stop](#manual-stop)
* [Complete Goal](#complete-goal)

## Complete Goal

* verify `{{run_dir}}/review-verdict.json` exists from gabe-review with matching `goal` and `conversation_id`, grade/proof_decision starting with `Proven for`, empty `blocking_findings`, and `proof_supplied` / `artifact_paths` referencing run artifacts
* set front-matter `active: false` on `{{goal_mdscript}}`
* refresh `{{goal_mdscript}}` with `status: completed` and `resume_heading: complete-goal`
* update `{{session_dir}}/active-run.json` to mark the run inactive
* append `goal_completed` to `{{session_dir}}/session-log.jsonl` and `.cursor/goal/goal-log.jsonl`
* append `run_completed` to `{{run_dir}}/progress.jsonl`
* stop and report the completed goal, `{{run_dir}}`, `{{goal_mdscript}}`, artifact summary, and the gabe-review Proven-for verdict

## Stop Hook Resume

* treat a stop-hook MDScript message, `mdscript-exec …/goal.mdscript.md#…`, an active-goal MDScript context block, or an incomplete active run as a hard continue signal
* the stop hook rewrites `{{run_dir}}/goal.mdscript.md` with the current completion gate and ends the follow-up with `mdscript-exec {{goal_mdscript}}#pursue-goal` (or the saved `resume_heading`)
* execute that command with the `mdscript-exec` skill — restore variables from the run MDScript front matter, then continue at the named heading
* do real work this turn — never summary-only stop
* if the follow-up body is inline MDScript without a path, execute the inline workflow starting at `## Stop Hook Resume` / the linked run MDScript

## Manual Stop

* set front-matter `active: false` on `{{goal_mdscript}}` when the user stops the goal or an external blocker cannot be cleared
* refresh `{{goal_mdscript}}` with `status: stopped` or `blocked`, the blocker summary, and `resume_heading: manual-stop`
* append `goal_stopped` with the blocker summary to `{{run_dir}}/progress.jsonl` and both append-only logs
* stop and report progress, `{{run_dir}}`, `{{goal_mdscript}}`, and the blocker

## Anti Patterns

* do not start on a vague goal — clarify first
* do not write shared `.cursor/goal.json` — use `{{session_dir}}` / `{{run_dir}}` only
* do not write `goal.json` for new runs — `{{run_dir}}/goal.mdscript.md` front matter is the sole run-state source
* do not track the active goal only in prose — keep `{{run_dir}}/goal.mdscript.md` executable and current
* do not answer a stop-hook follow-up without `mdscript-exec` into the run MDScript heading it names
* do not invent a custom reviewer protocol outside `gabe-review` — compose its triple adversarial blind lanes
* do not accept completion without all three blind lane sign-offs (rules, security, completeness)
* do not self-author `review-verdict.json` Proven-for grades — only persist what gabe-review decided
* do not claim completion without on-disk artifacts and a gabe-review Proven-for verdict
* do not work solo-serially when parallel subagents can run
* do not truncate or rewrite append-only logs or overwrite artifact files
* do not reuse or delete prior `runs/<run_id>/` directories
