<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Require GitLab Review Visibility

* if the work has no GitLab issue or MR
  * return to the caller

* make reviewer grades, findings, questions, answers, fix responses, evidence links, and resolution visible on the GitLab issue or MR

* require reviewers to use `gitlab-sudo-alias` with an alias ending in `-reviewer` before authoring their own sanitized GitLab issue, review, or comment records

* confirm the implementer wrote implementer issue, review, and comment records through the `-implementor` alias

* confirm each reviewer wrote reviewer records through the `-reviewer` alias

* resolve threads only after concerns are fixed, withdrawn, or explicitly accepted as closed

* if required GitLab visibility is missing
  * set `{{blocker}}` to the missing GitLab visibility record
  * run [Report To Orchestrator](report-to-orchestrator.md#report-to-orchestrator)
