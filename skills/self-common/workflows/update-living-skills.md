<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Update Living Skills

* set `{{correction_source}}` only from a **direct user** message, explicit user correction, or user-authored instruction that changes how future agents must behave
* never set `{{correction_source}}` from the agent's own analysis, debugging, tool logs, model failures, self-critique, evaluation design, or inferred lessons
* if `{{correction_source}}` is empty
  * return to the caller
* if `{{correction_source}}` is not a quote or close paraphrase of user words from this turn
  * record that the candidate is not user-sourced
  * return to the caller without editing skills
* set `{{correction_kind}}` to one of `new-rule`, `strengthen`, `disambiguate`, `scope-boundary`, or `remove-ambiguity` from the **user's** correction
* set `{{skill_update_summary}}` to one sentence that restates only the durable rule the **user** stated, without adding agent-invented rules
* if the correction is only one-off task direction for this lane and does not change future agent behavior
  * record that no living skill update is needed
  * return to the caller
* [Classify Rule Scope](#classify-rule-scope)

## Classify Rule Scope

* set `{{rule_scope}}` to `project` when the correction names this repository, product, model, service, host, customer, or other project-specific surface
* set `{{rule_scope}}` to `global` when the correction is true for any project (project-agnostic pack behavior)
* if scope is ambiguous
  * prefer `project` over `global` — never promote a project fact into the global pack
* if `{{rule_scope}}` is `global` and the rule text embeds a project name, path, product, or host-specific detail
  * rewrite `{{skill_update_summary}}` to a project-agnostic form, or reclassify as `project`
* if `{{rule_scope}}` is `project`
  * [Apply Project Rule](#apply-project-rule)
* if `{{rule_scope}}` is `global`
  * [Classify Skill Targets](#classify-skill-targets)

## Apply Project Rule

* set `{{repo_root}}` to the working repository root (the product repo, not the agents pack) when empty
* set `{{project_agents_dir}}` to `{{repo_root}}/.agents`
* create `{{project_agents_dir}}/rules` when missing
* set `{{project_rules_file}}` to `{{project_agents_dir}}/rules/project.rules.md` when that is the local convention, otherwise the project rules path the repo already uses under `.agents/`
* add or strengthen a project-local rule restating only the user's durable correction
* do not edit the global skill pack for a project-scoped rule
* append `{{project_rules_file}}` to `{{skill_files_changed}}`
* set `{{publish_mode}}` to `project-local`
* report the project rule path and that no global pack PR is required
* return to the caller

## Classify Skill Targets

* set `{{skill_update_targets}}` to an empty list
* if the correction changes writing, editing, implementation contracts, proof construction, or how workers act under a parent
  * append `self-implement` to `{{skill_update_targets}}`
* if the correction changes review, readiness, blind lanes, verdicts, evidence bars, or what reviewers must falsify
  * append `self-review` to `{{skill_update_targets}}`
* if the correction is an engineering MUST/MUST NOT that both writers and reviewers must share
  * append `engineering-rules` to `{{skill_update_targets}}`
  * append `self-implement` when not already present
  * append `self-review` when not already present
* if the correction changes root coordination, delegation, or non-subagent defaults
  * append `self-orchestrate` to `{{skill_update_targets}}`
* if the correction changes role routing or position detection
  * append `self` to `{{skill_update_targets}}`
* if the correction changes a shared boundary held by every role
  * append `self/references/boundaries.md` to `{{skill_update_targets}}`
* if `{{skill_update_targets}}` is still empty and the correction is durable and global
  * append `self-implement` and `self-review` as the default living pair
* [Resolve Live Skills Root](#resolve-live-skills-root)

## Resolve Live Skills Root

* set `{{live_skills_root}}` to empty
* if `{{skills_root}}` exists and contains `self-implement/SKILL.md` and `self-review/SKILL.md`
  * set `{{live_skills_root}}` to `{{skills_root}}`
* if `{{live_skills_root}}` is empty and `~/.agents/self-agents-live.json` exists
  * read that marker and set `{{live_skills_root}}` to its skills path when present
* if `{{live_skills_root}}` is empty and `~/.agents/repos/self/skills` exists
  * set `{{live_skills_root}}` to `~/.agents/repos/self/skills`
* if `{{live_skills_root}}` is empty and `~/.agents/repos/gabewillen-agents/skills` exists
  * set `{{live_skills_root}}` to `~/.agents/repos/gabewillen-agents/skills`
* if `{{live_skills_root}}` is empty and this checkout has `skills/self-implement/SKILL.md`
  * set `{{live_skills_root}}` to this checkout's `skills` directory
* if `{{live_skills_root}}` is empty
  * set `{{blocker}}` to `cannot resolve live skills root for living skill update`
  * stop and report the missing live root and that the pack needs a live install
* set `{{agents_repo_root}}` to the parent of `{{live_skills_root}}` when that parent is the agents package root
* set `{{live_branch}}` from `~/.agents/self-agents-live.json` `live_branch` when present
* set `{{upstream_base}}` from that marker's `upstream_base` when present, otherwise `main`
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
  * if the correction is language- or framework-specific, edit that language file; otherwise edit `core.rules.md` or `dbc.rules.md`
  * add or strengthen a `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` rule so implement `impl-*` and review `eng-*` both load the same text
  * append the edited path to `{{skill_files_changed}}`
  * return to the caller
* if the target is `self-orchestrate`
  * open `{{live_skills_root}}/self-orchestrate/SKILL.md` or the owning orchestrate workflow
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

* read the current skill or workflow text end-to-end for the owning state
* if an existing bullet or rule already covers the correction but is weaker or ambiguous
  * rewrite that bullet to a stronger, unambiguous MUST-level action or constraint
* if no existing bullet covers the correction
  * add one discrete action bullet or linked workflow step in the owning state, not a rationale paragraph
* keep the global pack **project-agnostic**: no product name, repo path, host, customer, or single-project protocol in the rule text
* keep MDScript shape: one action per bullet, explicit recovery links, no multi-action narration
* do not invent user intent beyond the user's words
* do not add extra MUST rules the user did not state
* append each edited path to `{{skill_files_changed}}`
* return to the caller

## Validate Skill Updates

* run `node {{agents_repo_root}}/scripts/validate-mdscript.mjs {{skill_files_changed paths}}` when `{{agents_repo_root}}` has that script
* if validation fails
  * repair the edited skills
  * [Validate Skill Updates](#validate-skill-updates)
* if `self-implement` or implement engineering-rules assets changed and `test-self-implement-install.mjs` exists
  * run `node {{agents_repo_root}}/scripts/test-self-implement-install.mjs`
* if `self-review` or engineering-rules assets changed and `test-self-review-install.mjs` exists
  * run `node {{agents_repo_root}}/scripts/test-self-review-install.mjs`
* [Publish Living Skill Updates](#publish-living-skill-updates)

## Publish Living Skill Updates

* set `{{publish_mode}}` to `global-pr`
* if `{{live_branch}}` is set
  * ensure the working tree is on `{{live_branch}}` (checkout if needed)
* stage only `{{skill_files_changed}}` under `{{agents_repo_root}}`
* commit on `{{live_branch}}` with a message that names the user correction in one line
* do **not** push to `main` / `{{upstream_base}}` directly from this agent
* after commit, the installed `post-commit` hook pushes `{{live_branch}}` and opens or updates the PR into `{{upstream_base}}` (skip only if `SELF_AGENTS_SKIP_PR_HOOK=1`)
* if the hook is missing, push and open the PR once: `git push -u origin {{live_branch}}` then `gh pr create --base {{upstream_base}} --head {{live_branch}}`
* run `node {{agents_repo_root}}/scripts/install.mjs --live` so agent homes re-link the live branch tip
* if push or PR is blocked by authority or missing credentials
  * leave the files edited and committed locally when possible
  * set `{{skill_publish_blocker}}` to the exact missing publish step
* [Report Living Skill Updates](#report-living-skill-updates)

## Report Living Skill Updates

* report `{{rule_scope}}`, `{{correction_kind}}`, `{{skill_update_summary}}`, `{{skill_update_targets}}`, `{{skill_files_changed}}`, `{{live_branch}}`, validation result, install result, PR URL or `{{skill_publish_blocker}}`
* add a file comment on the active task when a file task exists
* return to the caller
