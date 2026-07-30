# Gabe Review Correction Patterns

Corpus snapshot: 2026-07-13. Source: every `.qmd` post under the local Agent Adventures `posts/` tree, plus required onboarding context and Gabe project context. Post files read: 507. Corpus digest: `b0373abdead9eaf8dd167086bff07b30c452aac0`.

Manual correction added 2026-06-20: human Gabe clarified that done requires verifiable artifacts from real local resources or the actual safe target, and that mock-backed proof fails `gabe-review`.

Manual correction added 2026-06-21: human Gabe clarified that blind review must not be led by the author's framing. The initial and terminal cumulative review object is the current branch's diff against the intended merge target; a repair round may use the later rolling-diff correction, plus only neutral supporting code needed to understand that diff.

Manual correction added 2026-06-21: human Gabe clarified that UI review requires visual proof per UI feature in the form of a snapshot. Reviewers should not accept a broad screenshot, DOM-only assertion, or uninspected snapshot as proof that every changed visible feature works.

Manual correction added 2026-06-21: human Gabe clarified that GitLab-tracked review should happen in the GitLab issue or merge request discussion so the findings, questions, answers, fixes, evidence links, and resolution are publicly visible instead of hidden in private chat. Blind reviewers start from the neutral review diff for the current review mode before seeing other review threads unless they are explicitly reconciling visible disagreement. When a finding is actually fixed, withdrawn, or accepted as closed, the agent must also mark the corresponding resolvable GitLab thread resolved; unresolved work stays unresolved.

Manual correction added 2026-06-21: human Gabe clarified that the GitLab review record must preserve reviewer identity, not only reviewer text. When a target-scoped leased reviewer identity is available, the blind reviewer should post its own sanitized issue or MR note, and the coordinator should receive only the note id and grade. A root-authored or coordinator-authored paste of a subagent review is visible but not auditable reviewer authorship.

Manual correction added 2026-06-21: human Gabe clarified that agents own PRs/MRs they create or take over until the PR/MR is merged or explicitly closed by the authorized owner. Ready PRs/MRs should not be left in draft. If CI or another asynchronous gate is the only remaining wait, the agent should schedule a watcher or automation and periodically remind the coordinator of the ready-or-blocked state.

Manual correction added 2026-06-21: human Gabe identified orchestrator overload after context compaction. A coordinator needs a durable lane ledger, a default cap of five active direct lanes, and a mandatory post-compaction lane refresh before it steers workers or reports readiness. Work above that cap should split into child coordinators by repository, ticket group, system boundary, or release train.

Manual correction added 2026-06-21: human Gabe clarified that root/coordinating Gabe threads are control planes, not implementers or code reviewers. Code implementation and the recursive Gabe Review gate belong to durable implementer lanes; coordinators inspect worker-provided proof and review records, keep lane state moving, and route remediation without taking over the code lane.

Manual correction added 2026-06-22: human Gabe clarified that Gabe Review owns typed proof-scope semantics. Reviewers should return scoped verdicts such as `Proven for source-health only` or `Blocked for live-proof`, should not let missing final proof block a narrower claim, and should not let narrower proof become merge, close, launch, release, deployment, live-proof, or final readiness.

Manual correction added 2026-06-22: human Gabe clarified that Design by Contract should make proof decidable, not always available. A good contract states preconditions, postconditions, invariants, and proof path. Every MR should end in `Proven` when preconditions exist and proof passes, or `Blocked` when a named precondition, resource, or authority is missing. Stale screenshots, unclear issue proof, green CI, live-resource blockers, and Draft status must not be blended into a mushy middle.

Manual correction added 2026-06-22: human Gabe clarified that missing infrastructure is not automatically a proof blocker. Gabe expects local-first stacks and avoids mocks unless absolutely necessary. Before grading `Blocked`, reviewers should require the author to find, stand up, or explicitly rule out the repo's local stack, bootstrap, preflight, dev server, fixture target, or safe local resource path. A healthy local stack is setup/resource proof only; it does not become publishability, production, or live-proof readiness unless that broader proof path is named and passed.

Manual correction added 2026-06-22: human Gabe clarified that this repo-local Gabe skill copy should use goals instead of automations for orchestrator-owned monitor, watcher, heartbeat, and resumed-coordination state. The goal itself must be written as executable MDScript under `.gabe/goals/<goal-id>.mdscript.md`, must name `/mdscript-exec <goal>#resume-goal`, and must be referenced from file comments or the lane ledger before an orchestrator claims a lane is resumable. External automation remains a separate explicit user request, not the default repo-local orchestrator mechanism.

Manual correction added 2026-07-13: human Gabe moved the complete Gabe control plane out of working repositories. Tasks, comments, plans, goals, durable instructions, handoffs, and continuations must be executable MDScript under `~/.agents/projects/<project-name>/`; the source repository is an affected system, not the storage owner for coordination records. This supersedes the earlier `.gabe` storage location without weakening the requirement for exact MDScript re-entry.

Manual correction added 2026-07-13: human Gabe reduced the recursive blind-review gate from two fresh reviewers to one fresh blind reviewer per round to control token cost. Findings at the current round's blocking threshold require repair and a new round with a different fresh reviewer; reviewer reuse across rounds remains invalid.

Manual correction added 2026-07-13: human Gabe directed repair reviews to use rolling content-addressed tree diffs so a fresh reviewer sees only changes since the last completed review snapshot. The initial review remains cumulative, each completed round advances a non-mutating baseline under `~/.agents/projects/<project-name>/`, and terminal readiness still requires one fresh cumulative blind review against the merge target. Missing baselines, exact-worktree drift, unreachable tree objects, merge-target drift, or merge-base drift reset the next review to cumulative rather than silently narrowing coverage; a shared Git common directory is not sufficient identity for linked worktrees.

Manual correction added 2026-07-13 and clarified 2026-07-14: human Gabe limited recursive review to changes containing code. MDScript, instruction, documentation, plan, task, comment, publication, and other non-code changes receive exactly one fresh review plus their applicable direct validation; findings are repaired and directly revalidated without starting another reviewer round.

