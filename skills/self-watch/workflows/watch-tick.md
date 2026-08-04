<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Refresh PR State

* re-read every value in this workflow from GitHub on this tick
* do not reuse the previous tick's checks, comments, threads, or verdicts
* set `{{owner}}` and `{{repo_name}}` by splitting `{{repo}}` on `/`
* run `gh pr view {{pr_number}} --repo {{repo}} --json number,url,state,isDraft,mergeable,mergeStateStatus,baseRefName,headRefName,headRefOid,reviewDecision,reviews,latestReviews,comments,statusCheckRollup`
* set `{{pr_state}}`, `{{head_sha}}`, `{{base_ref}}`, `{{head_ref}}`, `{{mergeable}}`, `{{merge_state}}`, `{{review_decision}}`, `{{is_draft}}` from that JSON
* read all three comment surfaces: inline review threads, PR-level comments, and review bodies
* set `{{pr_comments}}` from the `comments` field with author, timestamp, and body
* set `{{review_bodies}}` from the `reviews` field with reviewer, state, submitted time, and body
* do not take review bodies from `latestReviews`
* if `{{pr_comments}}` or `{{review_bodies}}` looks truncated
  * run `gh api repos/{{repo}}/issues/{{pr_number}}/comments --paginate` for PR-level comments
  * run `gh api repos/{{repo}}/pulls/{{pr_number}}/reviews --paginate` for review bodies
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
* run `gh api repos/{{repo}}/pulls/{{pr_number}}/comments --paginate` for inline review comments
* attach each inline comment to its thread in `{{unresolved_threads}}`
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
* report checks read, failing, pending, unresolved threads, PR-level comments, and review bodies as counts
* if `{{pending_checks}}` is non-empty
  * report every comment and thread count as provisional for this tick
  * do not state a final unresolved-thread count while checks are still running
  * expect review bots to post after their checks finish
* do not report no new activity unless every fetch in this workflow succeeded
* name the three surfaces read in the tick report: inline threads, PR-level comments, and review bodies
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

## Watch Tick

* set `{{blocker}}` to empty at the start of every tick so a blocker restored from front matter cannot satisfy a later `set {{blocker}}` guard
* touch `{{agent_heartbeat}}` at the start of every tick so the ticker's idle guard stays satisfied
* increment `{{tick_count}}` and set it in `{{watch_mdscript}}` front matter with `last_head_sha`, `last_tick_at`, `last_seen_at`, and `last_processed_seq`
* run [Refresh PR State](#refresh-pr-state), which re-reads checks, review threads, and conversation comments from GitHub on every tick
* if [Refresh PR State](#refresh-pr-state) set `{{blocker}}`
  * [Report Blocker](#report-blocker)
* if `{{pr_state}}` is `MERGED` or `CLOSED`
  * set `{{stop_reason}}` to PR `{{pr_state}}`
  * run [Stop Watch Loop](../../self-unwatch/SKILL.md#stop-watch-loop)
  * report that the PR ended and the watch stopped
  * stop
* run [Sync Branch](sync-branch.md#sync-branch)
* if sync sets `{{blocker}}`
  * [Report Blocker](#report-blocker)
* run [Repair CI](repair-ci.md#repair-ci)
* if CI repair sets a hard `{{blocker}}` that needs human authority
  * [Report Blocker](#report-blocker)
* run [Triage Review Comments](triage-review-comments.md#triage-review-comments)
* if triage left actionable items in `{{pending_fixes}}`
  * run [Dispatch Fixes](fix-with-subagent.md#dispatch-fixes)
* run [Evaluate Merge Ready](#evaluate-merge-ready)
* if `{{merge_ready}}` is `true`
  * report merge-ready status for `{{pr_url}}` — keep watching until `/self-unwatch`
* report the tick as work already done: fixes applied, commits pushed, threads resolved, checks requeued, and what remains outside the grant
* do not end a tick with a proposal, a permission request, or work deferred to the next tick when the action was inside `{{watch_grant}}`
* if the tick surfaced an ambiguous call
  * resolve it through the `self` skill and act
  * do not park it as a question
* append one ledger line under `~/.agents/projects/{{project_name}}/lane-ledger.jsonl` with tick, head SHA, CI summary, unresolved thread count, `ticker_pid`, wake path, and that the detached ticker remains armed
* never kill, reap, or clean up the ticker, its process group, its spool, or its pid file from a tick, a resume, a subagent, a thread-cleanup pass, or an end-of-turn tidy; only `/self-unwatch`, a terminal PR state, or owner-process death may stop it
* end the turn without re-arming, without `sleep`, and without a one-shot wake — the detached ticker owns the next tick

## Report Blocker

* before reporting any blocker, confirm the item is truly in `{{grant_excludes}}` or genuinely undecidable; if the `self` skill and current evidence can decide it, act instead of reporting
* set front-matter `blocker` on `{{watch_mdscript}}` to the exact human decision needed
* write a parent-visible note naming `{{blocker}}`, `{{pr_url}}`, current head, `ticker_pid`, and `{{watch_mdscript}}`
* keep front-matter `watch_active: true` and leave the persistent loop running unless the user runs `/self-unwatch`
* keep repairing everything else inside the grant while the blocker waits — one blocked item never pauses the whole watch
* ask the user only the specific decision that is blocked
* end the turn without killing the loop and without re-arming
