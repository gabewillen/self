<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Review Lanes

* read [Lane Catalog](../references/lane-catalog.md)
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute directory of this skill
* set `{{engineering_rules_root}}` to `{{review_skill_root}}/references/engineering-rules`
* set `{{blind_reviewers_root}}` to `{{review_skill_root}}/workflows/blind-reviewers`
* set `{{lane_selection_reasons}}` to an empty list
* [Resolve Diff Before Selection](#resolve-diff-before-selection)

## Resolve Diff Before Selection

* select lanes only from the diff, not the request narrative, the author summary, a task title, or an earlier round
* if `{{review_diff}}` is already set for this review round
  * [Set In Scope Paths](#set-in-scope-paths)
* if `{{source_repo_root}}` is empty
  * set `{{source_repo_root}}` to the repository root that contains the reviewed artifact
* if the reviewed object is not a change in a Git worktree
  * append `diff skipped: reviewed object is not a Git-tracked change` to `{{lane_selection_reasons}}`
  * [Set In Scope Paths](#set-in-scope-paths)
* if `{{merge_target}}` is unknown
  * set `{{merge_target}}` from the PR base, the MR target, or the default branch
  * if no more specific target exists, set `{{merge_target}}` to `main`
* run [Resolve Review Baseline](rolling-code-review.mdscript.md#resolve-review-baseline)
* append `diff resolved against {{merge_target}} at {{merge_base}} for {{review_diff_scope}} before lane selection` to `{{lane_selection_reasons}}`
* [Set In Scope Paths](#set-in-scope-paths)

## Set In Scope Paths

* if `{{review_diff}}` is set
  * set `{{in_scope_paths}}` to the list of changed paths in `{{review_diff}}`
* if `{{review_diff}}` is empty
  * set `{{in_scope_paths}}` from the neutral packet or the authorized paths
  * append `in-scope paths taken from the packet because no diff exists` to `{{lane_selection_reasons}}`
* if `{{in_scope_paths}}` is empty
  * set `{{blocker}}` to `no in-scope paths for lane selection`
  * report that the lane selection has no scope
  * stop
* set `{{blind_lanes}}` to an empty ordered list
* set `{{lane_entrypoints}}` to an empty map from lane id to absolute `path#heading` entry
* [Classify Review Artifact](#classify-review-artifact)

## Classify Review Artifact

* select only the lanes that the in-scope paths and the packet signals need, not the full lane set
* set `{{code_paths_in_scope}}` to the in-scope paths that are executable source, or build and config files for executable source
* set `{{doc_paths_in_scope}}` to the in-scope MDScript, documentation, plan, task, comment, and publication paths
* set `{{code_change_is_data_only}}` to `false`
* if each changed code path only changes manifest entries, list members, constants, or fixtures, and no control flow changed
  * set `{{code_change_is_data_only}}` to `true`
* set `{{artifact_classes}}` to the classes that are present: `code`, `mdscript-workflow`, `documentation`, `manifest`, `infrastructure`, `publication`
* record `{{artifact_classes}}`, `{{code_paths_in_scope}}`, `{{doc_paths_in_scope}}`, and `{{code_change_is_data_only}}` in the packet as the lane-selection basis
* [Add Always On Lanes](#add-always-on-lanes)

## Add Always On Lanes

* set `{{candidate_lane}}` to `rules`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/rules.mdscript.md#rules-blind-review`
* set `{{candidate_reason}}` to `always-on agent/repo instruction rules`
* run [Add Lane](#add-lane)
* set `{{candidate_lane}}` to `security`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/security.mdscript.md#security-blind-review`
* set `{{candidate_reason}}` to `always-on security`
* run [Add Lane](#add-lane)
* set `{{candidate_lane}}` to `completeness`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/completeness.mdscript.md#completeness-blind-review`
* set `{{candidate_reason}}` to `always-on completeness`
* run [Add Lane](#add-lane)
* [Add MDScript Lane](#add-mdscript-lane)

## Add MDScript Lane

* if no in-scope path is a `SKILL.md` body, a `*.mdscript.md`, or a linked MDScript workflow, check, or template
  * append `mdscript lane skipped: no MDScript in scope` to `{{lane_selection_reasons}}`
  * [Add Engineering Core Lanes](#add-engineering-core-lanes)
* set `{{candidate_lane}}` to `mdscript`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/mdscript.mdscript.md#mdscript-blind-review`
* set `{{candidate_reason}}` to `MDScript in scope: runs the /mdscript-review gates plus execution-path attacks`
* run [Add Lane](#add-lane)
* [Add Engineering Core Lanes](#add-engineering-core-lanes)

## Add Engineering Core Lanes

* if `{{code_paths_in_scope}}` is empty
  * append `eng-* lanes skipped: no executable source in scope ({{artifact_classes}})` to `{{lane_selection_reasons}}`
  * [Detect Hsm Lanes](#detect-hsm-lanes)
* if `{{code_change_is_data_only}}` is `true`
  * [Add Data Only Code Lane](#add-data-only-code-lane)
* if the review is code, PR, MR, branch readiness, or live implementation proof
  * set `{{candidate_lane}}` to `eng-core`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-core.mdscript.md#eng-core-blind-review`
  * set `{{candidate_reason}}` to `code or PR readiness`
  * run [Add Lane](#add-lane)
  * set `{{candidate_lane}}` to `eng-dbc`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-dbc.mdscript.md#eng-dbc-blind-review`
  * set `{{candidate_reason}}` to `code review applies DBC rules`
  * run [Add Lane](#add-lane)
* if the packet, goal, claim, or paths name contract, DBC, proof boundary, schema, IDL, API contract, or Design by Contract
  * set `{{candidate_lane}}` to `eng-dbc`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-dbc.mdscript.md#eng-dbc-blind-review`
  * set `{{candidate_reason}}` to `explicit DBC or contract signal`
  * run [Add Lane](#add-lane)
* if the paths or the packet name actor, run-to-completion, hierarchical state, pipeline pattern, or ECS
  * set `{{candidate_lane}}` to `eng-patterns`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-patterns.mdscript.md#eng-patterns-blind-review`
  * set `{{candidate_reason}}` to `architecture pattern signal`
  * run [Add Lane](#add-lane)
* run [Detect Language Lanes](select-language-framework-lanes.mdscript.md#detect-language-lanes)
* [Detect Hsm Lanes](#detect-hsm-lanes)

## Add Data Only Code Lane

* set `{{candidate_lane}}` to `eng-core`
* set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-core.mdscript.md#eng-core-blind-review`
* set `{{candidate_reason}}` to `manifest or data-only code change: core lane only, no DBC or language lanes`
* run [Add Lane](#add-lane)
* [Detect Hsm Lanes](#detect-hsm-lanes)

## Detect Hsm Lanes

* if `{{hsm_in_scope}}` is empty
  * set `{{hsm_in_scope}}` to `false`
* if an in-scope path defines or changes a state machine structure, a transition table, or event dispatch
  * set `{{hsm_in_scope}}` to `true`
* if an in-scope path defines or changes behavior-driving mode or phase enums, a lifecycle or protocol sequence, or machine behaviors
  * set `{{hsm_in_scope}}` to `true`
* if the goal, packet, tracker item, or `{{proof_scope}}` names statechart, state machine, HSM, SML, or workflow-state work
  * set `{{hsm_in_scope}}` to `true`
* do not set `{{hsm_in_scope}}` to `true` only because of MDScript heading-and-link control flow
* an MDScript workflow is a state machine only if the packet names state-machine work or it drives an executable machine
* if the HSM signal is ambiguous and `{{code_paths_in_scope}}` is not empty
  * set `{{hsm_in_scope}}` to `true`
* if the HSM signal is ambiguous and `{{code_paths_in_scope}}` is empty
  * append `hsm lanes skipped: ambiguous signal with no executable source in scope; caller can force with {{forced_lanes}}` to `{{lane_selection_reasons}}`
* if `{{hsm_in_scope}}` is `true`
  * set `{{candidate_lane}}` to `eng-hsm`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-hsm.mdscript.md#eng-hsm-blind-review`
  * set `{{candidate_reason}}` to `HSM rules checklist in scope`
  * run [Add Lane](#add-lane)
  * set `{{candidate_lane}}` to `eng-patterns`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/eng-patterns.mdscript.md#eng-patterns-blind-review`
  * set `{{candidate_reason}}` to `HSM implies pattern rules`
  * run [Add Lane](#add-lane)
  * set `{{candidate_lane}}` to `hsm`
  * set `{{candidate_entry}}` to `{{blind_reviewers_root}}/hsm.mdscript.md#hsm-blind-review`
  * set `{{candidate_reason}}` to `deep HSM/UML semantic lane (self-review/hsm pack)`
  * run [Add Lane](#add-lane)
* if `{{hsm_in_scope}}` is `false`
  * record in the packet that this review selected no HSM lane, and the reason
* [Apply Caller Overrides](#apply-caller-overrides)

## Apply Caller Overrides

* if `{{forced_lanes}}` is set
  * for each lane id in `{{forced_lanes}}`
    * set `{{candidate_lane}}` to that lane id
    * find `{{candidate_entry}}` in [Lane Catalog](../references/lane-catalog.md)
    * if `{{candidate_entry}}` is not found
      * set `{{blocker}}` to `unknown forced lane {{candidate_lane}}`
      * report the unknown forced lane
      * stop
    * set `{{candidate_reason}}` to `caller forced`
    * run [Add Lane](#add-lane)
* if `{{excluded_lanes}}` is set
  * remove each excluded lane id from `{{blind_lanes}}`
  * remove the keys of the excluded lanes from `{{lane_entrypoints}}`
  * append reason `excluded by caller: {{excluded_lanes}}` to `{{lane_selection_reasons}}`
* [Finalize Lane Selection](#finalize-lane-selection)

## Add Lane

* if `{{candidate_lane}}` or `{{candidate_entry}}` is empty
  * report that the candidate lane or the candidate entry for `{{candidate_lane}}` is empty
  * stop
* if `{{candidate_lane}}` is already in `{{blind_lanes}}`
  * return to the caller
* if `{{excluded_lanes}}` is set and contains `{{candidate_lane}}`
  * return to the caller
* append `{{candidate_lane}}` to `{{blind_lanes}}`
* set `{{lane_entrypoints}}.{{candidate_lane}}` to `{{candidate_entry}}`
* append `{{candidate_lane}}: {{candidate_reason}}` to `{{lane_selection_reasons}}`
* return to the caller

## Finalize Lane Selection

* if `{{blind_lanes}}` does not contain `rules`, `security`, or `completeness`
  * set `{{blocker}}` to `lane selection lost an always-on lane`
  * report the incomplete always-on set
  * stop
* for each lane in `{{blind_lanes}}`
  * make sure that `{{lane_selection_reasons}}` names the in-scope path or packet signal that selected the lane
* remove lanes whose only reason is habit, symmetry with a previous review, or a signal outside `{{in_scope_paths}}` and the packet
* record `{{blind_lanes}}`, `{{lane_entrypoints}}`, `{{lane_selection_reasons}}`, `{{artifact_classes}}`, and `{{hsm_in_scope}}` in the neutral review packet
* record each skipped candidate lane and the reason, so that an auditor can examine the narrower lane set
* record the engineering rule files under `{{engineering_rules_root}}` that the selected `eng-*` lanes will load
* return to the caller
