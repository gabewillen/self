<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Handle Merge Or Close Decision

* before merge, close, launch, release, deployment, publication, or live-proof waiver decisions
  * name the required `{{claim_scope}}`
  * require the input event execution to be `/mdscript-exec {{repo_root}}/skills/gabe-common/workflows/thread-event-contracts.md#event-disposition-ready` or record why root is explicitly denying disposition despite the event being absent or incomplete
  * confirm worker and reviewer proof decisions are scoped to that claim
  * reject laundering `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` into broader authority
  * require aggregate scopes to have every required precondition available, every invariant held, and every proof path passed before treating the decision as proven

* if a Gabe-shaped assistant owns a worker MR/PR into a permitted non-default coordination, development, or integration branch and all gates are clean
  * merge only when repository-local instructions and exact permission boundaries allow it

* when an MR/PR owned by a worker lane is merged
  * refresh the merged MR/PR, linked or closing issues, referenced tickets, milestone state, and tracker workflow
  * close referenced tickets when the merged MR/PR satisfies the ticket done state, no keep-open blocker remains, and this orchestrator has authority to close the tracker item
  * add a concise tracker note pointing to the merged MR/PR and proof when the tracker supports notes
  * run [Resolve GitLab Sudo Alias](../../gabe-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{gabe_role}}` set to `orchestrator`
  * run [Use GitLab Sudo Alias Before Public Write](../../gabe-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write) before writing any GitLab close note, issue comment, or milestone-progress comment
  * update the lane ledger with closed tickets, tickets intentionally left open, and the reason for any ticket left open

* never merge default branches, production branches, release branches, human-owned PRs/MRs, releases, deployments, or live-proof waivers without exact authority for that action

* if merge, close, release, deployment, publication, or live-proof waiver authority is missing
  * set `{{blocker}}` to the exact authority needed
  * if the caller will ask Gabe, the user, a repository owner, or another authority surface for that authority decision, run [Prepare Prompt Return Script](../../gabe-common/workflows/return-script.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state
