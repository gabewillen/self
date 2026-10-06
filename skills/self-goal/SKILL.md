---
name: self-goal
description: "ALWAYS use this skill for a goal loop (/goal or /self-goal). Do the least work that produces the proof (Ponytail), and loop until the proof artifacts exist. Ask whether a multi-lane self-review closes the goal; never imply it. If the user asked for it, loop until it returns Proven-for with no blocking findings. Prefer the harness's own /goal ability for continuation, and then skip this skill's hooks. Run state is MDScript under runs/<run_id>/."
---

<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Detect Harness Goal Ability

* set `{{skill_root}}` to this skill's directory, and `{{skills_root}}` to its parent, or `~/.agents/skills`
* set `{{harness_goal_available}}` to `true` if one of these is true, unless `SELF_GOAL_FORCE_HOOKS` is set:
  * `SELF_GOAL_SKIP_HOOKS` is set
  * the host is Grok (`GROK_HOOK_EVENT` or `GROK_WORKSPACE_ROOT` is set), or shows a host `/goal` mode
  * a skill named `goal` exists in `{{skills_root}}`, `~/.agents/skills`, `~/.cursor/skills`, `~/.claude/skills`, `~/.codex/skills`, `~/.copilot/skills`, or `~/.grok/skills`
* if it is `true`, set `{{skip_goal_hooks}}` to `true` and `{{loop_driver}}` to `harness-goal`
* otherwise set `{{skip_goal_hooks}}` to `false` and `{{loop_driver}}` to `self-hooks`
* [Parse Goal](#parse-goal)

## Parse Goal

* run [Resolve Agent Home](../self-common/workflows/agent-home.mdscript.md#resolve-agent-home)
* set `{{goal_text}}` from `/self-goal`, `/goal`, or the request; if it is empty, ask for one clear goal sentence
* set `{{orchestrator_model}}` to the model of this chat
* if the harness drives `/goal`, bind the goal to it
  * still run each state of this skill for work, proof, and review
* run [Clarify Goal](workflows/clarify-goal.mdscript.md#clarify-goal)
* [Start Or Resume](#start-or-resume)

## Start Or Resume

* if the input is executable MDScript or ends with `mdscript-exec …/goal.mdscript.md#…`
  * run it at that heading, and do not start a new run
* if this conversation has a run with `active: true`, run `mdscript-exec <newest goal.mdscript.md>#resume-goal`
* otherwise run [Start Goal Run](workflows/start-goal-run.mdscript.md#start-goal-run)
  * tell the user the goal, `{{proof_kind}}`, `{{live_proof}}`, `{{run_dir}}`, and `{{loop_driver}}`
  * [Pursue Goal](#pursue-goal)

## Pursue Goal

* keep `{{goal_mdscript}}` current, with `resume_heading` set to `pursue-goal`, `complete-goal`, or `manual-stop`, and with `skip_hooks` and `loop_driver`
* run [Pursue Iteration](workflows/pursue-iteration.mdscript.md#pursue-iteration)
* run [Capture Artifacts](workflows/capture-artifacts.mdscript.md#capture-artifacts)
* if the artifacts or the `{{primary_user_action}}` proof are incomplete, write the gaps in the completion gate, and [Pursue Goal](#pursue-goal)
* if `{{self_review}}` is not `requested`, [Complete Goal](#complete-goal)
* run [Compose Multi-Lane Review](workflows/compose-multi-lane-review.mdscript.md#compose-multi-lane-review)
* if it returns blocked, [Manual Stop](#manual-stop)
* if it returns incomplete
  * fix each blocking finding, and write the artifacts and manifest again if the proof changed
  * delete the stale `review-verdict`, append `review_rejected`, and write the findings into the goal
  * [Pursue Goal](#pursue-goal)
* [Complete Goal](#complete-goal)

## Complete Goal

* if `{{self_review}}` is empty or `pending`, run [Clarify Goal](workflows/clarify-goal.mdscript.md#clarify-goal)
* if `{{self_review}}` is `declined`, the proof artifacts and `{{self_review_answer}}` are the gate; [Close Goal Run](#close-goal-run)
* for `self_review: requested`, only the verdict closes the goal; `active: false` alone does not
* read `{{run_dir}}/review-verdict.mdscript.md`, and make sure of these:
  * its `goal` and `conversation_id` match this run
  * its grade starts with `Proven for`, and `blocking_findings` is empty
  * its `proof_supplied` or `artifact_paths` name run artifacts
* if `{{skip_goal_hooks}}` is `false`, the stop hook reopens a run closed without that verdict, and records `completion_rejected`
* if `{{skip_goal_hooks}}` is `true`, apply the same gate yourself before you mark the run or the harness goal complete
* [Close Goal Run](#close-goal-run)

## Close Goal Run

* set `active: false`, `status: completed`, and `resume_heading: complete-goal` on `{{goal_mdscript}}`
* append `goal_completed` to the session and project logs, and `run_completed` to `progress.jsonl`
* report the goal, `{{run_dir}}`, an artifact summary, `self_review={{self_review}}`, `loop_driver={{loop_driver}}`, and the verdict if one exists
* stop

## Stop Hook Resume

* if `skip_hooks` is true, continue only through [Pursue Goal](#pursue-goal) or harness `/goal` rounds
* a stop-hook message, an `mdscript-exec …/goal.mdscript.md#…` line, or an incomplete active run means continue
* run that command, and restore the variables from the run front matter
* do real work in this turn, not a summary

## Manual Stop

* set `active: false`, `status: stopped` or `blocked` (never `completed`), the blocker, and `resume_heading: manual-stop`
* append `goal_stopped` with the blocker to `progress.jsonl` and the two logs
* if the harness still tracks the `/goal`, pause or clear it
* report the progress, `{{run_dir}}`, and the blocker, and stop
