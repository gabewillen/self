<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Operating Context

* read the role skill that called this workflow again before important work of these types:
  * orchestration, delegation, implementation, review, or public mutation
  * publication, a final recommendation, or resumed goal work
* read the related installed skill references first
  * include the linked common workflows and role workflows
* decide "What would the user do?" from these sources:
  * the current request, the active local instructions, the current evidence, and the installed skill context
* if the installed skill context is enough for the current objective
  * continue from the skill contract and the current live source of truth
  * [Compile Lane Goal Context](#compile-lane-goal-context)
* examine the installed skills for these problems:
  * the installed skills do not have the necessary rule
  * the installed skills seem stale
  * the installed skills conflict with a new user correction, current instructions, or live evidence
* if one of these problems exists
  * decide from the current request, the active local instructions, the repository state, and the live evidence
  * name the skill rule that is not enough or that the evidence contradicts
  * if the user stated a durable correction in their own words
    * set `{{correction_source}}` to that user quote only
    * run [Update Living Skills](update-living-skills.mdscript.md#update-living-skills)
  * do not change skills only because an agent named a skill gap
  * [Compile Lane Goal Context](#compile-lane-goal-context)
* do not let compiled skill context override current instructions, tracker state, code, tests, telemetry, or live proof
* record who steered the work: the user, a role skill, a worker, a reviewer, a goal, or explicit external automation
* return to the caller

## Compile Lane Goal Context

* after the first lane setup or after the first new human correction that changes the work
  * if `{{goal_mdscript}}` does not exist, write it
  * if `{{goal_mdscript}}` exists, change it
* put these items into that goal:
  * the compiled skill context digest, the objective, the source of truth, and the proof contract
  * the hot-path event procedure, the exact role jumps, and the stop and report rules
  * if the write fails, stop and report the exact path and error
* on resumed goal turns, child-lane heartbeats, and monitor turns
  * [Resume From Goal Context](#resume-from-goal-context)
* return to the caller

## Resume From Goal Context

* if `{{goal_mdscript}}` exists and names the current lane
  * if no new human correction, scope change, or project change made it not valid, execute `{{goal_mdscript}}#resume-goal` first
* get the current state again from live sources
  * this state includes the repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state
* if `{{goal_mdscript}}` exists, is not stale, agrees with the current request, and is in scope
  * do not read or state the full skill context stack again
* if `{{goal_mdscript}}` is not there, stale, contradicted, or out of scope
  * [Compile Lane Goal Context](#compile-lane-goal-context)
* return to the caller
