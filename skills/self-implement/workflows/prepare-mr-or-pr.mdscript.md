<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Prepare MR Or PR

* run [Decide Self Review](../../self-common/workflows/self-review-consent.mdscript.md#decide-self-review)
* if `{{review_gate}}` is `awaiting-user-self-review-decision`, stop
* if `{{self_review_required}}` is `true` and the current head has no complete review
  * run [Use Multi-Lane Review](recursive-blind-review-loop.mdscript.md#use-multi-lane-review)
  * if the gate is blocked, report it before you open or change the PR, and stop
* otherwise write `review_gate={{review_gate}}` in the PR evidence
* if you have no authority to push, comment, rerun CI, or open the PR
  * set `{{blocker}}` to it, set `{{stop_reason}}` to `authority-boundary`, and run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
* run [Commit Atomically](commit-atomically.mdscript.md#commit-atomically) before you push
* create or change the issue and the PR that the tracker, the repository, and the local rules need
* for GitLab, run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) as `implementer`, and write through [Use GitLab Sudo Alias Before Public Write](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
* keep the title, description, commits, evidence, review status, and residual risk current
* do not leave a ready PR in draft only because checks are pending or failed
* report the check state on its own
* treat the check state as a blocker only for a default-branch merge
* if checks, reviews, or discussions are pending, run [Create MR Monitor Goal](mr-monitor.mdscript.md#create-mr-monitor-goal)
