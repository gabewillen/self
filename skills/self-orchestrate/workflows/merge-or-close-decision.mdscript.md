<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Handle Merge Or Close Decision

* name the necessary `{{claim_scope}}` for the merge, close, launch, release, deployment, publication, or live-proof waiver decision
* [Verify Disposition Preconditions](#verify-disposition-preconditions)

## Verify Disposition Preconditions

* make sure that the input event execution is `/mdscript-exec {{skills_root}}/self-common/workflows/thread-event-contracts.mdscript.md#event-disposition-ready`
* if the disposition-ready event is absent or incomplete
  * record why the root explicitly denies disposition
  * after you record the denial, stop
* make sure that the worker and reviewer proof decisions are scoped to `{{claim_scope}}`
* if the report launders `Proven for source-health`, `Proven for ci-repair`, `Proven for audit-completion`, or `Proven for blocker-note-completion` into broader authority
  * set `{{blocker}}` to `scope laundering into broader disposition authority`
  * [Stop On Disposition Blocker](#stop-on-disposition-blocker)
* for an aggregate scope, make sure that each necessary precondition is available
* for an aggregate scope, make sure that each invariant holds and each proof path passed
* if the aggregate preconditions fail
  * set `{{blocker}}` to the failed aggregate disposition precondition
  * [Stop On Disposition Blocker](#stop-on-disposition-blocker)
* [Decide Allowed Merge](#decide-allowed-merge)

## Decide Allowed Merge

* if an agent-shaped assistant owns a worker MR/PR into a permitted non-default coordination, development, or integration branch
  * if all gates are clean and the repository-local instructions and exact permission boundaries allow it
    * merge
* without the exact authority for that action, never merge default, production, or release branches
* without the exact authority for that action, never merge human-owned PRs/MRs, releases, deployments, or live-proof waivers
* if merge, close, release, deployment, publication, or live-proof waiver authority is missing
  * set `{{blocker}}` to the exact authority needed
  * [Stop On Disposition Blocker](#stop-on-disposition-blocker)
* if an MR/PR that a worker lane owns has merged
  * [Close After Merge](#close-after-merge)
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Close After Merge

* refresh the merged MR/PR, the linked or closing issues, the referenced tickets, the milestone state, and the tracker workflow
* if the merged MR/PR satisfies the ticket done state and no keep-open blocker remains
  * if this orchestrator has the authority to close the tracker item
    * close the referenced tickets
* if the tracker supports notes
  * add a concise tracker note that points to the merged MR/PR and the proof
* run [Resolve GitLab Sudo Alias](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#resolve-gitlab-sudo-alias) with `{{self_role}}` set to `orchestrator`
* before you write a GitLab close note, issue comment, or milestone-progress comment
  * run [Use GitLab Sudo Alias Before Public Write](../../self-common/workflows/gitlab-sudo-alias.mdscript.md#use-gitlab-sudo-alias-before-public-write)
* record the closed tickets and the tickets that you left open in the lane ledger
* record the reason for each open ticket in the lane ledger
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)

## Stop On Disposition Blocker

* if the caller will ask the user, a repository owner, or a different authority surface for that authority decision
  * run [Prepare Prompt Return Script](../../self-common/workflows/return-script.mdscript.md#prepare-prompt-return-script)
  * return to the stop-boundary state of the caller
* report `Blocked for {{claim_scope}}: {{blocker}}`
* stop
