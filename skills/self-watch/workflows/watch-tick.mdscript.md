<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Refresh PR State

* read each value in this workflow from GitHub again on this tick
* do not use the checks, comments, threads, or verdicts of the previous tick again
* set `{{owner}}` and `{{repo_name}}` from the two parts of `{{repo}}` at `/`
* run `gh pr view {{pr_number}} --repo {{repo}} --json number,url,state,isDraft,mergeable,mergeStateStatus,baseRefName,headRefName,headRefOid,reviewDecision,reviews,latestReviews,comments,statusCheckRollup`
* set `{{pr_state}}`, `{{head_sha}}`, `{{base_ref}}`, `{{head_ref}}`, `{{mergeable}}`, `{{merge_state}}`, `{{review_decision}}`, `{{is_draft}}` from that JSON
* read all three comment surfaces: inline review threads, PR-level comments, and review bodies
* set `{{pr_comments}}` from the `comments` field with the author, timestamp, and body
* set `{{review_bodies}}` from the `reviews` field with the reviewer, state, submitted time, and body
* do not take review bodies from `latestReviews`
* if `{{pr_comments}}` or `{{review_bodies}}` looks truncated
  * run `gh api repos/{{repo}}/issues/{{pr_number}}/comments --paginate` for PR-level comments
  * run `gh api repos/{{repo}}/pulls/{{pr_number}}/reviews --paginate` for review bodies
