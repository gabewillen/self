<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Prepare MR Or PR

* set `{{self_review_required}}` to `true`, because this step creates or changes a pull/merge request
* if multi-lane self-review is not complete for the current head with an accepted review gate for this PR/MR change
  * run [Use Multi-Lane Review](recursive-blind-review-loop.mdscript.md#use-multi-lane-review)
  * if the review gate is blocked
    * report the blocker before you open or change the PR/MR
    * stop
* create or change the issue and the MR/PR that `{{tracker}}`, `{{repository}}`, and the local instructions make necessary

* run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `implementer`

* before you write GitLab issue text, a review response, or a comment from this worker role
  * run [Use GitLab Sudo Alias Before Public Write](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)

* before you push the head that this MR/PR will carry
  * run [Commit Atomically](commit-atomically.mdscript.md#commit-atomically)

* keep the MR/PR title, description, commits, evidence links, review status, and residual risk current

* if the MR/PR is ready, and no explicit blocker, absent proof, user instruction, or repository rule makes draft necessary
  * do not leave the MR/PR in draft

* do not keep an MR/PR in draft only because CI/CD or checks are pending or failed

* report the check state separately
* if the delegation asks for a default-branch merge as the next action
  * treat the check state as a default-branch merge blocker
* if the delegation does not ask for a default-branch merge as the next action
  * do not treat the check state as a default-branch merge blocker

* find the implementation agent, review agent, leased reviewer, and goal-resumed lane identities
* tell the orchestrator to watch the MR/PR comments of these identities

* if CI/CD, checks, review requests, reviewer grades, or unresolved discussions are pending after you create or change the MR/PR
  * run [Create MR Monitor Goal](mr-monitor.mdscript.md#create-mr-monitor-goal)
  * record the ten-minute goal resume/check state in the lane ledger or handoff
  * if the user does not explicitly ask for an external automation
    * do not create an external automation

* if you do not have the authority for a push, public comment, CI rerun, or MR/PR creation
  * set `{{blocker}}` to the exact authority that is absent
  * set `{{stop_reason}}` to `authority-boundary`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
