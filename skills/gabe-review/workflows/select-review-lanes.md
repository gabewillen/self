<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Review Lanes

* read [Lane Catalog](../references/lane-catalog.md)
* set `{{review_skill_root}}` to this skill's absolute directory when empty
* set `{{engineering_rules_root}}` to `{{review_skill_root}}/references/engineering-rules`
* set `{{blind_reviewers_root}}` to `{{review_skill_root}}/workflows/blind-reviewers`
* set `{{in_scope_paths}}` from the neutral packet, `{{review_diff}}` path list, authorized paths, or current changed files
* set `{{blind_lanes}}` to an empty ordered list
* set `{{lane_selection_reasons}}` to an empty list
* set `{{lane_entrypoints}}` to an empty map from lane id to absolute `path#heading` entry
* [Add Always On Lanes](#add-always-on-lanes)

## Add Always On Lanes

* set `{{candidate_lane}}` to `rules`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/rules.mdscript.md#rules-blind-review`
* set `{{candidate_reason}}` to `always-on agent/repo instruction rules`
* [Add Lane](#add-lane)
* set `{{candidate_lane}}` to `security`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/security.mdscript.md#security-blind-review`
* set `{{candidate_reason}}` to `always-on security`
* [Add Lane](#add-lane)
* set `{{candidate_lane}}` to `completeness`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/completeness.mdscript.md#completeness-blind-review`
* set `{{candidate_reason}}` to `always-on completeness`
* [Add Lane](#add-lane)
* [Add Engineering Core Lanes](#add-engineering-core-lanes)

## Add Engineering Core Lanes

* if the review is code, PR, MR, branch readiness, or live implementation proof
  * set `{{candidate_lane}}` to `eng-core`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-core.mdscript.md#eng-core-blind-review`
  * set `{{candidate_reason}}` to `code or PR readiness`
  * [Add Lane](#add-lane)
  * set `{{candidate_lane}}` to `eng-dbc`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-dbc.mdscript.md#eng-dbc-blind-review`
  * set `{{candidate_reason}}` to `code review applies DBC rules`
  * [Add Lane](#add-lane)
* if the packet, goal, claim, or paths name contract, DBC, proof boundary, schema, IDL, API contract, or Design by Contract
  * set `{{candidate_lane}}` to `eng-dbc`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-dbc.mdscript.md#eng-dbc-blind-review`
  * set `{{candidate_reason}}` to `explicit DBC or contract signal`
  * [Add Lane](#add-lane)
* if paths or packet name actor, run-to-completion, hierarchical state, pipeline pattern, or ECS
  * set `{{candidate_lane}}` to `eng-patterns`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-patterns.mdscript.md#eng-patterns-blind-review`
  * set `{{candidate_reason}}` to `architecture pattern signal`
  * [Add Lane](#add-lane)
* run [Detect Language Lanes](select-language-framework-lanes.md#detect-language-lanes)
* [Detect Hsm Lanes](#detect-hsm-lanes)

## Detect Hsm Lanes

* if `{{hsm_in_scope}}` is empty
  * set `{{hsm_in_scope}}` to `false`
* if any in-scope path defines or changes a state machine by structure, transition tables, event dispatch, behavior-driving mode or phase enums, lifecycle or protocol sequencing, or machine behaviors
  * set `{{hsm_in_scope}}` to `true`
* if the goal, packet, tracker item, or `{{proof_scope}}` names statechart, state machine, HSM, SML, or workflow-state work
  * set `{{hsm_in_scope}}` to `true`
* if the HSM signal is ambiguous
  * set `{{hsm_in_scope}}` to `true`
* if `{{hsm_in_scope}}` is `true`
  * set `{{candidate_lane}}` to `eng-hsm`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-hsm.mdscript.md#eng-hsm-blind-review`
  * set `{{candidate_reason}}` to `HSM rules checklist in scope`
  * [Add Lane](#add-lane)
  * set `{{candidate_lane}}` to `eng-patterns`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-patterns.mdscript.md#eng-patterns-blind-review`
  * set `{{candidate_reason}}` to `HSM implies pattern rules`
  * [Add Lane](#add-lane)
  * set `{{candidate_lane}}` to `hsm`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/hsm.mdscript.md#hsm-blind-review`
  * set `{{candidate_reason}}` to `deep gabe-hsm-review semantic lane`
  * [Add Lane](#add-lane)
* if `{{hsm_in_scope}}` is `false`
  * record in the packet that no HSM lane was selected and why
* [Apply Caller Overrides](#apply-caller-overrides)

## Apply Caller Overrides

* if `{{forced_lanes}}` is set
  * for each lane id in `{{forced_lanes}}`
    * set `{{candidate_lane}}` to that lane id
    * resolve `{{candidate_entry}}` from [Lane Catalog](../references/lane-catalog.md)
    * if `{{candidate_entry}}` is missing
      * set `{{blocker}}` to `unknown forced lane {{candidate_lane}}`
      * stop and report the unknown forced lane
    * set `{{candidate_reason}}` to `caller forced`
    * [Add Lane](#add-lane)
* if `{{excluded_lanes}}` is set
  * remove each excluded lane id from `{{blind_lanes}}`
  * remove matching keys from `{{lane_entrypoints}}`
  * append reason `excluded by caller: {{excluded_lanes}}` to `{{lane_selection_reasons}}`
* [Finalize Lane Selection](#finalize-lane-selection)

## Add Lane

* if `{{candidate_lane}}` is empty
  * stop and report missing candidate lane
* if `{{candidate_entry}}` is empty
  * stop and report missing candidate entry for `{{candidate_lane}}`
* if `{{candidate_lane}}` is already in `{{blind_lanes}}`
  * return to the caller
* if `{{excluded_lanes}}` contains `{{candidate_lane}}`
  * return to the caller
* append `{{candidate_lane}}` to `{{blind_lanes}}`
* set `{{lane_entrypoints}}.{{candidate_lane}}` to `{{candidate_entry}}`
* append `{{candidate_lane}}: {{candidate_reason}}` to `{{lane_selection_reasons}}`
* return to the caller

## Finalize Lane Selection

* if `{{blind_lanes}}` is missing `rules`, `security`, or `completeness`
  * set `{{blocker}}` to `lane selection lost an always-on lane`
  * stop and report the incomplete always-on set
* record `{{blind_lanes}}`, `{{lane_entrypoints}}`, `{{lane_selection_reasons}}`, and `{{hsm_in_scope}}` into the neutral review packet
* record which engineering rule files under `{{engineering_rules_root}}` will be loaded by selected `eng-*` lanes
* return to the caller
