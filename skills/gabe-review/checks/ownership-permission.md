<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Ownership And Permission

* read [Ownership Permission Policy](../references/ownership-permission-policy.md)
* inspect the artifact for separated triage, edits, push, public mutation, CI rerun, merge, release, deployment, close, publication, and live-proof waiver authority
* if default-branch merge is claimed without exact permission
  * add a finding with consequence and evidence pointer
* if subtree code was edited without upstream review ownership
  * add a finding with consequence and evidence pointer
* if review-thread cleanup hides unfinished work
  * add a finding with consequence and evidence pointer
* if public mutation occurred without authority
  * add a finding with consequence and evidence pointer
* if a live-proof waiver was inferred from other permissions
  * add a finding with consequence and evidence pointer
* if work is in a subtree, squashed import, vendored checkout, or embedded upstream repository
  * inspect for the upstream PR/MR issue and review surface for code changes
  * if the upstream review surface is missing for code changes
    * add a finding requiring the upstream PR/MR issue and review surface
* inspect for preserved human Gabe, assistant, automation, worker, reviewer, and author boundaries
* if assistant decisions are attributed to human Gabe
  * add a finding with consequence and evidence pointer
* if automation follow-ups are described as direct human instructions
  * add a finding with consequence and evidence pointer
* if a provenance claim is unsupported by evidence
  * add a finding with consequence and evidence pointer
* if this reviewer role will write a GitLab issue, review, or comment
  * [Prepare GitLab Reviewer Alias](#prepare-gitlab-reviewer-alias)
* return to the caller

## Prepare GitLab Reviewer Alias

* run [Resolve GitLab Sudo Alias](../../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `reviewer`
* run [Use GitLab Sudo Alias Before Public Write](../../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write)
* if the alias or `gitlab-sudo-alias` tooling is unavailable for a required public review record
  * set `{{grade}}` to `Blocked`
  * set `{{blocker}}` to the exact missing GitLab sudo alias capability
  * return to the caller
* return to the caller
