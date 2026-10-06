<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Update Living Skills

* set `{{correction_source}}` only from a direct user message that changes how future agents behave
* never set it from agent debugging, tool logs, failures, self-critique, or lessons that the agent found
* if `{{correction_source}}` is empty, or is not the user's words from this turn, return to the caller
* if the correction is a one-time direction for this lane only, return to the caller
* set `{{skill_update_summary}}` to one sentence that restates only the user's rule
* if the correction names a project, repository, product, host, or customer, or the scope is unclear
  * [Apply Project Rule](#apply-project-rule)
* [Apply Global Rule](#apply-global-rule)

## Apply Project Rule

* set `{{project_rules_file}}` to the rules file that `{{repo_root}}/.agents/` already uses, or `{{repo_root}}/.agents/rules/project.rules.md`
* add or strengthen the rule there, and do not edit the global pack
* report the path
* return to the caller

## Apply Global Rule

* set `{{live_skills_root}}` to the first of these that has `self-implement/SKILL.md`:
  * `{{skills_root}}`, the skills path in `~/.agents/self-agents-live.json`, `~/.agents/repos/self/skills`, or this checkout's `skills`
* if none exists, stop and report that the pack needs a live install
* set `{{live_branch}}` and `{{upstream_base}}` from `~/.agents/self-agents-live.json`, with `main` as the default base
* find the one state, rule, or boundary that already owns the behavior
  * a shared engineering `MUST` goes in `self-review/references/engineering-rules/`, which implement and review both load
  * a rule for all roles goes in `self/references/boundaries.md`
* change or delete the existing bullet before you add one
* add a bullet only if no bullet can hold the rule
* keep the rule project-agnostic, in ASD-STE100, with one action for each bullet
* do not add intent or `MUST` rules that the user did not state
* run `scripts/validate-mdscript.mjs` on each changed file, and the install test of each changed skill
* repair until they pass
* commit only the changed files on `{{live_branch}}`, with the user correction in one line
* do not push to `{{upstream_base}}`
  * the `post-commit` hook pushes `{{live_branch}}` and opens the PR
  * if the hook is missing, push `{{live_branch}}` and open the PR into `{{upstream_base}}` one time
* run `node scripts/install.mjs --live`
* if authority or credentials block the push, keep the local commit, and report the exact missing step
* report the scope, the summary, the changed files, the validation result, and the PR URL or the blocker
* return to the caller
