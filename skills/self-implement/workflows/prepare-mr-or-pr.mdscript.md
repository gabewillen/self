<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Prepare MR Or PR

* set `{{self_review_required}}` to `true` because this step creates or updates a pull/merge request
* if multi-lane self-review has not completed for the current head with an accepted review gate for this PR/MR create or update
  * run [Use Multi-Lane Review](recursive-blind-review-loop.mdscript.md#use-multi-lane-review)
  * if the review gate is blocked, stop and report the blocker before opening or updating the PR/MR
* create or update the issue and MR/PR required by `{{tracker}}`, `{{repository}}`, and local instructions

* run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `implementer`

* run [Use GitLab Sudo Alias Before Public Write](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write) before writing any GitLab issue text, review response, or comment from this worker role

* run [Commit Atomically](commit-atomically.mdscript.md#commit-atomically) before pushing the head this MR/PR will carry

* keep MR/PR title, description, commits, evidence links, review status, and residual risk current

* do not leave an MR/PR in draft once ready unless an explicit blocker, missing proof, user instruction, or repository rule requires draft

* do not keep an MR/PR in draft solely because CI/CD or checks are pending or failing

* report check state separately and treat it as a default-branch merge blocker only when default-branch merge is the requested next action

* identify implementation agent, review agent, leased reviewer, and goal-resumed lane identities whose MR/PR comments the orchestrator should watch

* if CI/CD, checks, review requests, reviewer grades, or unresolved discussions are pending after creating or updating the MR/PR
  * run [Create MR Monitor Goal](mr-monitor.mdscript.md#create-mr-monitor-goal)
  * record the ten-minute goal resume/check state in the lane ledger or handoff
  * do not create an external automation unless the user explicitly requests one

* if push, public comment, CI rerun, or MR/PR creation authority is missing
  * set `{{blocker}}` to the exact missing authority
  * set `{{stop_reason}}` to `authority-boundary`
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
