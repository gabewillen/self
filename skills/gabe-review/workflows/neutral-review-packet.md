<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Build Neutral Review Packet

* if `{{merge_target}}` is unknown
  * use the PR base, MR target, default branch, or `main` only when no more specific target exists

* if reviewing code, PR, MR, or branch readiness
  * run [Resolve Review Baseline](rolling-code-review.md#resolve-review-baseline)
  * use `{{review_diff}}` as the primary review object for `{{review_diff_scope}}`

* include only neutral supporting code paths, contracts, schemas, tests, docs, artifacts, routes, or ownership surfaces needed to understand the diff

* include the current task file, relevant unresolved comments, and lane ledger entries as neutral source material, but do not use a previous reviewer verdict as the frame for a fresh blind review

* treat an initial review as cumulative, each repair review as a rolling delta from the last completed review snapshot, and the terminal readiness gate as one fresh cumulative blind review

* for recursive code review, make every round-1 finding blocking, only P1 and P2 blocking in round 2, and only P1 blocking in round 3 and later

* report every finding with an explicit severity even when it falls below `{{blocking_severities}}`

* preserve below-threshold findings as `{{residual_findings}}` without requesting another pass

* apply the recursive rolling-review cycle only when code changed

* for MDScript, instruction, documentation, plan, task, comment, publication, or other non-code changes, run exactly one fresh review plus the applicable direct proof and do not recurse after repairs

* persist review baselines only under `~/.agents/projects/{{project_name}}/artifacts/review-baselines/`; do not put review control state in the source repository

* do not use the author's preferred verdict, intended fix narrative, curated explanation, or another reviewer's findings as the initial frame unless explicitly reconciling visible disagreement

* run [Check Goal And Contract](../checks/goal-and-contract.md#check-goal-and-contract)

* run [Check Evidence Boundary](../checks/evidence-boundary.md#check-evidence-boundary)

* run [Check UI And Product Surface](../checks/evidence-boundary.md#check-ui-and-product-surface)

* run [Check Ownership And Permission](../checks/ownership-permission.md#check-ownership-and-permission)

* run [Check Review And Watcher Gates](../checks/review-watcher-gates.md#check-review-and-watcher-gates)

* run [Check Coordinator Control](../checks/coordinator-control.md#check-coordinator-control)

* run [Check Publication Hygiene](../checks/publication-hygiene.md#check-publication-hygiene)

* if reviewing a skill, instruction, validator, scorer, harness, or agent workflow whose claim is that future agents will behave correctly
  * require executable or black-box proof against exact contract fields and current durable artifacts, not only source inspection, coached prompts, substring matches, keyword hits, or author-written examples

* if reviewing model training, data extraction, eval harnesses, or adapter-selection work
  * require current source-corpus identity, structured decision-case or held-out eval contracts, provenance, and fail-closed blockers for stale sources, missing adapters, empty artifacts, or promotion claims unsupported by real candidate proof

* if reviewing a dependency, provider, release, hardware path, runtime backend, or patch-level swap whose API shape stayed similar
  * require the actual runtime path, platform, package diff, owner-surface contract, known-good fallback, rollout state, release or merge owner, and upstream/downstream cause separation when a resolver, adapter, dashboard, eval, or review surface could mask the source failure before accepting behavior, deployment, or live-proof claims
  * reject local green proof, unchanged names, or successful setup evidence as proof that the production runtime, hardware path, or dependency owner has accepted the swap

* if reviewing subtree, vendored import, embedded repository, mirror, or source-sync work
  * require the source-owning repository and intended source baseline to be explicit and current
  * treat a parent or integration checkout sync as source-health only unless the upstream owner review, CI, history decision, and release or merge record prove a broader claim
  * reject resolving local overlays, divergent histories, or child-source conflicts in the parent checkout when that would bypass the source owner or choose history on the owner's behalf

* if reviewing work where model narration, transcript text, digests, summaries, or inferred labels compete with typed product state, tool logs, tracker state, review state, metrics, dashboards, or other owner records
  * require the owner record to decide or mutate state; narrative may explain only when bound to that record

* if reviewing observation-only, telemetry-only, shadow-mode, dry-run, or measurement-first work
  * require the contract to prove what data is observed, what inputs are snapshotted, what delivery, mutation, user-facing, or downstream side effects are excluded, and which broader delivery or live-proof gates remain outside the claim
  * reject observation proof that reads mutable live state after the boundary, silently emits downstream actions, or reports source-health evidence as caller-facing, delivery, deployment, or live-proof readiness

* if reviewing delegated model, adapter, subagent, navigator, or autonomous-driver work
  * require the chosen runtime or agent identity to be explicit, current, visible at the owning control surface, and bound to the authority grant
  * reject silent fallback from a requested local model, hosted model, adapter, navigator, driver, or helper agent to a more convenient substitute
  * require setup failures, missing credentials, hidden or ineligible agents, unavailable adapters, stale cursors, and normal-stop handoffs to fail closed or route through the same owner-input path a human would use

* if this review is a **terminal readiness / goal-completion / merge-readiness / live-proof / release-readiness** gate (or the caller requested triple blind)
  * run [Triple Adversarial Blind Review](triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review)
  * do not self-author a Proven-for grade without all three lane sign-offs
  * each blind subagent must `mdscript-exec` its own lane MDScript:
    * rules → `workflows/blind-reviewers/rules.mdscript.md#rules-blind-review` (AGENTS/CLAUDE/GEMINI + Cursor/VS Code/Windsurf rules)
    * security → `workflows/blind-reviewers/security.mdscript.md#security-blind-review` (penetration and security)
    * completeness → `workflows/blind-reviewers/completeness.mdscript.md#completeness-blind-review` (goal-literal completeness)
  * union lane findings into `{{blocking_findings}}` when any lane fails
  * only when all three lanes `signed_off: true` with empty `p_findings` may `{{grade}}` become `Proven for {{proof_scope}}`
  * [Determine Grade](../SKILL.md#determine-grade)

* if this is a non-terminal intermediate rolling repair pass and the caller did not request triple blind
  * the lead reviewer may continue single-pass checks below, but the **final cumulative** readiness gate still requires [Triple Adversarial Blind Review](triple-adversarial-blind-review.mdscript.md#triple-adversarial-blind-review)

* [Determine Grade](../SKILL.md#determine-grade)
