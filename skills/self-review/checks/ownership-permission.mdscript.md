<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Ownership And Permission

* read [Ownership Permission Policy](../references/ownership-permission-policy.md)
* examine the artifact for separate authority for triage, edits, push, public mutation, and CI rerun
* examine the artifact for separate authority for merge, release, deployment, close, publication, and live-proof waiver
* if the artifact claims a default-branch merge without exact permission
  * add a finding with the consequence and an evidence pointer
* if the author edited subtree code without upstream review ownership
  * add a finding with the consequence and an evidence pointer
* if review-thread cleanup hides unfinished work
  * add a finding with the consequence and an evidence pointer
* if a public mutation occurred without authority
  * add a finding with the consequence and an evidence pointer
* if a live-proof waiver comes only from other permissions
  * add a finding with the consequence and an evidence pointer
* if work is in a subtree, squashed import, vendored checkout, or embedded upstream repository
  * examine the code changes for the upstream PR/MR issue and review surface
  * if the code changes have no upstream review surface
    * add a finding that asks for the upstream PR/MR issue and review surface
* examine whether the artifact keeps the boundaries between user, assistant, automation, worker, reviewer, and author
* if the artifact attributes assistant decisions to the user
  * add a finding with the consequence and an evidence pointer
* if the artifact describes automation follow-ups as direct human instructions
  * add a finding with the consequence and an evidence pointer
* if no evidence supports a provenance claim
  * add a finding with the consequence and an evidence pointer
* if this reviewer role will write a GitLab issue, review, or comment
  * [Prepare GitLab Reviewer Alias](#prepare-gitlab-reviewer-alias)
* return to the caller

## Prepare GitLab Reviewer Alias

* run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `reviewer`
* run [Use GitLab Sudo Alias Before Public Write](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
* if the alias or the `gitlab-sudo-alias` tools are not available for a necessary public review record
  * set `{{grade}}` to `Blocked`
  * set `{{blocker}}` to the exact missing GitLab sudo alias capability
  * return to the caller
* return to the caller
