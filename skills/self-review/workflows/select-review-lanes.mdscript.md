<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Select Review Lanes

* set `{{review_skill_root}}` to this skill's directory if it is empty
* if `{{review_diff}}` is empty and the object is a Git change, run [Resolve Review Baseline](rolling-code-review.mdscript.md#resolve-review-baseline)
* set `{{in_scope_paths}}` to the changed paths of `{{review_diff}}`
  * if the object is not a Git change, take them from the packet, and record why
  * if none exist, stop and report that the selection has no scope
* set `{{code_paths_in_scope}}` to the executable source and its build files in scope
* set `{{blind_lanes}}` from the [lane catalog](../references/lane-catalog.md):
  * always `rules`, `security`, and `completeness`
  * `mdscript` if a `SKILL.md` or `*.mdscript.md` is in scope
  * if `{{code_paths_in_scope}}` is not empty, `eng-core`, then:
    * if only manifests, constants, lists, or fixtures changed, stop at `eng-core`
    * otherwise add `eng-<pack>` for each matched pack of the [rule pack catalog](../../self-implement/references/implementation-rules-catalog.md)
    * add its "Also selects" packs too
  * if a state machine changes in code, or the packet names state machine work
    * set `{{hsm_in_scope}}` to `true`, and add `eng-hsm`, `eng-patterns`, and `hsm`
  * add `{{forced_lanes}}`, and remove `{{excluded_lanes}}`
* if `rules`, `security`, or `completeness` is missing, stop and report it
* set `{{lane_entrypoints}}` from the catalog entry of each lane
* record `{{blind_lanes}}`, each lane's reason, each skipped lane's reason, and the rule files in the packet
* return to the caller