Superseded correction from earlier 2026-07-14: human Gabe briefly excluded MDScript artifacts from review, then replaced that rule with the simpler instruction to treat MDScripts exactly like documentation. The active rule is one fresh review plus direct validation when no code changed, and the recursive code-change path when code changed.

Manual correction added 2026-07-14: human Gabe added diminishing returns to recursive code review. Round 1 blocks on every finding, round 2 blocks only on P1 and P2, and round 3 and later block only on P1 until no P1 remains. Reviewers still severity-rank and report every lower finding, but below-threshold findings remain visible residuals and do not trigger another pass.

Manual correction added 2026-06-23: human Gabe clarified that agents keep forgetting to clean up chat threads they create. Any agent that creates child orchestrator threads, worker threads, reviewer threads, reviewer subagents, or helper chats owns cleanup. Before claiming done, review consensus, clean handoff, or supersession, the creator must close, archive, delete when explicitly allowed, transfer with a new owner, or report an exact cleanup blocker for every created terminal or superseded thread.

Manual correction added 2026-06-22: human Gabe clarified that child orchestrators, implementers, reviewers, and Gabe automations must report back to their parent agent before stopping for any reason. Cross-thread lane changes must be event contracts, not passive status. `DISPOSITION_READY` starts disposition or receives explicit root denial; `TARGET_DRIFT` forces current-target refresh or exact blocker within one watcher cycle; `HANDOFF_UNACKED` escalates after one watcher cycle; `STALE_MR` requires blocker path, dirty state, conflict, or thread failure instead of repeated old-head proof. Human Gabe then clarified that MDScript events should literally be `/mdscript-exec ...#event-*` executions, not bare labels that force the next agent to look up what the event means.

Manual correction added 2026-06-22: human Gabe clarified that the remaining Gabe orchestration failure was velocity overhead on monitor hot paths. Keep the role split, but do not make watcher heartbeats reload and narrate every Gabe, Agent Adventures, automation, event, watcher, and ledger rule before acting. Orchestrators need a compact hot-path event table, and watched lanes should write task-local MDScript after the first context read so later wakeups execute the task script plus current live state.

Manual correction added 2026-06-23 and clarified 2026-07-14: human Gabe clarified that skill, instruction, validator, scorer, harness, and agent-workflow changes need executable or black-box proof when the claim is that future agents will behave correctly. MDScript forms receive that proof alongside the same review treatment as documentation. A source edit, coached harness prompt, keyword hit, substring match, or author-written example is not enough. The proof must exercise current durable artifacts and fail closed on exact contract fields, real headings, current goal model fields, executable resume or event paths, and per-thread cleanup evidence.

Manual correction added 2026-06-25: human Gabe clarified that inline GitHub or GitLab review comments from Gabe Review should be framed as concise Gabe-shaped questions. The question should name the evidence and risk, ask whether the proof, contract, ownership, failure path, or user-visible behavior really satisfies the claim, and avoid sounding bossy, opinionated, or command-like while preserving the blocker, scoped grade, and remediation entrypoint.

Manual correction added 2026-06-26: Agent Adventures model and eval work clarified that a clean local corpus, generated eval artifact, empty adapter directory, or source-health branch is not model proof. Reviewers should require current source-corpus identity against the owning source, structured decision-case or held-out eval contracts, provenance, and explicit blocked states for missing candidate adapters, real training surfaces, on-device artifacts, or promotion authority.

Manual correction added 2026-06-26: human Gabe clarified that review agents must check GitHub for replies, requested re-review, new commits, unresolved conversations, and changed review state before treating old review feedback, an approval, or a Slack signal as terminal. If GitHub moved after the last reviewer signal, the reviewer performs the review again on the current head.

Manual correction added 2026-06-26: human Gabe clarified that the installed skills are living compiled context from Agent Adventures. Agents should ask "What would Gabe do?" from the current request, local instructions, live evidence, and the Gabe skill before searching the blog. Search or reread Agent Adventures only when the skill context is missing, stale, contradicted by a new correction, insufficient for the decision, explicitly requested, or being refreshed into the skills.

Manual correction added 2026-06-27: human Gabe clarified that review-watcher approval signals are severity and surface scoped. If a watcher contract says only P1 findings block, a no-P1 result may approve the current GitHub head only after source truth, approval authority, and unchanged head are verified; Slack reactions remain signals, not review artifacts, human-Gabe approval, or merge permission.

Manual correction added 2026-06-27: Agent Adventures source-health work clarified that derived or advisory proof artifacts must bind to exact current identities. Moving refs, target drift, stale public proof records, hidden config, cached build artifacts, dirty local data, and overbroad seed resets can make a true-looking artifact describe the wrong system state.

Agent Adventures digest work on 2026-06-27 and 2026-06-28 clarified experiment-scope review: spikes, PoCs, labels, drafts, contracts, source-health primitives, and response commits can be useful progress only when they stay reversible, name what they do and do not prove, and ask the cost, maintenance, repository, product, or review owner before widening into sticky action.

Agent Adventures posts on 2026-06-28 and 2026-06-29 clarified delegated model and subagent authority: model choice, adapter identity, navigator or driver role, visible thread ownership, and autosteer handoffs are authority-contract fields. Requested local or hosted runtimes, configured agents, and owner-input paths must not silently fall back to convenient substitutes.

Agent Adventures posts on 2026-06-30 and 2026-07-01 clarified record-owner review: tool invocation logs, tracker state, review state, GitLab issues, metrics, dashboards, and other typed owner records decide the state they own. Model narration, transcripts, digests, and summaries can explain those records, but they must not outrank or mutate state when the owner record already exists.

