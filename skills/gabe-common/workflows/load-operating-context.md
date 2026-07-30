<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Load Operating Context

* re-read the calling Gabe role skill before meaningful orchestration, delegation, implementation, review, public mutation, publication, final recommendation, or resumed goal work

* read the relevant installed Gabe skill references first, including linked common workflows and role workflows

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and the installed skill context

* if the installed skill context is sufficient for the current objective
  * continue from the skill contract and the current live source of truth

* if the installed skills lack the needed rule, appear stale, or conflict with a new human correction, current instructions, or live evidence
  * decide from the current request, active local instructions, repository state, and live evidence
  * name the insufficient or contradicted skill rule in the report so the skill can be corrected

* after the first lane setup or first materially new human correction, write or refresh `{{goal_mdscript}}` with the compiled skill context digest, objective, source of truth, proof contract, hot-path event handling, exact role jumps, and stop/report rules for this lane

* on resumed goal turns, child-lane heartbeats, and monitor turns
  * execute `{{goal_mdscript}}#resume-goal` first when it exists, names the current lane, and has not been invalidated by a new human correction, scope change, or project change
  * refresh current repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state from live sources
  * do not reread or renarrate the full skill context stack unless `{{goal_mdscript}}` is missing, stale, contradicted by the current request, or out of scope

* do not let compiled skill context override current instructions, tracker state, code, tests, telemetry, or live proof

* preserve whether the work was steered by human Gabe, a Gabe role skill, a worker, a reviewer, a goal, or explicit external automation
