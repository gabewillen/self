<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Update Living Skills

* set `{{correction_source}}` from the current user message, human correction, named skill gap, failed correction pattern, or file comment that changes how future agents must behave
* if `{{correction_source}}` is empty
  * return to the caller
* set `{{correction_kind}}` to one of `new-rule`, `strengthen`, `disambiguate`, `scope-boundary`, or `remove-ambiguity` from the correction
* set `{{skill_update_summary}}` to one sentence that restates the durable rule without chat-only phrasing
* if the correction is only one-off task direction for this lane and does not change future agent behavior
  * record that no living skill update is needed
  * return to the caller
* [Classify Skill Targets](#classify-skill-targets)

## Classify Skill Targets

* set `{{skill_update_targets}}` to an empty list
* if the correction changes writing, editing, implementation contracts, proof construction, or how workers act under a parent
  * append `gabe-implement` to `{{skill_update_targets}}`
* if the correction changes review, readiness, blind lanes, verdicts, evidence bars, or what reviewers must falsify
  * append `gabe-review` to `{{skill_update_targets}}`
* if the correction is an engineering MUST/MUST NOT that both writers and reviewers must share
  * append `engineering-rules` to `{{skill_update_targets}}`
  * append `gabe-implement` when not already present
  * append `gabe-review` when not already present
* if the correction changes root coordination, delegation, or non-subagent defaults
  * append `gabe-orchestrate` to `{{skill_update_targets}}`
* if the correction changes role routing or position detection
  * append `gabe` to `{{skill_update_targets}}`
* if the correction changes a shared boundary held by every role
  * append `gabe/references/boundaries.md` to `{{skill_update_targets}}`
* if `{{skill_update_targets}}` is still empty and the correction is durable
  * append `gabe-implement` and `gabe-review` as the default living pair
* [Resolve Live Skills Root](#resolve-live-skills-root)

## Resolve Live Skills Root

* set `{{live_skills_root}}` to empty
* if `{{skills_root}}` exists and contains `gabe-implement/SKILL.md` and `gabe-review/SKILL.md`
  * set `{{live_skills_root}}` to `{{skills_root}}`
* if `{{live_skills_root}}` is empty and `~/.agents/gabe-agents-live.json` exists
  * read that marker and set `{{live_skills_root}}` to its skills path when present
* if `{{live_skills_root}}` is empty and `~/.agents/repos/gabewillen-agents/skills` exists
  * set `{{live_skills_root}}` to `~/.agents/repos/gabewillen-agents/skills`
* if `{{live_skills_root}}` is empty and this checkout has `skills/gabe-implement/SKILL.md`
  * set `{{live_skills_root}}` to this checkout's `skills` directory
* if `{{live_skills_root}}` is empty
  * set `{{blocker}}` to `cannot resolve live skills root for living skill update`
  * stop and report the missing live root and that install must be live for skill evolution
* set `{{agents_repo_root}}` to the parent of `{{live_skills_root}}` when that parent is the agents package root
* [Apply Skill Updates](#apply-skill-updates)

## Apply Skill Updates

* set `{{skill_files_changed}}` to an empty list
* for each entry in `{{skill_update_targets}}`
  * [Update One Skill Target](#update-one-skill-target)
* if `{{skill_files_changed}}` is empty
  * stop and report that the correction was classified but no file edit landed
* [Validate Skill Updates](#validate-skill-updates)

## Update One Skill Target

* if the target is `gabe-implement`
  * open `{{live_skills_root}}/gabe-implement/SKILL.md` and the smallest linked implement workflow that owns the rule
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `gabe-review`
  * open `{{live_skills_root}}/gabe-review/SKILL.md` and the smallest linked review check, policy, or blind-lane workflow that owns the rule
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `engineering-rules`
  * open the matching file under `{{live_skills_root}}/gabe-review/references/engineering-rules/`
  * if the correction is language- or framework-specific, edit that language file; otherwise edit `core.rules.md` or `dbc.rules.md`
  * add or strengthen a `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` rule so implement `impl-*` and review `eng-*` both load the same text
  * append the edited path to `{{skill_files_changed}}`
  * return to the caller
* if the target is `gabe-orchestrate`
  * open `{{live_skills_root}}/gabe-orchestrate/SKILL.md` or the owning orchestrate workflow
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `gabe`
  * open `{{live_skills_root}}/gabe/SKILL.md`
  * [Edit Skill For Correction](#edit-skill-for-correction)
* if the target is `gabe/references/boundaries.md`
  * open `{{live_skills_root}}/gabe/references/boundaries.md`
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
* keep MDScript shape: one action per bullet, explicit recovery links, no multi-action narration
* do not put parent/subagent hierarchy only in the YAML description when the body owns that contract
* do not invent human intent beyond the correction evidence
* append each edited path to `{{skill_files_changed}}`
* return to the caller

## Validate Skill Updates

* run `node {{agents_repo_root}}/scripts/validate-mdscript.mjs {{skill_files_changed paths}}` when `{{agents_repo_root}}` has that script
* if validation fails
  * repair the edited skills
  * [Validate Skill Updates](#validate-skill-updates)
* if `gabe-implement` or implement engineering-rules assets changed and `test-gabe-implement-install.mjs` exists
  * run `node {{agents_repo_root}}/scripts/test-gabe-implement-install.mjs`
* if `gabe-review` or engineering-rules assets changed and `test-gabe-review-install.mjs` exists
  * run `node {{agents_repo_root}}/scripts/test-gabe-review-install.mjs`
* [Publish Living Skill Updates](#publish-living-skill-updates)

## Publish Living Skill Updates

* if the live root is a symlink tree from a git checkout of the agents package
  * stage only `{{skill_files_changed}}`
  * commit with a message that names the correction in one line
  * push to the default remote when push is available and not forbidden
* run `node {{agents_repo_root}}/scripts/install.mjs --live` when the install script exists so every agent home picks up the edit
* if commit or push is blocked by authority or missing credentials
  * leave the files edited on disk
  * set `{{skill_publish_blocker}}` to the exact missing publish step
* [Report Living Skill Updates](#report-living-skill-updates)

## Report Living Skill Updates

* report `{{correction_kind}}`, `{{skill_update_summary}}`, `{{skill_update_targets}}`, `{{skill_files_changed}}`, validation result, install result, and commit or `{{skill_publish_blocker}}`
* add a file comment on the active task when a file task exists
* return to the caller