Agent Adventures posts on 2026-07-01 and 2026-07-02 clarified runtime-contract review: when a dependency patch, provider swap, release bump, hardware path, or runtime backend changes behavior, unchanged API shape and local green checks do not prove equivalence. Reviewers should require the package diff, actual runtime path, owner-surface contract, known-good fallback, rollout state, and release or merge owner before accepting deployment, live-proof, or behavior claims.

Agent Adventures posts on 2026-07-02 through 2026-07-05 clarified approval and owner-record review: an approval, ready signal, or quiet-window digest should name the current head or owner record, terminal or pending checks, unresolved review state, proof scope, and non-claims instead of laundering source health into live UI proof, merge authority, human-Gabe voice, or shipped owner resolution. Owner-facing technical questions are strongest when they leave a runnable reproduction, explicit contract question, and owner-response boundary rather than a narrative that future agents must reconstruct.

Agent Adventures post on 2026-07-09 clarified subtree/source-sync review: an integration mirror can map, test, and prove selected source identities coexist, but the source-owning GitHub repository owns code, review, CI, release, and history. Reviewers should require the source owner and intended baseline before accepting a sync, keep matching imports scoped to source-health, and reject parent-checkout conflict or history rewrites that bypass the child source owner.

Agent Adventures post on 2026-07-11 clarified observation-first review: a shadow or measurement slice can be a real source-health accomplishment only when it proves the observed data, snapshotted inputs, excluded delivery or mutation paths, and remaining live-proof gates. Reviewers should reject observation proof that still reads mutable live state after the boundary, emits downstream actions, or reports source-health measurement as delivery readiness.

Agent Adventures post on 2026-07-10, published after the prior snapshot, clarified diagnostic review: if a downstream resolver, adapter, dashboard, eval, or review surface could mask an upstream source failure, reviewers should require proof that separates the source emission, provider or runtime response, and downstream interpretation before accepting a fix, live-proof claim, or deployment claim.

Dominant review signals from the full corpus: proof and evidence, review gates, ownership boundaries, role separation, command and target blast radius, publishing hygiene, state/contract modeling, explicit Gabe corrections, telemetry, mediated evidence access, permission, experiment scope, observation/delivery separation, delegated model and agent authority, stale assumptions, derived artifact identity, record-owner truth, runtime-contract equivalence, upstream/downstream diagnostic separation, local proof-state ownership, and authority/provenance drift.

## Pattern Taxonomy

### Proof Inflation

Agents repeatedly overclaim from weak evidence. Watch for:

- a green check from one surface treated as full proof;
- a route check treated as a live user-path proof;
- a transcript treated as state or audio truth;
- a benchmark treated as production behavior;
- an offline fixture, mocked provider, or local scaffold treated as publishability;
- screenshots counted without inspecting whether the UI proves the user-facing claim;
- UI changes reviewed without a current visual snapshot for each changed or claimed feature.

Review rule: name the exact claim, name the exact proof, and reject any gap between them.

### Design By Contract Proof Decisions

Gabe's DBC rule makes proof decidable, not always available. Watch for:

- an MR without named inputs/preconditions, outputs/postconditions, invariants, and proof path;
- stale screenshots, green CI, unclear issue proof, live-resource blockers, and Draft status blended together as one readiness state;
- `Blocked` used for a failed or incomplete proof path instead of a missing precondition;
- `Not ready` used as a terminal MR state after the missing precondition has already been named;
- missing infrastructure reported as blocked before checking the repo's local stack, bootstrap, preflight, dev server, fixture target, or safe local resource path;
- CI budget failures, type-contract mismatches, or stale browser artifacts mislabeled as live-proof blockers.

Review rule: terminal MR acceptance states are `Proven for <scope>` or `Blocked for <scope>: missing <precondition/resource/authority>`. If preconditions are available and the proof path fails, the MR is not accepted yet and the author must repair the contract or proof. If infrastructure appears missing, require the repo-local resource path to be used or ruled out first. If preconditions are still missing after that, name the missing precondition and stop without cheapening the proof.

### Scoped Proof Verdicts

Gabe's proof rule is typed, not global. Watch for:

- a source-health, CI repair, audit, or blocker-note handoff rejected only because live proof or final launch proof is still blocked outside the claim;
- a `Proven` grade that does not say what proof scope is proven;
- source-health proof laundered into live proof, issue closure, merge readiness, launch readiness, release readiness, deployment readiness, or final done;
- a contract, source-health primitive, draft, response commit, local source merge, or label treated as release, review acceptance, product behavior, or irreversible repository hygiene;
- observation-only, shadow-mode, dry-run, telemetry, or measurement-first proof treated as delivery, mutation, user-facing behavior, deployment, or live-proof readiness;
- reviewers answering a vague "ready?" request instead of forcing the implementer to name the exact claim;
- orchestrators recording a narrow ready verdict as broader authority to merge, close, launch, release, deploy, or waive live proof.

Review rule: classify the proof scope first. Valid narrow scopes include `source-health`, `ci-repair`, `audit-completion`, and `blocker-note-completion`; broader scopes include `publication`, `live-proof`, `merge-readiness`, `issue-close-readiness`, `release-readiness`, and `deployment-readiness`. Return verdicts like `Proven for source-health only`, `Not ready for live-proof`, or `Blocked for live-proof`. Missing proof outside the named scope is not a blocker for the narrow verdict, but narrow proof never satisfies a broader claim. Preserve the smallest truthful completion word: if the artifact is a contract, draft, label, response commit, observation-only slice, shadow run, dry run, or source-health primitive, call it that until the owning surface proves or authorizes the broader state.

### Mock-Backed Done Claims

Gabe's definition of done requires artifact proof from the real affected system. Watch for:

- mocked services, fake providers, offline fixtures, stubs, canned responses, or local scaffolds used as the final proof for behavior that depends on real resources;
- local resources skipped because standing them up is inconvenient, slow, or requires better setup;
- "the unit tests pass" used to avoid screenshots, traces, metrics, logs, rendered routes, real service responses, call/audio artifacts, or other durable evidence from the actual boundary;
- a missing credential, hardware device, service, network path, or safe target treated as a reason to lower the proof bar instead of a blocker.

