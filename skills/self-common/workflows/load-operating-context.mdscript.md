<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Load Operating Context

* read the calling role skill and the workflows that it links before these items:
  * orchestration, delegation, implementation, review, public mutation, or a final recommendation
* decide "What would the user do?" from the request, the local instructions, the current evidence, and the skills
* if the skills miss a rule, look stale, or conflict with a user correction or live evidence
  * decide from the request, the local instructions, the repository, and the live evidence
  * name the skill rule that fell short
  * if the user stated a durable correction in their own words, run [Update Living Skills](update-living-skills.mdscript.md#update-living-skills)
* never let skill context override current instructions, tracker state, code, tests, or live proof
* record who steered the work: the user, a skill, a worker, a reviewer, a goal, or an automation
* if a goal MDScript exists for this lane
  * write the objective, source of truth, proof contract, and stop rules into it
* return to the caller
