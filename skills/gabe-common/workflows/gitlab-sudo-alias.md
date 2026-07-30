<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Resolve GitLab Sudo Alias

* infer `{{gabe_role}}` from the caller when it is empty

* if `{{gabe_role}}` is `orchestrator`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias ending in `-orchestrator`

* if `{{gabe_role}}` is `implementer`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias ending in `-implementor`

* if `{{gabe_role}}` is `reviewer`
  * set `{{gitlab_sudo_alias}}` to the target-scoped actor alias ending in `-reviewer`

* if `{{gitlab_sudo_alias}}` is empty or does not end with the role suffix
  * set `{{blocker}}` to the exact missing or invalid GitLab sudo alias capability
  * report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping when this is a child orchestrator, implementer, reviewer, or goal-resumed lane
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for the missing alias decision, run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script)
  * return to the caller's report or stop-boundary state

* if `{{gitlab_sudo_alias}}` is not already leased for the exact target
  * run `gitlab-sudo-alias {{gitlab_sudo_alias}} lease --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --purpose {{purpose}}`
  * record the returned `username`, `alias`, and `lease_id`
  * treat `username` as the real GitLab note author and `alias` as the lane-local role identity

* never require a GitLab user whose username is the role alias itself; `gitlab-sudo-alias` maps the role alias to a safe leased `codex-subagent-*` user

## Use GitLab Sudo Alias Before Public Write

* before writing a GitLab issue note, MR note, review, review response, thread resolution note, close note, or milestone-progress comment
  * run the write through `gitlab-sudo-alias` with `{{gitlab_sudo_alias}}`
  * pass the recorded `lease_id`
  * example: `printf '%s\n' "$BODY" | gitlab-sudo-alias {{gitlab_sudo_alias}} post-note --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --lease-id {{lease_id}} --body-file -`

* if `gitlab-sudo-alias` tooling is unavailable
  * set `{{blocker}}` to the exact missing GitLab sudo alias tooling
  * report the blocker to `{{parent_agent}}` or `{{parent_reporting_path}}` before stopping when this is a child orchestrator, implementer, reviewer, or goal-resumed lane
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for the missing tooling decision, run [Prepare Prompt Return Script](return-script.md#prepare-prompt-return-script)
  * return to the caller's report or stop-boundary state

* keep public records sanitized: no secrets, credential paths, private local paths, private endpoints, or unredacted sensitive identifiers