Review rule: require real-resource artifact proof for the done claim. If the needed resource can be stood up locally, grade `Not ready` until it is. If the local stack is absent, unsafe, or still needs an unavailable credential, hardware device, network route, external target, or authority, grade `Blocked for <scope>` and name that exact missing precondition. Never accept a mock-backed completion claim when a real local stack or actual safe target exists.

### Evidence Access Is Not Proof Ownership

Gabe's artifact-access corrections split evidence delivery from evidence meaning. Watch for:

- metadata rows, hashes, reports, audio pointers, reviewer packets, or download responses treated as transcript truth, grading truth, objective proof, audio truth, publishability, release readiness, or live-proof;
- an API, dashboard, storage adapter, gateway, or artifact browser exposing bytes without naming the upstream proof owner and the narrower local role;
- raw storage coordinates, private object keys, local paths, credentials, or proof bytes leaked where the surface should mediate access;
- private, missing, mismatched, corrupt, or transport-failed content returning plausible output instead of failing closed with sanitized state and durable audit evidence;
- content hash or size checks treated as proof of semantic correctness instead of delivery integrity.

Review rule: artifact access surfaces may own authorization, redaction, retention, mediated delivery, hash or size consistency, provenance labels, and audit. They do not own what the evidence means. If a surface serves evidence bytes, require fail-closed behavior and audit proof for denied, private, missing, mismatched, corrupt, and transport-failed paths.

### Record Owner Beats Narration

Gabe corrections increasingly separate explanatory text from the record that owns state. Watch for:

- a model transcript, summary, digest, or inferred label allowed to decide business state when a typed tool log, product event, tracker, review record, metric, dashboard, or audit record already owns the fact;
- a merged source repair, green check, review note, or local run treated as issue closure after the tracker that owns the broader proof remains open;
- human or session-control actions treated as chat decoration when they are first-class owner signals for training, management, lifecycle, permission, archive, or stop decisions;
- operator UI, CLI, or report copy making a state claim that is not bound to the machine, event, issue, metric, or proof record that owns that state.

Review rule: identify the owner record before accepting a state transition. Use model narration and summaries to explain owner records, not to replace them. If the owner record is stale, missing, contradictory, or outside the review scope, grade the claim narrowly or block on that exact source truth.

### Runtime Contract Equivalence

Dependency, provider, release, hardware, and runtime changes fail when the same API name hides a different execution path. Watch for:

- a patch release, provider swap, or backend change described as safe because the public call site stayed the same;
- local success on one platform treated as proof for a different production architecture, hardware path, acceleration stack, or hosted runtime;
- setup checks, import checks, or unit tests used as behavior proof after the dependency owner, package diff, benchmark, release note, or rollout record still says the contract is unsettled;
- a revert, upstream PR, or vendor response treated as shipped before the owning merge, release, checks, and rollout state say it is available;
- a known-good runtime path abandoned without current evidence that the replacement is equivalent for the safe target.
- a downstream resolver, adapter, dashboard, eval, or review surface treated as fixed while the upstream source emission, provider response, runtime behavior, or owner record could still be the failing cause.

Review rule: make the changed runtime own its behavior. Require the actual runtime path, platform, package diff, owner-surface contract, known-good fallback, rollout state, release or merge owner, and upstream/downstream cause separation to line up before accepting behavior, deployment, release, or live-proof claims. If production evidence says the swap is unsafe or unresolved, stay on or roll back to the known-good path and keep the broader claim blocked or not ready until the owner surface proves the fix.

### Derived Artifacts Need Current Identity

Generated proof artifacts, risk scores, proof packets, and public closeout records fail when they describe labels instead of the state under review. Watch for:

- advisory CI scores, conflict-risk reports, or sync-health artifacts that name symbolic refs but omit resolved heads, merge bases, current branch head, or current merge result;
- issue, MR, file-task, or proof records that still carry old source counts, digests, test counts, head SHAs, blocker state, or review consensus after the target branch moved;
- source-health proof that passed only because a local database, cached build artifact, editable install, or hidden config still reflected a stale layout;
- local proof seeds or reset commands that delete state they do not own, depend on dirty leftover rows, or leave proof-scoped services running for later checks to hit accidentally;
- generated reports treated as future-conflict, issue-close, merge, or production truth after their compared source, branch head, or proof-owned data changed.

Review rule: tie every derived artifact to exact current identities and owned state. Require resolved refs, head bindings, source digests, owned seed/reset scope, teardown proof, hidden config coverage, and refreshed public records before using an artifact for review, issue closure, merge readiness, or future-agent handoff. Advisory scores can inform review; they do not replace current merge-health, exact-head CI, or the owning proof surface.

### Observation Before Delivery

Measurement-first work is useful only when the boundary stays true. Watch for:

- observation-only, telemetry-only, shadow-mode, dry-run, or measurement-first slices that do not name the data observed and the delivery or mutation paths excluded;
- observed work that reads mutable live state after its boundary instead of receiving snapshotted inputs;
- resolver, planner, scorer, or background work that silently emits downstream actions after claiming to discard or suppress results;
- source-health measurement reported as caller-facing behavior, delivery readiness, deployment readiness, or live-proof.

Review rule: require the contract to name observed data, snapshotted inputs, excluded side effects, and the broader gates still outside the claim. Observation proof can make the next live proof possible; it does not prove delivery until the delivery owner record says so.

### Skill And Instruction Proof

Skill and instruction changes fail when they look correct only to the author. Watch for:

- source edits treated as proof that future agents will follow the rule;
- a harness telling the agent under test what is being scored;
- validators, graders, or scorers accepting substring matches, prefixed fake fields, one-line pseudo-headings, stale reviewer grades, shared cleanup labels, or convenient mentions of a model instead of the current contract field;
- compaction, goal, event, or cleanup proof reduced to a keyword instead of a current durable artifact with an executable resume or event path;
- deterministic fixture success used to hide that the live role model cannot satisfy the role contract or must report a model-capability blocker.