* [Refresh Checks](#refresh-checks)

## Refresh Checks

* set `{{check_rows}}` from `statusCheckRollup` with the name, status, conclusion, and workflowName
* if `{{check_rows}}` is empty
  * run `gh api repos/{{repo}}/commits/{{head_sha}}/check-runs --paginate`
  * set `{{check_rows}}` from `check_runs`
* drop each row whose `head_sha` is not `{{head_sha}}`
* set `{{failing_checks}}` to the rows whose conclusion is `FAILURE`, `TIMED_OUT`, `CANCELLED`, or `ACTION_REQUIRED`
* set `{{pending_checks}}` to the rows whose status is `QUEUED` or `IN_PROGRESS`
* set `{{ci_summary}}` to the counts for each conclusion and the names of the failed checks
* if the two commands give errors
  * set `{{blocker}}` to cannot read CI state for `{{head_sha}}`
  * return to the caller
* if `{{pr_state}}` is `OPEN` and the two commands gave no rows
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

* set `{{unresolved_threads}}` to the nodes where `isResolved` is false
* keep the thread id, path, line, and each comment body for these nodes
* run `gh api repos/{{repo}}/pulls/{{pr_number}}/comments --paginate` for inline review comments
* attach each inline comment to its thread in `{{unresolved_threads}}`
* if the query gives an error
  * set `{{blocker}}` to cannot read review threads for `{{pr_url}}`
  * do not set `{{unresolved_threads}}` to empty after a failed query
  * return to the caller
* [Compare Against Last Tick](#compare-against-last-tick)

## Compare Against Last Tick

* set `{{new_comments}}` to the entries in `{{pr_comments}}`, `{{review_bodies}}`, and `{{unresolved_threads}}` that are newer than the front-matter `last_seen_at`
* if `{{head_sha}}` is not the same as the front-matter `last_head_sha`
  * treat each earlier check result, review, and approval as stale
* set the front-matter `last_seen_at` to the newest timestamp that you read
* set the front-matter `last_head_sha` to `{{head_sha}}`
* report the counts of read checks, failed checks, checks not complete, unresolved threads, PR-level comments, and review bodies
* if `{{pending_checks}}` is not empty
  * report each comment and thread count as provisional for this tick
  * do not give a final count of unresolved threads while checks still run
  * expect review bots to post after their checks are complete
* if a fetch in this workflow failed
  * do not report "no new activity"
* in the tick report, name the three surfaces that you read: inline threads, PR-level comments, and review bodies
* do not put full JSON into the chat
* keep only the ids, paths, bodies, and check names
* return to the caller

## Evaluate Merge Ready

* set `{{merge_ready}}` to `false`
* if `{{is_draft}}` is true
  * keep `{{merge_ready}}` false and return
* if `{{mergeable}}` is `CONFLICTING`
  * keep `{{merge_ready}}` false and return
* if `{{review_decision}}` is `CHANGES_REQUESTED`
  * keep `{{merge_ready}}` false and return
* if `{{unresolved_threads}}` is not empty
  * keep `{{merge_ready}}` false and return
* if `{{failing_checks}}` is not empty
  * keep `{{merge_ready}}` false and return
* if `{{pending_checks}}` is not empty
  * keep `{{merge_ready}}` false and return
* set `{{merge_ready}}` to `true`
* return to the caller

## Watch Tick

* at the start of each tick, set `{{blocker}}` to empty
* then a blocker from the front matter cannot satisfy a later `set {{blocker}}` guard
* at the start of each tick, touch `{{agent_heartbeat}}` to satisfy the ticker idle guard
* increment `{{tick_count}}`
* set `tick_count`, `last_head_sha`, `last_tick_at`, `last_seen_at`, and `last_processed_seq` in the `{{watch_mdscript}}` front matter
* run [Refresh PR State](#refresh-pr-state)
* this reads the checks, review threads, and conversation comments from GitHub again on each tick
* if [Refresh PR State](#refresh-pr-state) set `{{blocker}}`
  * [Report Blocker](#report-blocker)
* if `{{pr_state}}` is `MERGED` or `CLOSED`
  * set `{{stop_reason}}` to PR `{{pr_state}}`
  * run [Stop Watch Loop](../../self-unwatch/SKILL.md#stop-watch-loop)
  * report that the PR ended and that the watch stopped
  * stop
* run [Sync Branch](sync-branch.mdscript.md#sync-branch)
* if the sync sets `{{blocker}}`
  * [Report Blocker](#report-blocker)
* run [Repair CI](repair-ci.mdscript.md#repair-ci)
* if the CI repair sets a hard `{{blocker}}` that must have human authority
  * [Report Blocker](#report-blocker)
* run [Triage Review Comments](triage-review-comments.mdscript.md#triage-review-comments)
* if the triage put actionable items in `{{pending_fixes}}`
  * run [Dispatch Fixes](fix-with-subagent.mdscript.md#dispatch-fixes)
* run [Evaluate Merge Ready](#evaluate-merge-ready)
* if `{{merge_ready}}` is `true`
  * report the merge-ready status for `{{pr_url}}`
  * continue the watch until `/self-unwatch`
* report the tick as work that is done: the applied fixes, pushed commits, resolved threads, and requeued checks
* in the tick report, also tell what remains outside the grant
* if an action was inside `{{watch_grant}}`
  * do not end a tick with a proposal, a permission request, or that work moved to the next tick
* if the tick found an unclear decision
  * make the decision through the `self` skill and act
  * do not keep it as a question
* append one ledger line to `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with these items:
  * the tick, the head SHA, the CI summary, and the unresolved thread count
  * `ticker_pid`, the wake path, and the statement that the detached ticker stays armed
* never kill or clean up the ticker, its process group, its spool, or its pid file
* this rule applies to a tick, a resume, a subagent, a thread cleanup pass, and an end-of-turn tidy
* only `/self-unwatch`, a terminal PR state, or the death of the owner process can stop the ticker
* do not re-arm the ticker, do not use `sleep`, and do not set a one-shot wake
* let the detached ticker start the next tick
* end the turn

## Report Blocker

* before you report a blocker, make sure that the item is really in `{{grant_excludes}}` or that nobody can decide it
* if the `self` skill and the current evidence can decide it
  * act and do not report the blocker
* set the front-matter `blocker` in `{{watch_mdscript}}` to the exact human decision that is necessary
* write a note that the parent can see, with `{{blocker}}`, `{{pr_url}}`, the current head, `ticker_pid`, and `{{watch_mdscript}}`
* keep the front-matter `watch_active: true`
* keep the persistent loop alive until the user runs `/self-unwatch`
* while the blocker waits, continue to repair all other items inside the grant
* one blocked item never pauses the full watch
* ask the user only for the specific decision that is blocked
* do not kill the loop and do not re-arm it
* end the turn
