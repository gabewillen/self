<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Refresh PR State

* run `gh pr view {{pr_number}} --repo {{repo}} --json number,url,state,isDraft,mergeable,baseRefName,headRefName,headRefOid,statusCheckRollup,reviewDecision,reviews,comments,latestReviews`
* set `{{pr_state}}`, `{{head_sha}}`, `{{base_ref}}`, `{{head_ref}}`, `{{mergeable}}`, `{{review_decision}}`, `{{is_draft}}` from that JSON
* run `gh api repos/{{repo}}/pulls/{{pr_number}}/comments` and keep only unresolved review comments needed for triage
* run `gh api graphql` for review threads on the PR and set `{{unresolved_threads}}` to threads where `isResolved` is false
* summarize failing or pending checks from `statusCheckRollup` into `{{ci_summary}}` and `{{failing_checks}}`
* do not dump full JSON into chat; keep ids, paths, bodies, and check names only
* return to the caller

## Evaluate Merge Ready

* set `{{merge_ready}}` to `false`
* if `{{is_draft}}` is true
  * leave `{{merge_ready}}` false and return
* if `{{mergeable}}` is `CONFLICTING`
  * leave `{{merge_ready}}` false and return
* if `{{unresolved_threads}}` is non-empty
  * leave `{{merge_ready}}` false and return
* if `{{failing_checks}}` is non-empty
  * leave `{{merge_ready}}` false and return
* if required checks are still pending
  * leave `{{merge_ready}}` false and return
* set `{{merge_ready}}` to `true`
* return to the caller