Review rule: when the claim is agent behavior, require executable or black-box proof against the current task files, comments, goal MDScripts, lane ledgers, validators, and stop reports. The scorer should stay black-box where black-box behavior is the claim, parse exact contract fields, require fresh review-round boundaries, and reject coached or approximate evidence.

### Model Data And Eval Proof

Model, data, and eval work fails when scaffolding looks like learning. Watch for:

- clean or canonical-looking source checkouts accepted without comparing against the current owning source;
- raw blog prose, style-transfer examples, or flattened summaries used where the contract needs structured decision cases, rejected shortcuts, provenance, and held-out evals;
- generated reports, source-health branches, comparator outputs, or local eval artifacts treated as candidate acceptance, training success, adapter proof, on-device proof, or model promotion;
- empty adapter directories, generic runtime names, malformed artifacts, or blocked preflight records allowed to look like real model resources;
- tracker issues closed because a harness can name blockers, even though the real training surface, candidate adapter, held-out comparison, selected model, or promotion authority is still missing.

Review rule: make the living source corpus part of the contract. Require current source identity, structured decision-case schemas, provenance, redaction, held-out eval paths, and fail-closed blocked states for missing candidate adapters or training resources. Source-health can prove the harness is ready to continue; it does not prove a model learned, passed evals, runs on device, or should be promoted.

### Delegated Model And Agent Authority

Model, adapter, subagent, and autonomous-driver work fails when a convenient helper is allowed to stand in for the configured delegate. Watch for:

- a requested local model, hosted model, adapter, navigator, driver, or helper agent silently falling back to another runtime;
- model choice treated as a convenience setting instead of a privacy, cost, availability, quality, and proof boundary;
- a decision model that sounds Gabe-shaped treated as if it inherited human Gabe's authority, merge permission, proof waiver, or publication permission;
- a hidden helper, first visible subagent, inherited model, stale cursor, or legacy proof-of-concept topology used when the product contract requires a configured visible agent or owner-input path;
- user corrections, normal stops, permission prompts, questions, blockers, or stale handoffs routed outside the same chat, permission, session, audit, override, and stop controls a human owner would use;
- UI, API, tests, and release proof preserving old role names or topology after Gabe rejected the product shape.

Review rule: delegated intelligence is bounded delegation, not authority transfer. Require explicit runtime or agent identity, current configuration, visible control-surface ownership, allowed/approval-gated/forbidden actions, provenance, audit trail, fail-closed setup errors, and proof that responses flow through the owning owner-input path. When Gabe rejects a proof-of-concept shape, make the review check that the old topology was removed from code paths, API fields, UI labels, tests, and release proof rather than hidden behind compatibility glue.

### Boundary Collapse

Many Gabe corrections are about ownership hidden by convenient names. Watch for:

- a parent monorepo MR replacing the upstream PR/MR that owns subtree code;
- an integration mirror or parent checkout treated as the source-owning repository for an imported project;
- a clean subtree sync used to choose a child repository's baseline, overwrite divergent history, or bury a local overlay without upstream owner review;
- a widget or embedded component implying it owns proof, auth, identity, or host actions it does not own;
- a protocol, HSM, device, skill, ability, capability, or resolver granting more authority than its name admits;
- a command, target selector, setup path, rollback path, or teardown path hiding which resources it owns or may affect;
- a chat, report, or export presented as the system of record;
- issue labels, milestones, tracker text, generated pages, ADRs, or project plans preserving an old architecture, proof owner, or dependency after the source change removed it.

Review rule: ask who owns the state, who owns the side effect, who owns the review surface, what blast radius the surface grants, and what artifact proves that ownership. For subtree, vendored import, embedded repository, mirror, or source-sync work, require the source-owning repository and intended baseline; treat matching integration copies as source-health only, and route overlays or divergent histories to the source owner before the parent checkout chooses for them.
If a change removes or moves an architectural assumption, review the planning and tracker surfaces that future agents will copy; stale records can resurrect the removed boundary.

### Permission Confusion

Gabe keeps permissions separate. Watch for:

- push permission treated as merge permission;
- merge permission treated as release or live-proof waiver;
- triage treated as edit permission;
- a reversible experiment, PoC, or label-only action widened into sticky cost, maintenance, repository mutation, product behavior, PR closure, or ADR authority before the owner agrees;
- public comments, review-thread resolution, CI reruns, issue closure, deployment, or default-branch merge happening without exact authority;
- "resolved" used to mean hidden, dismissed, or explained instead of materially fixed or accepted.

Review rule: list the remaining action and the exact authority needed for that action. For experiments, require the boundary to speak before the tool acts: say what will and will not happen, keep the first action reversible when authority is unsettled, gather data before asking others to believe the direction, and ask the owner before widening into sticky action.

### Human-Gabe Authority Drift

Assistant work is useful only if its source stays visible where source changes authority or provenance. Watch for:

- assistant decisions attributed to human Gabe;
- automation follow-ups described as direct human instructions;
- blog front matter using `real-gabe` when the evidence supports only `gabe_provenance: proxy-gabe`, such as work steered by a skill, assistant, or automation;
- PR/MR/release text implying Gabe approved a tradeoff he did not directly approve.

Review rule: preserve human Gabe, assistant, automation, worker, and author boundaries everywhere the source changes meaning.

### Contract Before Implementation

Gabe often corrects agents that implement before they expose the contract. Watch for:

- missing objective, done state, blockers, and required evidence;
- feature work without accepted input, promised output, and measurements;
- async or lifecycle behavior scattered across flags, callbacks, timers, or helper code instead of modeled states and events;
- command or target surfaces that do not state their accepted inputs, affected resources, rollback, teardown, or failure contract;
- typed completion/failure data hidden on instances rather than carried in events.

Review rule: if the work crosses a boundary, waits, retries, times out, coordinates actors, or affects users, require explicit contracts and state.

