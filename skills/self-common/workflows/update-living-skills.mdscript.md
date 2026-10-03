<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Update Living Skills

* set `{{correction_source}}` only from a **direct user** message, an explicit user correction, or a user-authored instruction
  * that source must change how future agents behave
* never set `{{correction_source}}` from the analysis, debug work, tool logs, model failures, or self-critique of the agent
* never set `{{correction_source}}` from an evaluation design or from lessons that the agent found by itself
* if `{{correction_source}}` is empty
  * return to the caller
* if `{{correction_source}}` is not a quote or close paraphrase of user words from this turn
  * record that the candidate is not user-sourced
  * return to the caller, and do not edit skills
* set `{{correction_kind}}` to one of `new-rule`, `strengthen`, `disambiguate`, `scope-boundary`, or `remove-ambiguity` from the **user's** correction
* set `{{skill_update_summary}}` to one sentence that restates only the durable rule that the **user** stated
  * do not add rules that the agent made
* if the correction is only a one-time direction for this lane and does not change future agent behavior
  * record that no living skill change is necessary
  * return to the caller
* [Classify Rule Scope](#classify-rule-scope)

## Classify Rule Scope

* if the correction names this repository, product, model, service, host, customer, or other project-specific surface
  * set `{{rule_scope}}` to `project`
* if the correction is true for all projects (project-agnostic pack behavior)
  * set `{{rule_scope}}` to `global`
* if the scope is ambiguous
  * use `project`, not `global`
  * never move a project fact into the global pack
* if `{{rule_scope}}` is `global` and the rule text has a project name, path, product, or host-specific detail
  * rewrite `{{skill_update_summary}}` in a project-agnostic form, or classify the rule again as `project`
* if `{{rule_scope}}` is `project`
  * [Apply Project Rule](#apply-project-rule)
* if `{{rule_scope}}` is `global`
  * [Classify Skill Targets](#classify-skill-targets)

## Apply Project Rule

* if `{{repo_root}}` is empty, set it to the root of the work repository (the product repo, not the agents pack)
* set `{{project_agents_dir}}` to `{{repo_root}}/.agents`
* if `{{project_agents_dir}}/rules` is missing, create it
* set `{{project_rules_file}}` to `{{project_agents_dir}}/rules/project.rules.md` if that is the local convention
  * if not, set it to the project rules path that the repo already uses under `.agents/`
* add or strengthen a project-local rule that restates only the durable correction of the user
* do not edit the global skill pack for a project-scoped rule
* append `{{project_rules_file}}` to `{{skill_files_changed}}`
* set `{{publish_mode}}` to `project-local`
* report the project rule path, and report that a global pack PR is not necessary
* return to the caller

## Classify Skill Targets

* set `{{skill_update_targets}}` to an empty list
* if the correction changes how agents write, edit, build implementation contracts, build proof, or act under a parent
  * append `self-implement` to `{{skill_update_targets}}`
* if the correction changes review, readiness, blind lanes, verdicts, evidence bars, or what reviewers must falsify
  * append `self-review` to `{{skill_update_targets}}`
* if the correction is an engineering MUST/MUST NOT that writers and reviewers must share
  * append `engineering-rules` to `{{skill_update_targets}}`
  * if `self-implement` is not in the list, append it
  * if `self-review` is not in the list, append it
* if the correction changes root coordination, delegation, or non-subagent defaults
  * append `self-orchestrate` to `{{skill_update_targets}}`
* if the correction changes role routing or position detection
  * append `self` to `{{skill_update_targets}}`
* if the correction changes a shared boundary that all roles keep
  * append `self/references/boundaries.md` to `{{skill_update_targets}}`
* if `{{skill_update_targets}}` is still empty and the correction is durable and global
  * append `self-implement` and `self-review` as the default living pair
* [Resolve Live Skills Root](#resolve-live-skills-root)

## Resolve Live Skills Root

* set `{{live_skills_root}}` to empty
* if `{{skills_root}}` exists and has `self-implement/SKILL.md` and `self-review/SKILL.md`
  * set `{{live_skills_root}}` to `{{skills_root}}`
* if `{{live_skills_root}}` is empty and `~/.agents/self-agents-live.json` exists
  * read that marker
  * if the marker has a skills path, set `{{live_skills_root}}` to that path
* if `{{live_skills_root}}` is empty and `~/.agents/repos/self/skills` exists
  * set `{{live_skills_root}}` to `~/.agents/repos/self/skills`
* if `{{live_skills_root}}` is empty and `~/.agents/repos/gabewillen-agents/skills` exists
  * set `{{live_skills_root}}` to `~/.agents/repos/gabewillen-agents/skills`
* if `{{live_skills_root}}` is empty and this checkout has `skills/self-implement/SKILL.md`
  * set `{{live_skills_root}}` to this checkout's `skills` directory
* if `{{live_skills_root}}` is empty
  * set `{{blocker}}` to `cannot resolve live skills root for living skill update`
  * stop and report the missing live root and that the pack needs a live install
* if the parent of `{{live_skills_root}}` is the agents package root
  * set `{{agents_repo_root}}` to that parent
* if `~/.agents/self-agents-live.json` has `live_branch`
  * set `{{live_branch}}` from it
* set `{{upstream_base}}` from `upstream_base` in that marker, or to `main` if the marker does not have it
* [Apply Skill Updates](#apply-skill-updates)

## Apply Skill Updates

* set `{{skill_files_changed}}` to an empty list
* for each entry in `{{skill_update_targets}}`
  * [Update One Skill Target](#update-one-skill-target)
* if `{{skill_files_changed}}` is empty
  * stop and report that the correction was classified but no file edit landed
* [Validate Skill Updates](#validate-skill-updates)

## Update One Skill Target

* if the target is `self-implement`
  * open `{{live_skills_root}}/self-implement/SKILL.md` and the smallest linked implement workflow that owns the rule
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `self-review`
  * open `{{live_skills_root}}/self-review/SKILL.md` and the smallest linked review check, policy, or blind-lane workflow that owns the rule
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `engineering-rules`
  * open the matching file under `{{live_skills_root}}/self-review/references/engineering-rules/`
  * if the correction is language- or framework-specific, edit that language file
  * if the correction is not language- or framework-specific, edit `core.rules.md` or `dbc.rules.md`
  * add or strengthen a `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` rule so that implement `impl-*` and review `eng-*` load the same text
  * append the edited path to `{{skill_files_changed}}`
  * return to the caller
* if the target is `self-orchestrate`
  * open `{{live_skills_root}}/self-orchestrate/SKILL.md` or the orchestrate workflow that owns the rule
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `self`
  * open `{{live_skills_root}}/self/SKILL.md`
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `self/references/boundaries.md`
  * open `{{live_skills_root}}/self/references/boundaries.md`
  * strengthen or add the boundary bullet that matches `{{skill_update_summary}}`
  * append the path to `{{skill_files_changed}}`
  * return to the caller
* return to the caller

## Edit Skill For Correction

* read all of the current skill or workflow text for the state that owns the rule
* if a bullet or rule already covers the correction but is weak or ambiguous
  * rewrite that bullet as a stronger, clear MUST-level action or constraint
* if no bullet covers the correction
  * add one discrete action bullet or linked workflow step in the state that owns the rule, not a rationale paragraph
* keep the global pack **project-agnostic**
  * do not put a product name, repo path, host, customer, or single-project protocol in the rule text
* keep the MDScript shape: one action for each bullet, explicit recovery links, no narration of many actions
* write the new rule text in ASD-STE100, as the `mdscript-write` conventions tell you
* do not invent user intent beyond the user's words
* do not add more MUST rules that the user did not state
* append each edited path to `{{skill_files_changed}}`
* return to the caller

## Validate Skill Updates

* if `{{agents_repo_root}}` has `scripts/validate-mdscript.mjs`, run `node {{agents_repo_root}}/scripts/validate-mdscript.mjs {{skill_files_changed paths}}`
* if validation fails
  * repair the edited skills
  * [Validate Skill Updates](#validate-skill-updates)
* if the `self-implement` assets or the implement engineering-rules assets changed and `test-self-implement-install.mjs` exists
  * run `node {{agents_repo_root}}/scripts/test-self-implement-install.mjs`
* if the `self-review` assets or the engineering-rules assets changed and `test-self-review-install.mjs` exists
  * run `node {{agents_repo_root}}/scripts/test-self-review-install.mjs`
* [Publish Living Skill Updates](#publish-living-skill-updates)

## Publish Living Skill Updates

* set `{{publish_mode}}` to `global-pr`
* if `{{live_branch}}` is set
  * make sure that the work tree is on `{{live_branch}}`
  * if the work tree is not on `{{live_branch}}`, check out `{{live_branch}}`
* stage only `{{skill_files_changed}}` under `{{agents_repo_root}}`
* commit on `{{live_branch}}` with a message that names the user correction in one line
* do **not** push to `main` / `{{upstream_base}}` directly from this agent
* after the commit, let the installed `post-commit` hook push `{{live_branch}}`
  * the hook opens or changes the PR into `{{upstream_base}}`, except if `SELF_SKIP_PR_HOOK=1`
* if the hook is missing, run `git push -u origin {{live_branch}}` one time
  * then run `gh pr create --base {{upstream_base}} --head {{live_branch}}` one time
* run `node {{agents_repo_root}}/scripts/install.mjs --live` so that agent homes link again to the live branch tip
* if missing authority or missing credentials block the push or the PR
  * if possible, keep the files edited and committed locally
  * set `{{skill_publish_blocker}}` to the exact missing publish step
* [Report Living Skill Updates](#report-living-skill-updates)

## Report Living Skill Updates

* report `{{rule_scope}}`, `{{correction_kind}}`, `{{skill_update_summary}}`, `{{skill_update_targets}}`, and `{{skill_files_changed}}`
* report `{{live_branch}}`, the validation result, the install result, and the PR URL or `{{skill_publish_blocker}}`
* if a file task exists, add a file comment on the active task
* return to the caller
