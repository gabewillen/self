---
name: gabe-goal
description: "ALWAYS use this skill when running a goal loop (/goal or /gabe-goal) until proof artifacts exist and multi-lane review returns Proven-for with empty blocking findings: prefer a harness /goal ability for multi-round continuation and skip this skill's hooks when available, keep MDScript-only run state under runs/<run_id>/, and drive parallel subagent work with append-only logs."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Harness Goal Ability

* set `{{skill_root}}` to this skill directory (directory containing this `SKILL.md`)
* set `{{skills_root}}` to the parent of `{{skill_root}}` when that parent is a skills directory, otherwise `~/.agents/skills`
* set `{{harness_goal_available}}` to `false`
* set `{{harness_goal_kind}}` to empty
* set `{{skip_goal_hooks}}` to `false`
* set `{{loop_driver}}` to `gabe-hooks`
* if `GABE_GOAL_FORCE_HOOKS` is `1` or `true`
  * keep `{{harness_goal_available}}` false
  * [Parse Goal](#parse-goal)
* if `GABE_GOAL_SKIP_HOOKS` is `1` or `true`
  * set `{{harness_goal_available}}` to `true`
  * set `{{harness_goal_kind}}` to `forced`
  * set `{{skip_goal_hooks}}` to `true`
  * set `{{loop_driver}}` to `harness-goal`
  * [Parse Goal](#parse-goal)
* if this runtime is Grok Build / grok (env `GROK_HOOK_EVENT`, `GROK_WORKSPACE_ROOT`, or the host exposes slash `/goal` as a host-owned goal mode)
  * set `{{harness_goal_available}}` to `true`
  * set `{{harness_goal_kind}}` to `host`
* if a skill named `goal` (not `gabe-goal`) exists with `SKILL.md` under any of `{{skills_root}}/goal`, `~/.agents/skills/goal`, `~/.cursor/skills/goal`, `~/.claude/skills/goal`, `~/.codex/skills/goal`, `~/.copilot/skills/goal`, or `~/.grok/skills/goal`
  * set `{{harness_goal_available}}` to `true`
  * set `{{harness_goal_kind}}` to `skill` when not already `host`
  * set `{{harness_goal_skill}}` to that skill's absolute directory
* if `{{harness_goal_available}}` is `true`
  * set `{{skip_goal_hooks}}` to `true`
  * set `{{loop_driver}}` to `harness-goal`
* [Parse Goal](#parse-goal)

## Parse Goal

* run [Resolve Agent Home](../gabe-common/workflows/agent-home.md#resolve-agent-home)
* set `{{repo_root}}` to the working repository root when present, otherwise the current workspace root
* set `{{goal_text}}` from `/gabe-goal …`, `/goal …`, or the natural-language goal in the user request
* if `{{goal_text}}` is empty
  * ask the user for one clear goal sentence as `{{goal_text}}`
  * [Parse Goal](#parse-goal)
* set `{{orchestrator_model}}` to this chat's model slug
* if `{{harness_goal_available}}` is `true` and the user invoked `/gabe-goal` (not already host `/goal`)
  * prefer the harness `/goal` ability for multi-round continuation
  * when `{{harness_goal_kind}}` is `host` (Grok)
    * bind the objective to harness `/goal {{goal_text}}` (or tell the user/host that this run continues under host `/goal`)
    * still execute every state of this skill's MDScript workflow for work, proof, and gabe-review
  * when `{{harness_goal_kind}}` is `skill`
    * run the harness `goal` skill for the same `{{goal_text}}` only as the continuation driver if the harness requires that entry
    * require the harness goal body to follow this skill's MDScript workflow (parse → start → pursue → capture → compose multi-lane review → complete)
  * do not arm, await, or depend on gabe-goal stop/session hooks for this run
* run [Clarify Goal](workflows/clarify-goal.md#clarify-goal)

## Start Or Resume

* if the user message or injected context is executable MDScript (or ends with `mdscript-exec …/goal.mdscript.md#…`)
  * run that MDScript via the `mdscript-exec` skill starting at the named heading
  * do not start a new run
* else if an active run already exists for this conversation
  * set `{{goal_mdscript}}` to the newest `{{run_dir}}/goal.mdscript.md` whose front matter has `active: true`
  * execute `mdscript-exec {{goal_mdscript}}#resume-goal`
* else
  * run [Start Goal Run](workflows/start-goal-run.md#start-goal-run)
  * tell the user `{{goal_text}}`, `{{proof_kind}}`, `{{live_proof}}`, `{{run_id}}`, `{{run_dir}}`, `{{goal_mdscript}}`, `{{loop_driver}}`, and whether hooks are skipped
  * [Pursue Goal](#pursue-goal)

## Pursue Goal

* keep `{{run_dir}}/goal.mdscript.md` current as the durable tracker
* if `{{skip_goal_hooks}}` is `true`
  * treat this skill as the only loop driver for work content
  * do not wait for a gabe-goal stop-hook follow-up
  * after incomplete proof or review, immediately re-enter [Pursue Goal](#pursue-goal) in this turn or the next harness `/goal` round
* if `{{skip_goal_hooks}}` is `false`
  * keep `{{goal_mdscript}}` as the stop-hook resume target
* set front-matter `resume_heading` to `pursue-goal` while implementing/proofing, `complete-goal` only when ready to finish, or `manual-stop` when blocked
* set front-matter `skip_hooks` to `{{skip_goal_hooks}}` and `loop_driver` to `{{loop_driver}}` whenever the run MDScript is refreshed
* run [Pursue Iteration](workflows/pursue-iteration.md#pursue-iteration)
* run [Capture Artifacts](workflows/capture-artifacts.md#capture-artifacts)
* if artifacts or `{{primary_user_action}}` proof are incomplete
  * refresh `{{goal_mdscript}}` completion_gate notes from the current gaps
  * [Pursue Goal](#pursue-goal)
* run [Compose Multi-Lane Review](workflows/compose-multi-lane-review.md#compose-multi-lane-review) which execs multi-lane review adversarial blind (always-on rules + security + completeness, selected eng-* language/framework lanes from vendored gabewillen/rules, plus deep hsm when a state machine is in scope)
* if any blind lane fails, gabe-review returns `Not ready for …`, or blocking findings remain
  * fix every blocking finding
  * refresh artifacts and `artifacts/manifest.json` when proof changed
  * delete stale `{{run_dir}}/review-verdict.mdscript.md`
  * append a `review_rejected` line to `{{run_dir}}/progress.jsonl`
  * refresh `{{goal_mdscript}}` with the unioned findings and `resume_heading: pursue-goal`
  * [Pursue Goal](#pursue-goal)
* if gabe-review returns `Blocked for …` and the missing precondition cannot be stood up locally
  * [Manual Stop](#manual-stop)
* [Complete Goal](#complete-goal)

## Complete Goal

* treat the gabe-review verdict as the only thing that closes a goal; setting `active: false` or `status: completed` without it does not end the run
* if `{{skip_goal_hooks}}` is `false`
  * expect the stop hook to re-open any run marked complete without a valid verdict, re-entering at `pursue-goal` and recording `completion_rejected`
* if `{{skip_goal_hooks}}` is `true`
  * enforce the same completion gate yourself before marking complete — do not leave a completed status without a valid gabe-review verdict
  * if the harness `/goal` feature still shows the goal active, clear or complete it only after the verdict is proven
* verify `{{run_dir}}/review-verdict.mdscript.md` exists from gabe-review, reading its YAML front matter for matching `goal` and `conversation_id`, grade/proof_decision starting with `Proven for`, empty `blocking_findings`, and `proof_supplied` / `artifact_paths` referencing run artifacts
* set front-matter `active: false` on `{{goal_mdscript}}`
* refresh `{{goal_mdscript}}` with `status: completed` and `resume_heading: complete-goal`
* append `goal_completed` to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`
* append `run_completed` to `{{run_dir}}/progress.jsonl`
* stop and report the completed goal, `{{run_dir}}`, `{{goal_mdscript}}`, artifact summary, the gabe-review Proven-for verdict, and `loop_driver={{loop_driver}}`

## Stop Hook Resume

* if `{{skip_goal_hooks}}` is `true` or front-matter `skip_hooks` is true
  * do not treat stop-hook injection as required
  * continue only via [Pursue Goal](#pursue-goal) or harness `/goal` rounds
  * return to the caller
* treat a stop-hook MDScript message, `mdscript-exec …/goal.mdscript.md#…`, an active-goal MDScript context block, or an incomplete active run as a hard continue signal
* the stop hook rewrites `{{run_dir}}/goal.mdscript.md` with the current completion gate and ends the follow-up with `mdscript-exec {{goal_mdscript}}#pursue-goal` (or the saved `resume_heading`)
* execute that command with the `mdscript-exec` skill — restore variables from the run MDScript front matter, then continue at the named heading
* do real work this turn — never summary-only stop
* if the follow-up body is inline MDScript without a path, execute the inline workflow starting at `## Stop Hook Resume` / the linked run MDScript

## Manual Stop

* use a terminal `status` of `stopped` or `blocked`, never `completed`, when leaving a run inactive without a gabe-review verdict
* set front-matter `active: false` on `{{goal_mdscript}}` when the user stops the goal or an external blocker cannot be cleared
* refresh `{{goal_mdscript}}` with `status: stopped` or `blocked`, the blocker summary, and `resume_heading: manual-stop`
* append `goal_stopped` with the blocker summary to `{{run_dir}}/progress.jsonl` and both append-only logs
* if `{{skip_goal_hooks}}` is `true` and the harness still tracks an open `/goal`
  * pause or clear the harness goal so it does not keep looping after this manual stop
* stop and report progress, `{{run_dir}}`, `{{goal_mdscript}}`, and the blocker
