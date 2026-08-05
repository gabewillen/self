<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Operating Context

* re-read the calling role skill before meaningful orchestration, delegation, implementation, review, public mutation, publication, final recommendation, or resumed goal work
* read the relevant installed skill references first, including linked common workflows and role workflows
* decide "What would the user do?" from the current request, active local instructions, current evidence, and the installed skill context
* if the installed skill context is sufficient for the current objective
  * continue from the skill contract and the current live source of truth
  * [Compile Lane Goal Context](#compile-lane-goal-context)
* if the installed skills lack the needed rule, appear stale, or conflict with a new user correction, current instructions, or live evidence
  * decide from the current request, active local instructions, repository state, and live evidence
  * name the insufficient or contradicted skill rule
  * if the user stated a durable correction in their own words
    * set `{{correction_source}}` to that user quote only
    * run [Update Living Skills](update-living-skills.mdscript.md#update-living-skills)
  * do not update skills from agent-named skill gaps alone
  * [Compile Lane Goal Context](#compile-lane-goal-context)
* do not let compiled skill context override current instructions, tracker state, code, tests, telemetry, or live proof
* preserve whether the work was steered by the user, a role skill, a worker, a reviewer, a goal, or explicit external automation
* return to the caller

## Compile Lane Goal Context

* after the first lane setup or first materially new human correction, write `{{goal_mdscript}}` when absent or update it when present
* put the compiled skill context digest, objective, source of truth, proof contract, hot-path event handling, exact role jumps, and stop/report rules into that goal
  * if the write fails, stop and report the exact path and error
* on resumed goal turns, child-lane heartbeats, and monitor turns
  * [Resume From Goal Context](#resume-from-goal-context)
* return to the caller

## Resume From Goal Context

* execute `{{goal_mdscript}}#resume-goal` first when it exists, names the current lane, and has not been invalidated by a new human correction, scope change, or project change
* refresh current repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state from live sources
* do not reread or renarrate the full skill context stack unless `{{goal_mdscript}}` is missing, stale, contradicted by the current request, or out of scope
* if `{{goal_mdscript}}` is missing, stale, contradicted, or out of scope
  * [Compile Lane Goal Context](#compile-lane-goal-context)
* return to the caller
