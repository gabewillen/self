<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Reflect And Learn

* this is an MDScript-only learn pass — not a skill role and not a parent-required worker
* set `{{skills_root}}` to `{{repo_root}}/skills` when that directory exists, otherwise `~/.agents/skills`
* set `{{learn_mdscript}}` to `{{skills_root}}/gabe-common/workflows/gabe-learn.mdscript.md`
* set `{{learn_pass_path}}` from the stop-hook stamp path when the stop follow-up named one, otherwise empty
* set `{{learn_findings}}` to an empty list
* set `{{learn_loop_count}}` from the stop-hook stamp when present, otherwise `0`
* reflect on this turn's human messages, corrections, skill gaps, failed correction patterns, and any rule that was missing, weak, or ambiguous
* for each durable lesson that changes how future agents must write, edit, review, route, or coordinate
  * append one finding with `summary`, `kind` (`new-rule` | `strengthen` | `disambiguate` | `scope-boundary` | `remove-ambiguity`), and `targets` to `{{learn_findings}}`
* if `{{learn_findings}}` is empty
  * set `{{learn_status}}` to `nothing-to-learn`
  * [Mark Learn Pass Complete](#mark-learn-pass-complete)
* set `{{learn_status}}` to `updating`
* [Apply Findings](#apply-findings)

## Apply Findings

* set `{{correction_source}}` to the first finding in `{{learn_findings}}`
* set `{{correction_kind}}` to that finding's `kind`
* set `{{skill_update_summary}}` to that finding's `summary`
* run [Update Living Skills](update-living-skills.md#update-living-skills)
* remove that finding from `{{learn_findings}}`
* if more findings remain in `{{learn_findings}}`
  * [Apply Findings](#apply-findings)
* set `{{learn_status}}` to `updated`
* [Mark Learn Pass Complete](#mark-learn-pass-complete)

## Mark Learn Pass Complete

* if `{{learn_pass_path}}` is empty
  * resolve `{{learn_pass_path}}` under the agent project home at `learn/<conversation_id>.json` when the conversation id is known
* write a JSON stamp to `{{learn_pass_path}}` with `status: "satisfied"`, `conversation_id`, `loop_count: {{learn_loop_count}}`, `learn_status: {{learn_status}}`, and `completed_at` as ISO time
* report `learn_status={{learn_status}}` and any `{{skill_files_changed}}` or that nothing durable needed a skill update
* stop