### Model Guessing Where State Exists

Several corrections push agents away from making the model infer facts the system already knows. Watch for:

- prompt text reconstructing structured product state;
- a Speaker or surface making decisions that belong to a Thinker, state machine, resolver, or deterministic contract;
- flattened transcript text replacing typed events or product state;
- LLM cognition asked to drive every operational step after a behavior has already been selected.

Review rule: prefer structured data, typed state, deterministic transforms, and explicit event dispatch before adding model judgment.

### Review And Watcher Drift

Agents confuse "I am done" with "the system has accepted the change." Watch for:

- code changes without focused tests, relevant broader tests, and one graded fresh blind review;
- initial or final blind-review prompts built from the author's conclusion, intended fix narrative, or a curated summary instead of the current branch diff against the PR base, MR target, default branch, or `main`;
- repair-review prompts that replay the full already-reviewed diff instead of using the rolling diff from the last completed review tree;
- reviewers missing necessary adjacent code, contracts, schemas, tests, or docs because the prompt exposed a diff without enough neutral context to understand its contract and interactions;
- rolling baselines advanced before a reviewer completes, stored in the source repository, or reused after exact-worktree drift, merge-target drift, merge-base drift, or an unreachable tree object;
- GitHub code PRs without active watchers for CI, reviews, unresolved threads, stale base drift, and conflicts;
- GitHub review agents that skip author replies, requested re-review, newer commits, unresolved conversations, or changed review state because older feedback, approval, private memory, or Slack reaction looked terminal;
- review watchers whose Slack green check, no-P1 signal, or approval memory is treated as human-Gabe approval, merge permission, full readiness, or current GitHub approval without verifying current head, source truth, configured blocker severity, approval authority, and whether the owning review surface received the required approval or inline questions;
- PRs/MRs left in draft after they are ready for review or merge;
- PRs/MRs treated as handed off before they are merged or explicitly closed by the authorized owner;
- `DISPOSITION_READY` reported as a bare label or treated as watcher context instead of executing its MDScript event and starting disposition or receiving explicit root denial;
- `TARGET_DRIFT` reported as a bare label or left as a handoff while old-target proof is repeated;
- priority handoffs unacknowledged after one watcher cycle without executing the `HANDOFF_UNACKED` event and escalating;
- stale MRs receiving repeated target-consume instructions without executing the `STALE_MR` event, new head movement, or exact blocker path;
- watcher heartbeats re-reading and narrating full Gabe/Agent Adventures/automation/event/watcher/ledger context instead of executing a task-local MDScript hot path and the changed live state;
- CI waits handled by going idle instead of scheduling a watcher or automation and updating the coordinator with ready-or-blocked state;
- a reviewer finding an issue at the current blocking threshold, the author fixing it, and no fresh blind-review round on the new state;
- a review round treated as complete without its required one fresh blind reviewer, or a reviewer reused after repair;
- the same blind subagent reused after it has seen the author's fix path or prior findings;
- review subagents left open after follow-up questions, or closed without a parent-visible stop report, letting old review context contaminate the next loop;
- child orchestrator, worker, reviewer, or helper chat threads created by the lane left open after they are terminal or superseded, without a cleanup blocker, transfer record, or explicit durable owner;
- GitLab-tracked review grades, findings, Q&A, fix responses, evidence links, or resolution kept only in private chat instead of issue/MR notes or discussions;
- GitLab-tracked reviewer grades or findings posted by the coordinator or `root` when a target-scoped reviewer identity was available, hiding who actually reviewed the work;
- GitHub or GitLab inline review comments phrased as commands, preferences, or opinionated instructions when a concise evidence-backed question would expose the same concern without weakening the grade;
- GitLab review threads left unresolved after the concern is fixed, withdrawn, or explicitly accepted as closed;
- GitLab review threads marked resolved before the concern is materially fixed or accepted;
- majority voting used to bury a real blocker from one reviewer;
- a code smell or maintainability smell assigned an understated severity to evade the current blocking threshold;
- a root or coordinating Gabe thread performing code review, spawning code reviewers, or substituting coordinator inspection for an implementer-owned review gate;
- blog-only or instruction-only changes sent through code-review ceremony instead of direct render, validation, pipeline, and live route proof.

Review rule: require the right gate for the work type, and do not substitute the author's memory, one friendly verdict, reused reviewer context, author-led review packets, private-only review backchannels, coordinator-authored reviewer summaries, root/coordinator review, unresolved closed threads, premature thread resolution, draft-state avoidance, idle CI waiting, passive event reporting, missing parent stop reports, open terminal or superseded created chat threads, command-shaped inline review comments, understated severity, or hidden residuals for independent current-state consensus. Initial review starts from the merge-target diff, repair review starts from the last completed review tree, and terminal readiness returns to one fresh cumulative merge-target review; every mode follows neutral supporting code where needed. Round 1 blocks on all findings, round 2 on P1/P2, and later rounds on P1, while every lower finding remains visible as residual risk. Inline GitHub or GitLab review comments should be concise Gabe-shaped questions that name evidence and risk without sounding bossy or opinionated; the question style must not soften the blocker, scoped grade, or remediation entrypoint. GitHub review agents must refresh PR replies, review requests, unresolved conversations, current head, checks, and mergeability before treating any old approval, blocker, or Slack signal as final; if GitHub moved after the last signal, review the current head again. If an automation has a configured blocker severity, keep the signal scoped to that contract: lower-priority notes may be real without blocking that approval signal, while P1 blockers, missing source truth, missing authority, or stale heads must block both the review-surface approval and any Slack green check. When GitLab owns the issue or MR, GitLab also owns the visible review record, the reviewer author identity when a leased identity workflow exists, and the resolved/unresolved state of its review threads. Agents that create or own a PR/MR carry it until merge or explicit close, make it non-draft when ready, and use watchers or automation plus coordinator reminders while asynchronous gates finish. Agents that create child, worker, reviewer, or helper chats clean them up, transfer them, or report exact cleanup blockers before claiming done or supersession. Event states require action: disposition starts or is denied, target drift refreshes or blocks, unacked handoffs escalate, and stale MRs report the concrete blocker.

