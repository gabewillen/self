<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Ownership And Permission

* separate triage, edits, push, public mutation, CI rerun, merge, release, deployment, close, publication, and live-proof waiver authority

* add findings for default-branch merges without exact permission, subtree code edited without upstream review ownership, review-thread cleanup that hides unfinished work, public mutation without authority, or live-proof waivers inferred from other permissions

* if work is in a subtree, squashed import, vendored checkout, or embedded upstream repository
  * require the upstream PR/MR issue and review surface for code changes

* preserve human Gabe, assistant, automation, worker, reviewer, and author boundaries

* for GitLab issue, review, or comment writes from this reviewer role
  * run [Resolve GitLab Sudo Alias](../../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `reviewer`
  * run [Use GitLab Sudo Alias Before Public Write](../../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write)
  * if the alias or `gitlab-sudo-alias` tooling is unavailable for a required public review record
    * set `{{grade}}` to `Blocked`
    * set `{{blocker}}` to the exact missing GitLab sudo alias capability

* add findings for assistant decisions attributed to human Gabe, automation follow-ups described as direct human instructions, or provenance claims unsupported by evidence
