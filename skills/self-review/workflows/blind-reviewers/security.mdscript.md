<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Security Blind Review

* set `{{reviewer_lane}}` to `security`
* set `{{reviewer_id}}` to `security`
* if the caller supplied `{{signoff_path}}`
  * set `{{signoff_boundary}}` to `{{review_signoff_dir}}` when set, otherwise `{{run_dir}}` when set, otherwise `{{artifact_dir}}`
  * if `{{signoff_boundary}}` is empty
    * set `{{blocker}}` to `no sign-off directory to contain the caller-supplied path` and stop
  * confirm it ends in `.mdscript.md` and resolves inside `{{signoff_boundary}}`
  * if it does not, set `{{blocker}}` to the out-of-scope sign-off path and stop
  * create it now, failing when it already exists, so this lane cannot overwrite another lane's or another round's sign-off
  * write only that path and do not recompute it
* otherwise set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-security.mdscript.md` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-security.mdscript.md` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-security.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract; the composing process keeps the round's log
* you are a **blind adversarial** reviewer for **penetration and security** only
* read only the neutral review packet and paths it authorizes — do not read other reviewers' sign-offs, prompts, verdicts, chat repair narratives, or preferred grades before writing your own
* default to `signed_off: false`
* actively try to prove the change is exploitable, unsafe, or security-incomplete before any sign-off

## Attack surface (security / penetration)

* threat-model the changed surface: authn/authz, input validation, injection, SSRF, path traversal, deserialisation, secrets exposure, insecure defaults, privilege boundaries, multi-tenant isolation, supply chain, unsafe shell/eval, logging of secrets, CSRF/CORS, crypto misuse, and dependency risk
* re-run or reason about hostile inputs, missing auth checks, confused-deputy paths, and failure modes that become security bugs
* inspect for hardcoded credentials, tokens, private keys, unredacted PII, and overly broad permissions
* verify security-relevant proof actually exercises the dangerous path — reject unit-only green as security proof when the claim is runtime-facing
* grade every issue `P0`/`P1`/`P2`/`P3` in `p_findings` with `location`, `summary`, `contract` (threat / control), and `remediation`
* record ≥2 real `attack_attempts` (include failed attacks)
* set `rules_reviewed` to security-relevant standards or project security rules inspected (may include AGENTS safety sections when present)
* set `objectives_checked` to the security criteria you evaluated
* set `artifact_paths` and `commands_run` from verified packet paths / repros

## Sign-off decision

* allow `signed_off: true` only when every serious security attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set front matter to `reviewer_id: "security"`, `reviewer_lane: "security"`, `review_round` from the packet, `goal` and `conversation_id` from the packet when present, `signed_off`, `verifier_summary` (≥40 chars covering attacks + residual risk), `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), `p_findings`, `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`, and `repair_resume_command` when the packet supplies one
* write a `## Signoff` state that names the lane verdict and one bullet per `p_findings` entry with its location and remediation
* write a `## Resume From Signoff` state that continues at `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs` (or the path resolved from this skill's install directory) when `signed_off` is `true`
* in that same state, when `signed_off` is `false`, name `repair_resume_command` as the next jump and require a fresh blind reviewer after repair — never re-enter this lane's own review from the sign-off
* do not write other lanes' sign-off files
* stop after writing the sign-off
