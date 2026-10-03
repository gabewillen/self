<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Security Blind Review

* set `{{reviewer_lane}}` to `security`
* set `{{reviewer_id}}` to `security`
* if the caller gave `{{signoff_path}}`
  * if `{{review_signoff_dir}}` is set
    * set `{{signoff_boundary}}` to `{{review_signoff_dir}}`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_boundary}}` to `{{run_dir}}`
  * otherwise set `{{signoff_boundary}}` to `{{artifact_dir}}`
  * if `{{signoff_boundary}}` is empty
    * set `{{blocker}}` to `no sign-off directory to contain the caller-supplied path`
    * stop
  * make sure that `{{signoff_path}}` ends in `.mdscript.md` and resolves inside `{{signoff_boundary}}`
  * if it does not
    * set `{{blocker}}` to the out-of-scope sign-off path
    * stop
  * create `{{signoff_path}}` now with an exclusive create that fails if the file exists
  * do not overwrite the sign-off of a different lane or a different round
  * write only to that path
  * do not calculate that path again
* if the caller did not give `{{signoff_path}}`
  * if `{{review_signoff_dir}}` is set
    * set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-security.mdscript.md`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_path}}` to `{{run_dir}}/signoff-reviewer-security.mdscript.md`
  * otherwise set `{{signoff_path}}` to `{{artifact_dir}}/signoff-reviewer-security.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract
* the process that composes the review keeps the log of the round
* you are a **blind adversarial** reviewer for **penetration and security** only
* read only the neutral review packet and the paths that it authorizes
* before you write your sign-off, do not read these items from other reviewers:
  * sign-offs, prompts, verdicts, chat repair narratives, and preferred grades
* set `signed_off: false` as the default
* before any sign-off, try actively to prove that the change is exploitable, unsafe, or security-incomplete

## Attack surface (security / penetration)

* make a threat model of the changed surface for these areas:
  * authn/authz, input validation, injection, SSRF, path traversal, and deserialisation
  * secrets exposure, insecure defaults, privilege boundaries, and multi-tenant isolation
  * supply-chain risk, unsafe shell/eval, secrets in logs, CSRF/CORS, crypto misuse, and dependency risk
* run again or analyze hostile inputs, missing auth checks, and confused-deputy paths
* run again or analyze failure modes that become security bugs
* inspect for hardcoded credentials, tokens, private keys, unredacted PII, and permissions that are too broad
* make sure that the security proof really exercises the dangerous path
* if the claim is runtime-facing, reject a unit-only green result as security proof
* grade each issue `P0`/`P1`/`P2`/`P3` in `p_findings`
  * give each issue `location`, `summary`, `contract` (threat / control), and `remediation`
* record ≥2 real `attack_attempts`, and include the attacks that failed
* set `rules_reviewed` to the security standards or project security rules that you inspected
  * if AGENTS safety sections are present, you can include them
* set `objectives_checked` to the security criteria that you evaluated
* set `artifact_paths` and `commands_run` from the packet paths and repros that you examined

## Sign-off decision

* if all serious security attacks fail, `p_findings` is `[]`, and `remaining_gaps` is `[]`
  * allow `signed_off: true`
* otherwise keep `signed_off: false` with non-empty `p_findings`, non-empty `remaining_gaps`, or both
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set these front matter fields: `reviewer_id: "security"`, `reviewer_lane: "security"`, and `review_round` from the packet
* if the packet has `goal` and `conversation_id`, set them from the packet
* set `signed_off`, and set `verifier_summary` (≥40 characters about the attacks and the residual risk)
* set `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), and `p_findings`
* set `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, and `signed_off_at`
* if the packet gives `repair_resume_command`, set it
* write a `## Signoff` state that names the lane verdict
* in that state, write one bullet for each `p_findings` entry, with its location and remediation
* write a `## Resume From Signoff` state
* in that state, if `signed_off` is `true`, write a jump to `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs`
  * as an alternative, resolve this path from the install directory of this skill
* in that state, if `signed_off` is `false`, name `repair_resume_command` as the next jump
* in that state, if `signed_off` is `false`, write that a new blind reviewer must review the repair
* never write a jump from the sign-off back into the review of this lane
* do not write the sign-off files of other lanes
* stop after you write the sign-off
