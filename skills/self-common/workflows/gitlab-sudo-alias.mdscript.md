<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve GitLab Sudo Alias

* set `{{gitlab_sudo_alias}}` to the target-scoped alias for `{{self_role}}`
  * it ends in `-orchestrator`, `-implementor`, or `-reviewer`
* if the alias is empty or has the wrong suffix, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* if the alias has no lease for this target
  * run `gitlab-sudo-alias {{gitlab_sudo_alias}} lease --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --purpose {{purpose}}`
  * if it fails, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
  * record the returned `username` (the real note author), `alias`, and `lease_id`
* do not ask for a GitLab user named after the alias
* return to the caller

## Use GitLab Sudo Alias Before Public Write

* write each public GitLab note, review, response, resolution, or close note through the alias:
  * `printf '%s\n' "$BODY" | gitlab-sudo-alias {{gitlab_sudo_alias}} post-note --project {{gitlab_project}} --resource {{gitlab_resource}} --iid {{gitlab_iid}} --lease-id {{lease_id}} --body-file -`
* keep secrets, credential paths, local paths, private endpoints, and unredacted identifiers out of it
* if the tool is missing or the write fails, [Block GitLab Sudo Alias](#block-gitlab-sudo-alias)
* return to the caller

## Block GitLab Sudo Alias

* set `{{blocker}}` to the missing alias, failed lease, or missing tool
* report it to the parent, if one exists
* if you will ask an owner for the alias, run [Prepare Prompt Return Script](return-script.mdscript.md#prepare-prompt-return-script)
* stop
