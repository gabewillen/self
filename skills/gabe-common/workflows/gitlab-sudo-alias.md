<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve GitLab Sudo Alias

* infer `{{gabe_role}}` from the caller when it is empty
* if `{{gabe_role}}` is `orchestrator`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias ending in `-orchestrator`
* if `{{gabe_role}}` is `implementer`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias ending in `-implementor`
* if `{{gabe_role}}` is `reviewer`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias ending in `-reviewer`
* if `{{gitlab_sudo_alias}}` is empty or does not end with the role suffix
  * [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* if `{{gitlab_sudo_alias}}` is not already leased for the exact target
  * [Lease GitLab Sudo Alias](#lease-gitlab-sudo-alias)
* never require a GitLab user whose username is the role alias itself
* treat `gitlab-sudo-alias` as the mapper from role alias to a safe leased `codex-subagent-*` user
* return to the caller

## Lease GitLab Sudo Alias

* run `gitlab-sudo-alias {{gitlab_sudo_alias}} lease --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --purpose {{purpose}}`
  * if the lease command fails, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* record the returned `username`, `alias`, and `lease_id`
* treat `username` as the real GitLab note author and `alias` as the lane-local role identity
* return to [Resolve GitLab Sudo Alias](#resolve-gitlab-sudo-alias)

## Use GitLab Sudo Alias Before Public Write

* before writing a GitLab issue note, MR note, review, review response, thread resolution note, close note, or milestone-progress comment
  * [Post Through GitLab Sudo Alias](#post-through-gitlab-sudo-alias)
* keep public records sanitized: no secrets, credential paths, private local paths, private endpoints, or unredacted sensitive identifiers
* return to the caller

## Post Through GitLab Sudo Alias

* if `gitlab-sudo-alias` tooling is unavailable
  * [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* run the write through `gitlab-sudo-alias` with `{{gitlab_sudo_alias}}`
* pass the recorded `lease_id`
* use a body-file form such as `printf '%s\n' "$BODY" | gitlab-sudo-alias {{gitlab_sudo_alias}} post-note --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --lease-id {{lease_id}} --body-file -`
  * if the write fails, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* return to the caller

## Block GitLab Sudo Alias

* set `{{blocker}}` to the exact missing or invalid GitLab sudo alias capability, lease failure, or missing tooling
* report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping when this is a child orchestrator, implementer, reviewer, or goal-resumed lane
* if the caller will prompt Gabe, the user, a repository owner, or another authority surface for the missing alias decision
  * run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script)
  * stop
* stop
