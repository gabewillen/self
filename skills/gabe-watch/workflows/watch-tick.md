<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Refresh PR State

* re-read every value in this workflow from GitHub on this tick
* do not reuse the previous tick's checks, comments, threads, or verdicts
* set `{{owner}}` and `{{repo_name}}` by splitting `{{repo}}` on `/`
* run `gh pr view {{pr_number}} --repo {{repo}} --json number,url,state,isDraft,mergeable,mergeStateStatus,baseRefName,headRefName,headRefOid,reviewDecision,reviews,latestReviews,comments,statusCheckRollup`
* set `{{pr_state}}`, `{{head_sha}}`, `{{base_ref}}`, `{{head_ref}}`, `{{mergeable}}`, `{{merge_state}}`, `{{review_decision}}`, `{{is_draft}}` from that JSON
* set `{{pr_comments}}` from the `comments` field with author, timestamp, and body
* set `{{review_bodies}}` from `latestReviews` with reviewer, state, submitted time, and body
* [Refresh Checks](#refresh-checks)

## Refresh Checks

* set `{{check_rows}}` from `statusCheckRollup` with name, status, conclusion, and workflowName
* if `{{check_rows}}` is empty
  * run `gh api repos/{{repo}}/commits/{{head_sha}}/check-runs --paginate`
  * set `{{check_rows}}` from `check_runs`
* drop any row whose `head_sha` is not `{{head_sha}}`
* set `{{failing_checks}}` to rows whose conclusion is `FAILURE`, `TIMED_OUT`, `CANCELLED`, or `ACTION_REQUIRED`
* set `{{pending_checks}}` to rows whose status is `QUEUED` or `IN_PROGRESS`
* set `{{ci_summary}}` to counts by conclusion plus the failing check names
* if both commands error
  * set `{{blocker}}` to cannot read CI state for `{{head_sha}}`
  * return to the caller
* if `{{pr_state}}` is `OPEN` and no row was returned by either command
  * set `{{blocker}}` to no checks readable for `{{head_sha}}`
  * do not report the PR as green
  * return to the caller
* [Refresh Review Threads](#refresh-review-threads)

## Refresh Review Threads

* run this query and follow `pageInfo.endCursor` until `hasNextPage` is false:

```bash
gh api graphql -F owner={{owner}} -F repo={{repo_name}} -F number={{pr_number}} -f query='
query($owner:String!,$repo:String!,$number:Int!,$cursor:String){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$number){
      reviewThreads(first:100, after:$cursor){
        pageInfo{ hasNextPage endCursor }
        nodes{
          id isResolved isOutdated isCollapsed path line
          comments(first:50){ nodes{ databaseId author{login} body createdAt } }
        }
      }
    }
  }
}'
```

* set `{{unresolved_threads}}` to nodes where `isResolved` is false, keeping thread id, path, line, and every comment body
* run `gh api repos/{{repo}}/pulls/{{pr_number}}/comments --paginate` and attach each comment to its thread in `{{unresolved_threads}}`
* if the query errors
  * set `{{blocker}}` to cannot read review threads for `{{pr_url}}`
  * do not set `{{unresolved_threads}}` to empty after a failed query
  * return to the caller
* [Compare Against Last Tick](#compare-against-last-tick)

## Compare Against Last Tick

* set `{{new_comments}}` to entries in `{{pr_comments}}`, `{{review_bodies}}`, and `{{unresolved_threads}}` newer than front-matter `last_seen_at`
* if `{{head_sha}}` differs from front-matter `last_head_sha`
  * treat every earlier check result, review, and approval as stale
* set front-matter `last_seen_at` to the newest timestamp read
* set front-matter `last_head_sha` to `{{head_sha}}`
* report checks read, failing, pending, unresolved threads, conversation comments, and reviews as counts
* do not report no new activity unless every fetch in this workflow succeeded
* do not dump full JSON into chat; keep ids, paths, bodies, and check names only
* return to the caller

## Evaluate Merge Ready

* set `{{merge_ready}}` to `false`
* if `{{is_draft}}` is true
  * leave `{{merge_ready}}` false and return
* if `{{mergeable}}` is `CONFLICTING`
  * leave `{{merge_ready}}` false and return
* if `{{review_decision}}` is `CHANGES_REQUESTED`
  * leave `{{merge_ready}}` false and return
* if `{{unresolved_threads}}` is non-empty
  * leave `{{merge_ready}}` false and return
* if `{{failing_checks}}` is non-empty
  * leave `{{merge_ready}}` false and return
* if `{{pending_checks}}` is non-empty
  * leave `{{merge_ready}}` false and return
* set `{{merge_ready}}` to `true`
* return to the caller
