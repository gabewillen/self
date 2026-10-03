<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve GitLab Sudo Alias

* if `{{self_role}}` is empty
  * find `{{self_role}}` from the caller
* if `{{self_role}}` is `orchestrator`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias that ends in `-orchestrator`
* if `{{self_role}}` is `implementer`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias that ends in `-implementor`
* if `{{self_role}}` is `reviewer`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias that ends in `-reviewer`
* if `{{gitlab_sudo_alias}}` is empty or does not end with the role suffix
  * [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* if `{{gitlab_sudo_alias}}` does not already have a lease for the exact target
  * [Lease GitLab Sudo Alias](#lease-gitlab-sudo-alias)
* do not ask for a GitLab user whose username is the role alias
* use `gitlab-sudo-alias` to map a role alias to a safe leased `codex-subagent-*` user
* return to the caller

## Lease GitLab Sudo Alias

* run `gitlab-sudo-alias {{gitlab_sudo_alias}} lease --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --purpose {{purpose}}`
  * if the lease command fails, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* record the `username`, `alias`, and `lease_id` that the command returns
* use `username` as the real GitLab note author
* use `alias` as the lane-local role identity
* return to [Resolve GitLab Sudo Alias](#resolve-gitlab-sudo-alias)

## Use GitLab Sudo Alias Before Public Write

* use this list of public GitLab records:
  * an issue note, an MR note, a review, or a review response
  * a thread resolution note, a close note, or a milestone-progress comment
* before you write a public GitLab record from that list
  * [Post Through GitLab Sudo Alias](#post-through-gitlab-sudo-alias)
* keep public records clean of secrets, credential paths, and private local paths
* keep public records clean of private endpoints and sensitive identifiers that are not redacted
* return to the caller

## Post Through GitLab Sudo Alias

* if the `gitlab-sudo-alias` tool is not available
  * [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* run the write through `gitlab-sudo-alias` with `{{gitlab_sudo_alias}}`
* give the recorded `lease_id`
* use a body-file form, for example `printf '%s\n' "$BODY" | gitlab-sudo-alias {{gitlab_sudo_alias}} post-note --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --lease-id {{lease_id}} --body-file -`
  * if the write fails, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* return to the caller

## Block GitLab Sudo Alias

* set `{{blocker}}` to the exact problem
  * the problem can be a GitLab sudo alias capability that is not there or not correct
  * the problem can also be a lease failure or a tool that is not there
* if this is a child orchestrator, implementer, reviewer, or goal-resumed lane
  * before you stop, report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}`
* if the caller will ask the user, a repository owner, or another authority surface for the alias decision
  * run [Prepare Prompt Return Script](return-script.mdscript.md#prepare-prompt-return-script)
  * stop
* stop
