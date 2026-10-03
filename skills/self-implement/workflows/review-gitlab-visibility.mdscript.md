<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Require GitLab Review Visibility

* if the work has no GitLab issue or MR
  * return to the caller

* make reviewer grades, findings, questions, answers, fix responses, evidence links, and resolution visible on the GitLab issue or MR

* tell reviewers to use `gitlab-sudo-alias` with an alias that ends in `-reviewer`
* make sure that reviewers use that alias before they author their own sanitized GitLab issue, review, or comment records

* make sure that the implementer wrote the implementer issue, review, and comment records through the `-implementor` alias

* make sure that each reviewer wrote the reviewer records through the `-reviewer` alias

* resolve a thread only after a fix, a withdrawal, or an explicit acceptance closes its concern

* if the necessary GitLab visibility is absent
  * set `{{blocker}}` to the GitLab visibility record that is absent
  * run [Report To Orchestrator](report-to-orchestrator.mdscript.md#report-to-orchestrator)
