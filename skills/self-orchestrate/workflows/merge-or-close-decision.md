<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Merge Or Close Decision

* name the required `{{claim_scope}}` for the merge, close, launch, release, deployment, publication, or live-proof waiver decision
* [Verify Disposition Preconditions](#verify-disposition-preconditions)

## Verify Disposition Preconditions

* verify the input event execution is `/mdscript-exec {{repo_root}}/skills/self-common/workflows/thread-event-contracts.md#event-disposition-ready`
* if the disposition-ready event is absent or incomplete
  * record why root is explicitly denying disposition
  * stop after recording the denial
* confirm worker and reviewer proof decisions are scoped to `{{claim_scope}}`
* if the report launders `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` into broader authority
  * set `{{blocker}}` to `scope laundering into broader disposition authority`
  * [Stop On Disposition Blocker](#stop-on-disposition-blocker)
* require aggregate scopes to have every required precondition available, every invariant held, and every proof path passed
* if aggregate preconditions fail
  * set `{{blocker}}` to the failed aggregate disposition precondition
  * [Stop On Disposition Blocker](#stop-on-disposition-blocker)
* [Decide Allowed Merge](#decide-allowed-merge)

## Decide Allowed Merge

* if an agent-shaped assistant owns a worker MR/PR into a permitted non-default coordination, development, or integration branch and all gates are clean
  * merge only when repository-local instructions and exact permission boundaries allow it
* never merge default branches, production branches, release branches, human-owned PRs/MRs, releases, deployments, or live-proof waivers without exact authority for that action
* if merge, close, release, deployment, publication, or live-proof waiver authority is missing
  * set `{{blocker}}` to the exact authority needed
  * [Stop On Disposition Blocker](#stop-on-disposition-blocker)
* if an MR/PR owned by a worker lane is merged
  * [Close After Merge](#close-after-merge)
* run [Report Status](../../self-common/workflows/report-boundary.md#report-status)

## Close After Merge

* refresh the merged MR/PR, linked or closing issues, referenced tickets, milestone state, and tracker workflow
* close referenced tickets when the merged MR/PR satisfies the ticket done state, no keep-open blocker remains, and this orchestrator has authority to close the tracker item
* add a concise tracker note pointing to the merged MR/PR and proof when the tracker supports notes
* run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `orchestrator`
* run [Use GitLab Sudo Alias Before Public Write](../../self-common/workflows/gitlab-sudo-alias.md#use-gitlab-sudo-alias-before-public-write) before writing any GitLab close note, issue comment, or milestone-progress comment
* update the lane ledger with closed tickets, tickets intentionally left open, and the reason for any ticket left open
* run [Report Status](../../self-common/workflows/report-boundary.md#report-status)

## Stop On Disposition Blocker

* if the caller will ask the user, a repository owner, or another authority surface for that authority decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.md#prepare-prompt-return-script)
  * return to the caller's stop-boundary state
* stop and report `Blocked for {{claim_scope}}: {{blocker}}`
