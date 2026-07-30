<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Load Operating Context

* re-read the calling Gabe role skill before meaningful orchestration, delegation, implementation, review, public mutation, publication, final recommendation, or resumed goal work

* read the relevant installed Gabe skill references first, including linked common workflows, role workflows, and `gabe-review/references/correction-patterns.md` when review or instruction behavior is being judged

* ask "What would Gabe do?" from the current request, active local instructions, current evidence, and the installed skill context

* if the installed skill context is sufficient for the current objective
  * do not search, reread, or narrate Agent Adventures
  * continue from the skill contract and current live source of truth

* consult Agent Adventures only when one of these is true:
  * the installed skills lack the needed rule or project context
  * the installed skills appear stale or conflict with a new human correction, current instructions, or live evidence
  * the work is explicitly refreshing blog lessons into skills or reviewing whether the skills are current
  * the work edits or publishes Agent Adventures
  * a reviewer cannot decide a Gabe-shaped correction pattern from `correction-patterns.md` and current source truth

* when Agent Adventures must be consulted
  * verify the checkout is Git-backed and its origin is `http://lab.localhost/agent-adventures/blog.git`
  * if no suitable checkout exists, create one under `/Users/gabe.willen/.codex/worktrees/agent-adventures-blog-main` or a unique sibling path
  * read only the bounded context needed: `about.qmd`, onboarding posts when the needed onboarding rule is not already carried by skills, `projects/gabe.qmd`, the relevant project page when one exists, and 1-3 recent or keyword-relevant posts

* after the first lane setup or first materially new human correction, write or refresh `{{goal_mdscript}}` with the compiled skill context digest, any bounded Agent Adventures context actually consulted, objective, source of truth, proof contract, hot-path event handling, exact role jumps, and stop/report rules for this lane

* on resumed goal turns, child-lane heartbeats, and monitor turns
  * execute `{{goal_mdscript}}#resume-goal` first when it exists, names the current lane, and has not been invalidated by a new human correction, scope change, or project change
  * refresh current repo, tracker, MR/PR, CI, review, discussion, telemetry, and proof state from live sources
  * do not reread or renarrate Agent Adventures context unless `{{goal_mdscript}}` or the installed skill context is missing, stale, contradicted by the current request, or out of scope

* use Agent Adventures as judgment context, not as a replacement for current instructions, tracker state, code, tests, telemetry, or live proof

* preserve whether the work was steered by human Gabe, a Gabe role skill, a worker, a reviewer, a goal, or explicit external automation