### Coordinator Overload

Agents lose control when coordination relies on chat memory instead of durable lane state. Watch for:

- more than five active direct lanes under one coordinator;
- a parent orchestrator managing every leaf worker instead of child coordinators for large portfolios;
- no lane ledger listing thread or automation id, owner, parent agent, repository or system, issue/PR/MR, phase, event execution, event type, stop reason, next proof, blocker, next check, and reporting path;
- no task-local MDScript hot-path re-entry for a watched or resumable lane;
- compaction, resume, or handoff followed by steering workers before live lane state is refreshed;
- completed, stalled, or blocked lanes left open because the coordinator no longer knows their state;
- child orchestrators, implementers, reviewers, or automations stopping silently without parent-visible stop reports;
- created child, worker, reviewer, or helper chat threads left open after terminal stop or supersession without cleanup status in the lane ledger;
- new delegation or ready/done claims while existing lanes have unknown owner, status, or next check;
- a root or coordinating Gabe thread personally editing application code or owning ticket implementation instead of delegating that work to a durable implementer lane.

Review rule: if the coordinator cannot name every active lane's owner, parent agent, state, event execution, event type, blocker, next proof, next check, cleanup status, and reporting path from durable state, grade the coordination plan `Not ready` until it audits and rebalances. Split above five active direct lanes into child coordinators or close/reassign lanes before adding work. If any lane has stopped without reporting to its parent, grade the coordination plan `Not ready` until the stop report exists or the failed reporting path is visible. If any created terminal or superseded chat thread remains open without transfer or cleanup blocker, grade the plan `Not ready` until cleanup is recorded. If a human-Gabe-directed root coordinator starts implementing or reviewing code, require a durable implementer lane and an implementer-owned review gate before treating the handoff as ready.

### Smell As Precedent

Agents use nearby code as a reference frame. A smell that looks tolerated becomes a pattern the next agent may copy, then the next one may amplify. Watch for:

- current code smells excused because similar code already exists nearby;
- maintainability shortcuts framed as harmless until the code grows;
- dynamic lookup, helper placement, state leakage, broad abstractions, or duplicated logic left in place because tests still pass;
- review language that names a smell but still grades the work ready.

Review rule: if Gabe would not accept the smell as a pattern for future agents to copy, block consensus until it is fixed or disproven.

### Product Surface Overclaim

Gabe's UI/product corrections often target controls that look finished but are not. Watch for:

- buttons that emit generic acknowledgements instead of changing state or emitting specific typed events;
- host-owned actions that are not visibly host-owned;
- CLI commands or target selectors whose names imply broader or narrower ownership than the implementation actually has;
- graphs that render but do not communicate operational facts;
- responsive layouts proven only at the first viewport;
- UI feature work proven by one broad screenshot, DOM-only assertion, or uninspected snapshot instead of one visual snapshot per changed or claimed feature;
- proof that covers unique selectors but not every visible control instance.

Review rule: every visible control, command, target selector, and UI feature is a claim. For UI review, require a current visual snapshot for each changed or claimed feature, inspect it, and connect it to the feature claim. Either prove the surface owns the behavior and blast radius, prove the host event contract, or remove/disable the surface.

### Publication And Blog Shape

Agent Adventures exists to preserve judgment, not command logs. Watch for:

- posts that lead with commands, branch names, local paths, or implementation chronology;
- missing first-person authorship by the article writer;
- missing `published_at`, `project`, or `gabe_provenance`;
- onboarding used for ordinary useful posts instead of mandatory catch-up;
- public artifacts with local filesystem paths, private endpoints, secrets, raw sensitive identifiers, or unredacted customer data.

Review rule: public writing should explain the pressure, the assumption, the correction, the decision, and the rule for the next agent.

### Skill Context Before Blog Search

Agent Adventures should feed the living skills instead of becoming a repeated runtime tax. Watch for:

- agents rereading onboarding posts or searching the full blog before checking the relevant installed Gabe skill;
- watcher, monitor, or resumed-goal turns that reload and narrate blog context instead of executing the goal MDScript plus current live state;
- skill updates that copy article summaries instead of extracting durable operating rules;
- agents using old skill context after a new human correction contradicts it;
- agents treating skill context as a substitute for current repo, tracker, CI, review, telemetry, or proof state.

Review rule: the installed skills are the first operating context. Ask "What would Gabe do?" from skills, current instructions, and live evidence first. Search Agent Adventures only when the skill context is missing, stale, contradicted, insufficient for the decision, explicitly requested, or being refreshed into the skills. When a blog lesson becomes durable, update the skill or correction-pattern reference so future agents do not have to rediscover it.

## High-Signal Posts For Refreshes

Use these as calibration anchors when daily refreshes need examples:

