---
name: self-goal
description: "ALWAYS use this skill when you run a goal loop (/goal or /self-goal). Ask the user if a multi-lane self-review must close the goal; never imply it. Continue the loop until the proof artifacts exist. If the user asked for review, continue until it returns Proven-for with empty blocking findings. If a harness /goal ability is available, prefer it for multi-round continuation and skip the hooks of this skill. Keep the MDScript-only run state under runs/<run_id>/. Drive parallel subagent work with append-only logs."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Harness Goal Ability

* set `{{skill_root}}` to this skill directory (the directory that contains this `SKILL.md`)
* if the parent of `{{skill_root}}` is a skills directory
  * set `{{skills_root}}` to the parent of `{{skill_root}}`
* if the parent of `{{skill_root}}` is not a skills directory
  * set `{{skills_root}}` to `~/.agents/skills`
* set `{{harness_goal_available}}` to `false`
* set `{{harness_goal_kind}}` to empty
* set `{{skip_goal_hooks}}` to `false`
* set `{{loop_driver}}` to `self-hooks`
* if `SELF_GOAL_FORCE_HOOKS` is `1` or `true`
  * keep `{{harness_goal_available}}` false
  * [Parse Goal](#parse-goal)
* if `SELF_GOAL_SKIP_HOOKS` is `1` or `true`
  * set `{{harness_goal_available}}` to `true`
  * set `{{harness_goal_kind}}` to `forced`
  * set `{{skip_goal_hooks}}` to `true`
  * set `{{loop_driver}}` to `harness-goal`
  * [Parse Goal](#parse-goal)
* if this runtime is Grok Build / grok (env `GROK_HOOK_EVENT` or `GROK_WORKSPACE_ROOT` is set)
  * set `{{harness_goal_available}}` to `true`
  * set `{{harness_goal_kind}}` to `host`
* if the host shows slash `/goal` as a host-owned goal mode (Grok Build / grok)
  * set `{{harness_goal_available}}` to `true`
  * set `{{harness_goal_kind}}` to `host`
* examine these directories for a skill named `goal` (not `self-goal`) with a `SKILL.md`:
  * `{{skills_root}}/goal`, `~/.agents/skills/goal`, `~/.cursor/skills/goal`, or `~/.claude/skills/goal`
  * `~/.codex/skills/goal`, `~/.copilot/skills/goal`, or `~/.grok/skills/goal`
* if one of these directories has that skill
  * set `{{harness_goal_available}}` to `true`
  * if `{{harness_goal_kind}}` is not already `host`, set it to `skill`
  * set `{{harness_goal_skill}}` to the absolute directory of that skill
* if `{{harness_goal_available}}` is `true`
  * set `{{skip_goal_hooks}}` to `true`
  * set `{{loop_driver}}` to `harness-goal`
* [Parse Goal](#parse-goal)

## Parse Goal

* run [Resolve Agent Home](../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* if a working repository root exists, set `{{repo_root}}` to it
* if no working repository root exists, set `{{repo_root}}` to the current workspace root
* set `{{goal_text}}` from `/self-goal …`, `/goal …`, or the natural-language goal in the user request
* if `{{goal_text}}` is empty
  * ask the user for one clear goal sentence as `{{goal_text}}`
  * [Parse Goal](#parse-goal)
* set `{{orchestrator_model}}` to the model slug of this chat
* if `{{harness_goal_available}}` is `true` and the user started `/self-goal` (not already host `/goal`)
  * prefer the harness `/goal` ability for multi-round continuation
  * if `{{harness_goal_kind}}` is `host` (Grok)
    * bind the objective to harness `/goal {{goal_text}}`
    * as an alternative, tell the user or host that this run continues under host `/goal`
    * still execute each state of the MDScript workflow of this skill for work, proof, and self-review
  * if `{{harness_goal_kind}}` is `skill`
    * if the harness needs that entry, run the harness `goal` skill for the same `{{goal_text}}` only as the continuation driver
    * make sure that the harness goal body follows the MDScript workflow of this skill
    * the order is parse → start → pursue → capture → compose multi-lane review → complete
  * do not arm, wait for, or depend on self-goal stop or session hooks for this run
* run [Clarify Goal](workflows/clarify-goal.mdscript.md#clarify-goal)

## Start Or Resume

* if the user message or injected context is executable MDScript (or ends with `mdscript-exec …/goal.mdscript.md#…`)
  * run that MDScript with the `mdscript-exec` skill, and start at the named heading
  * do not start a new run
* else if an active run already exists for this conversation
  * set `{{goal_mdscript}}` to the newest `{{run_dir}}/goal.mdscript.md` whose front matter has `active: true`
  * execute `mdscript-exec {{goal_mdscript}}#resume-goal`
* else
  * run [Start Goal Run](workflows/start-goal-run.mdscript.md#start-goal-run)
  * tell the user `{{goal_text}}`, `{{proof_kind}}`, `{{live_proof}}`, `{{run_id}}`, and `{{run_dir}}`
  * tell the user `{{goal_mdscript}}`, `{{loop_driver}}`, and if the hooks are skipped
  * [Pursue Goal](#pursue-goal)

## Pursue Goal

* keep `{{run_dir}}/goal.mdscript.md` current as the durable tracker
* if `{{skip_goal_hooks}}` is `true`
  * use this skill as the only loop driver for work content
  * do not wait for a self-goal stop-hook follow-up
  * after incomplete proof or review, enter [Pursue Goal](#pursue-goal) again immediately in this turn or the next harness `/goal` round
* if `{{skip_goal_hooks}}` is `false`
  * keep `{{goal_mdscript}}` as the stop-hook resume target
* set the front-matter `resume_heading` to one of these values:
  * `pursue-goal` during implementation or proof work
  * `complete-goal` only when the run is ready to finish
  * `manual-stop` when the run is blocked
* each time you write the run MDScript again, set the front-matter `skip_hooks` to `{{skip_goal_hooks}}`
* each time you write the run MDScript again, set the front-matter `loop_driver` to `{{loop_driver}}`
* run [Pursue Iteration](workflows/pursue-iteration.mdscript.md#pursue-iteration)
* run [Capture Artifacts](workflows/capture-artifacts.mdscript.md#capture-artifacts)
* if the artifacts or the `{{primary_user_action}}` proof are incomplete
  * change the completion_gate notes in `{{goal_mdscript}}` to show the current gaps
  * [Pursue Goal](#pursue-goal)
* if `{{self_review}}` is not `requested`
  * do not compose a self-review
  * [Complete Goal](#complete-goal)
* run [Compose Multi-Lane Review](workflows/compose-multi-lane-review.mdscript.md#compose-multi-lane-review)
  * this workflow execs a multi-lane adversarial blind review
  * the lanes are always-on rules + security + completeness, and the selected eng-* language/framework lanes from vendored gabewillen/rules
  * if a state machine is in scope, the lanes also include deep hsm
* if a blind lane fails, self-review returns `Not ready for …`, or blocking findings remain
  * fix each blocking finding
  * if the proof changed, write the artifacts and `artifacts/manifest.json` again
  * delete the stale `{{run_dir}}/review-verdict.mdscript.md`
  * append a `review_rejected` line to `{{run_dir}}/progress.jsonl`
  * change `{{goal_mdscript}}` to hold the union of the findings and `resume_heading: pursue-goal`
  * [Pursue Goal](#pursue-goal)
* if self-review returns `Blocked for …` and you cannot stand up the precondition locally
  * [Manual Stop](#manual-stop)
* [Complete Goal](#complete-goal)

## Complete Goal

* if `{{self_review}}` is empty or `pending`
  * do not complete the goal
  * [Clarify Goal](workflows/clarify-goal.mdscript.md#clarify-goal)
* if `{{self_review}}` is `declined`
  * use the proof artifacts and the recorded `{{self_review_answer}}` as the completion gate
  * [Close Goal Run](#close-goal-run)
* use the self-review verdict as the only thing that closes a goal that has `self_review: requested`
  * `active: false` or `status: completed` without that verdict does not end the run
* if `{{skip_goal_hooks}}` is `false`
  * expect the stop hook to open again a run that is marked complete without a valid verdict
  * expect the stop hook to enter again at `pursue-goal` and record `completion_rejected`
* if `{{skip_goal_hooks}}` is `true`
  * before you mark the run complete, apply the same completion gate yourself
  * do not leave a completed status without a valid self-review verdict
  * if the harness `/goal` feature still shows the goal as active
    * clear or complete it only after the verdict is proven
* make sure that self-review wrote `{{run_dir}}/review-verdict.mdscript.md`
* read its YAML front matter and make sure that it has these values:
  * a `goal` and a `conversation_id` that agree with this run
  * a grade/proof_decision that starts with `Proven for`, and empty `blocking_findings`
  * `proof_supplied` / `artifact_paths` that refer to run artifacts
* [Close Goal Run](#close-goal-run)

## Close Goal Run

* set the front-matter `active: false` on `{{goal_mdscript}}`
* change `{{goal_mdscript}}` to `status: completed` and `resume_heading: complete-goal`
* append `goal_completed` to `{{session_dir}}/session-log.jsonl` and `{{project_home}}/goal/goal-log.jsonl`
* append `run_completed` to `{{run_dir}}/progress.jsonl`
* stop and report the completed goal, `{{run_dir}}`, `{{goal_mdscript}}`, and an artifact summary
* in that report, also give `self_review={{self_review}}` and `loop_driver={{loop_driver}}`
* if `{{self_review}}` is `requested`, also give the self-review Proven-for verdict

## Stop Hook Resume

* if `{{skip_goal_hooks}}` is `true` or the front-matter `skip_hooks` is true
  * do not expect a stop-hook injection
  * continue only through [Pursue Goal](#pursue-goal) or harness `/goal` rounds
  * return to the caller
* use each of these items as a hard signal to continue:
  * a stop-hook MDScript message, or `mdscript-exec …/goal.mdscript.md#…`
  * an active-goal MDScript context block, or an incomplete active run
* the stop hook writes `{{run_dir}}/goal.mdscript.md` again with the current completion gate
* the stop hook ends the follow-up with `mdscript-exec {{goal_mdscript}}#pursue-goal` (or the saved `resume_heading`)
* execute that command with the `mdscript-exec` skill
  * restore the variables from the front matter of the run MDScript
  * continue at the named heading
* do real work in this turn, and never stop with only a summary
* if the follow-up body is inline MDScript without a path
  * execute the inline workflow, and start at `## Stop Hook Resume` / the linked run MDScript

## Manual Stop

* if you make a run inactive without a self-review verdict, use a terminal `status` of `stopped` or `blocked`
  * never use `completed` for this status
* if the user stops the goal or you cannot clear an external blocker, set the front-matter `active: false` on `{{goal_mdscript}}`
* change `{{goal_mdscript}}` to `status: stopped` or `blocked`, the blocker summary, and `resume_heading: manual-stop`
* append `goal_stopped` with the blocker summary to `{{run_dir}}/progress.jsonl` and to the two append-only logs
* if `{{skip_goal_hooks}}` is `true` and the harness still tracks an open `/goal`
  * pause or clear the harness goal, so that it does not loop again after this manual stop
* stop and report the progress, `{{run_dir}}`, `{{goal_mdscript}}`, and the blocker
