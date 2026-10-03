<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Implementation Rules

* read [Implementation Rules Catalog](../references/implementation-rules-catalog.md)
* if `{{implement_skill_root}}` is empty
  * set `{{implement_skill_root}}` to the absolute directory of this skill
* if `{{skills_root}}` is empty
  * set `{{skills_root}}` to the parent of `{{implement_skill_root}}`
* if the `{{skills_root}}/self-review` directory exists
  * set `{{review_skill_root}}` to `{{skills_root}}/self-review`
* if `{{review_skill_root}}` is empty and the `{{implement_skill_root}}/../self-review` directory exists
  * set `{{review_skill_root}}` to `{{implement_skill_root}}/../self-review`
* if `{{review_skill_root}}` is still empty, or its directory does not exist
  * set `{{blocker}}` to `self-review skill root missing; cannot load engineering-rules packs`
  * report that self-implement must have the vendored engineering-rules of self-review
  * stop
* set `{{engineering_rules_root}}` to `{{review_skill_root}}/references/engineering-rules`
* set `{{impl_rules_root}}` to `{{implement_skill_root}}/workflows/engineering-rules`
* set `{{in_scope_paths}}` from the file task, claim paths, current diff, authorized paths, or files that this lane will edit
* set `{{impl_rule_packs}}` to an empty ordered list
* set `{{impl_pack_reasons}}` to an empty list
* set `{{impl_pack_entrypoints}}` to an empty map from pack id to absolute `path#heading` entry
* set `{{impl_pack_rules_files}}` to an empty map from pack id to absolute rules file path
* [Add Always On Packs](#add-always-on-packs)

## Add Always On Packs

* if the work is code, a PR/MR, branch readiness, or live implementation
  * set `{{candidate_pack}}` to `impl-core`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-core.mdscript.md#impl-core-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/core.rules.md`
  * set `{{candidate_reason}}` to `code or implementation edit`
  * [Add Pack](#add-pack)
  * set `{{candidate_pack}}` to `impl-dbc`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-dbc.mdscript.md#impl-dbc-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/dbc.rules.md`
  * set `{{candidate_reason}}` to `code work applies DBC construction rules`
  * [Add Pack](#add-pack)
* if the claim, goal, or paths name contract, DBC, proof boundary, schema, IDL, API contract, or Design by Contract
  * set `{{candidate_pack}}` to `impl-dbc`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-dbc.mdscript.md#impl-dbc-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/dbc.rules.md`
  * set `{{candidate_reason}}` to `explicit DBC or contract signal`
  * [Add Pack](#add-pack)
* if the paths or the claim name actor, run-to-completion, hierarchical state, pipeline pattern, or ECS
  * set `{{candidate_pack}}` to `impl-patterns`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-patterns.mdscript.md#impl-patterns-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/patterns.rules.md`
  * set `{{candidate_reason}}` to `architecture pattern signal`
  * [Add Pack](#add-pack)
* run [Detect Language Packs](select-language-framework-rules.mdscript.md#detect-language-packs)
* [Detect Hsm Packs](#detect-hsm-packs)

## Detect Hsm Packs

* if `{{hsm_in_scope}}` is empty
  * set `{{hsm_in_scope}}` to `false`
* if an in-scope path defines or changes a state machine through its structure, transition tables, or event dispatch
  * set `{{hsm_in_scope}}` to `true`
* if an in-scope path defines or changes a state machine through behavior-driving mode or phase enums
  * set `{{hsm_in_scope}}` to `true`
* if an in-scope path defines or changes a state machine through a lifecycle or protocol sequence, or machine behaviors
  * set `{{hsm_in_scope}}` to `true`
* if the goal, claim, tracker item, or `{{claim_scope}}` names statechart, state machine, HSM, SML, or workflow-state work
  * set `{{hsm_in_scope}}` to `true`
* if the HSM signal is ambiguous
  * set `{{hsm_in_scope}}` to `true`
* if `{{hsm_in_scope}}` is `true`
  * set `{{candidate_pack}}` to `impl-hsm`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-hsm.mdscript.md#impl-hsm-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/hsm.rules.md`
  * set `{{candidate_reason}}` to `HSM construction rules in scope`
  * [Add Pack](#add-pack)
  * set `{{candidate_pack}}` to `impl-patterns`
  * set `{{candidate_entry}}` to `{{impl_rules_root}}/impl-patterns.mdscript.md#impl-patterns-apply`
  * set `{{candidate_rules}}` to `{{engineering_rules_root}}/patterns.rules.md`
  * set `{{candidate_reason}}` to `HSM implies pattern rules`
  * [Add Pack](#add-pack)
* if `{{hsm_in_scope}}` is `false`
  * record that the selection has no HSM construction pack
  * record the reason
* [Apply Caller Overrides](#apply-caller-overrides)

## Apply Caller Overrides

* if `{{forced_impl_packs}}` is set
  * for each pack id in `{{forced_impl_packs}}`
    * set `{{candidate_pack}}` to that pack id
    * resolve `{{candidate_entry}}` and `{{candidate_rules}}` from [Implementation Rules Catalog](../references/implementation-rules-catalog.md)
    * if `{{candidate_entry}}` is empty
      * set `{{blocker}}` to `unknown forced impl pack {{candidate_pack}}`
      * report the unknown forced pack
      * stop
    * set `{{candidate_reason}}` to `caller forced`
    * [Add Pack](#add-pack)
* if `{{excluded_impl_packs}}` is set
  * remove each excluded pack id from `{{impl_rule_packs}}`
  * remove the keys that match from `{{impl_pack_entrypoints}}` and `{{impl_pack_rules_files}}`
  * append reason `excluded by caller: {{excluded_impl_packs}}` to `{{impl_pack_reasons}}`
* [Finalize Pack Selection](#finalize-pack-selection)

## Add Pack

* if `{{candidate_pack}}` is empty
  * report that the candidate pack is absent
  * stop
* if `{{candidate_entry}}` is empty
  * report that the candidate entry for `{{candidate_pack}}` is absent
  * stop
* if `{{candidate_rules}}` is empty
  * report that the rules file for `{{candidate_pack}}` is absent
  * stop
* if `{{candidate_pack}}` is already in `{{impl_rule_packs}}`
  * return to the caller
* if `{{excluded_impl_packs}}` contains `{{candidate_pack}}`
  * return to the caller
* if `{{candidate_rules}}` does not exist
  * set `{{blocker}}` to `missing engineering rules file {{candidate_rules}} for {{candidate_pack}}`
  * report the absent rules file
  * stop
* append `{{candidate_pack}}` to `{{impl_rule_packs}}`
* set `{{impl_pack_entrypoints}}.{{candidate_pack}}` to `{{candidate_entry}}`
* set `{{impl_pack_rules_files}}.{{candidate_pack}}` to `{{candidate_rules}}`
* append `{{candidate_pack}}: {{candidate_reason}}` to `{{impl_pack_reasons}}`
* return to the caller

## Finalize Pack Selection

* if the work is code and `{{impl_rule_packs}}` does not have `impl-core`
  * set `{{blocker}}` to `implementation rule selection lost always-on impl-core`
  * report the incomplete always-on set
  * stop
* record `{{impl_rule_packs}}`, `{{impl_pack_entrypoints}}`, `{{impl_pack_rules_files}}`, `{{impl_pack_reasons}}`, and `{{hsm_in_scope}}` on the file task
* return to the caller