- `2026-06-16-widget-proof-should-not-start-itself.qmd`: screenshots, buttons, widget boundaries, host-owned actions, responsive proof, and release readiness.
- `2026-06-19-gabe-skill-project-agnostic.qmd`: skill maintenance should stay surgical, project-agnostic, and not drift into tone/personality modeling.
- `2026-06-19-subtrees-need-upstream-prs.qmd`: subtree and embedded-repo edits need upstream review surfaces.
- `2026-06-19-thinker-owns-resolution.qmd`: ownership moves require production write paths, not only tests that manufacture downstream state.
- `2026-06-20-yamux-needed-state-boundaries.qmd`: names grant authority; HSM and protocol boundaries should be explicit and observable.
- `2026-06-21-manhattan-targets-needed-blast-radius.qmd`: command and target surfaces should make resource scope, fallback state, and teardown proof explicit.
- `2026-06-21-root-coordinators-do-not-edit-code.qmd`: root coordinators are control planes; code implementation belongs in durable worker lanes with live lane ledgers.
- `2026-06-21-gabe-needed-two-operating-roles.qmd`: orchestrators coordinate, implementers execute and own review/watchers, and reviewers falsify readiness through Gabe Review.
- `2026-06-23-gabe-skills-needed-black-box-proof.qmd`: skill and instruction changes need executable or black-box proof, exact contract-field parsing, current review-round boundaries, executable MDScript resume/event paths, and concrete cleanup evidence.
- `2026-06-26-skills-should-carry-context.qmd`: installed Gabe skills are the first runtime context; Agent Adventures search is a bounded fallback or refresh path when skill context is insufficient.
- `2026-06-25-artifact-delivery-needed-mediation.qmd`: evidence access surfaces may mediate bytes, hashes, retention, and audit, but Newman or the upstream evidence owner keeps truth and publishability.
- `2026-06-26-review-watcher-needed-narrow-signal.qmd`: review watcher approvals are scoped to configured blocker severity, current head, source truth, and owning review surface.
- `2026-06-26-conflict-risk-needed-moving-refs.qmd`: advisory CI and risk artifacts need resolved refs, merge bases, current branch head, and current merge result before they become useful review evidence.
- `2026-06-26-manhattan-needed-seeded-truth.qmd`: local proof data must be real enough to exercise the surface, reset only owned state, tear down proof services, and stay narrow about what system it proves.
- `2026-06-27-gabe-1830-digest.qmd`: experiments should define reversible boundaries, ask cost or authority owners before widening, and keep labels separate from closure or mutation authority.
- `2026-06-28-gabe-0630-digest.qmd`: quiet artifact progress needs the smallest truthful completion word; drafts, source-health primitives, and response commits are not approval, release, or live behavior.
- `2026-06-28-auto-blogging-needed-model-choice.qmd`: selectable writer models are safety and provenance boundaries; requested local models must fail closed instead of falling back to hosted writers.
- `2026-06-28-autosteer-needed-authority-contract.qmd`: autosteer starts from an authority contract and owner-input handoff, not a free-running loop around a model call.
- `2026-06-28-navigator-needed-its-own-model.qmd`: pair navigation must bind the navigator agent and model explicitly instead of guessing from visible helpers or inheriting the driver model.
- `2026-06-29-navigator-had-to-lead.qmd`: when the visible workflow owner changes, remove the stale proof-of-concept topology from code, API, UI, tests, and release proof.
- `2026-06-30-auto-train-needed-session-management.qmd`: session creation, archive, steering, and tool-call events are distinct training targets with separate provenance and promotion boundaries.
- `2026-06-30-scope-was-a-proof-boundary.qmd`: reduced MR scope is a proof instruction; reviewer consensus must bind to the reduced current head, and broader infrastructure or live-proof claims stay outside.
- `2026-06-30-shield-room-audio-one-owner.qmd`: lifecycle owner, proof owner, and failure owner must line up; HSM guards and transitions should carry lifecycle eligibility instead of hidden conditionals.
- `2026-06-30-source-health-was-not-publishability.qmd`: source-health repairs can make proof paths precise and repeatable, but they do not close Newman publishability without real black-box evidence.
- `2026-07-01-gabe-0630-digest.qmd`: typed tool records, tracker state, and review state decide their own facts; proxy digests should preserve empty quote banks and mixed artifact states instead of inventing narrative confidence.
- `2026-07-01-gabe-1830-digest.qmd`: keep work on the owner surface; dependency regressions require package diff, runtime comparison, vendor contract question, and stopped rollout until the owner answers.
- `2026-07-01-shield-phone-example-stayed-honest.qmd`: examples are API surfaces; missing runtime pieces should be stated as blocked boundaries instead of hidden behind a successful-looking scaffold.
- `2026-07-01-untested-failure-paths-were-unmodeled.qmd`: in HSM code, failure tests and failure topology are one deliverable; states with only happy completion exits can wedge silently.
- `2026-07-01-velocity-still-needed-proof-ownership.qmd`: velocity should remove friction for the proof owner, not impersonate the proof owner or interfere with another lane's shared proof stack.
- `2026-07-02-gabe-0630-digest.qmd`: patch-level dependency swaps must prove actual runtime and hardware-path equivalence; open upstream reverts or approvals are not shipped fixes until the owner records say so.
- `2026-07-02-gabe-1830-digest.qmd`: approval should name current head, CI or check state, unresolved thread state, proof scope, and non-claims; route or data-owner changes require contract review before accepting the story around them.
- `2026-07-04-gabe-1830-digest.qmd`: quiet or proxy windows should use owner records and authoritative runtime fields instead of invented human-Gabe voice, optimistic labels, or green proof-lane signals treated as merge authority.
- `2026-07-05-gabe-0630-digest.qmd`: owner-facing technical questions should leave a small contract, runnable reproduction, and explicit owner-response boundary that can keep working after the asker is silent.
- `2026-07-09-subtree-syncs-need-source-owners.qmd`: subtree syncs must name the source-owning GitHub repository and intended baseline; parent integration checkouts prove source-health only and must not rewrite child history or bury overlays without owner review.
- `2026-07-10-gabe-1830-digest.qmd`: downstream resolvers, adapters, dashboards, evals, or review surfaces can mask upstream source failures; proof should separate source emission, provider or runtime response, and downstream interpretation before accepting a fix or live-proof claim.
- `2026-07-11-gabe-0630-digest.qmd`: observation-only or shadow slices must prove snapshotted inputs, excluded delivery or mutation paths, and non-claims before they can count as source-health evidence.

## Daily Refresh Rule

On refresh, compare new Agent Adventures posts against this taxonomy and `SKILL.md`. Update only when a post adds, corrects, or supersedes a durable review rule. Prefer tightening existing checklist items over appending article summaries. If a durable rule is learned, put it in the skill or this correction reference so future agents can use the compiled context without searching the blog. If no durable review behavior changed, leave the skill unchanged and record the no-op reason in the automation result.
