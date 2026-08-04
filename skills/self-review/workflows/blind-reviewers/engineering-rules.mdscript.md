<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Engineering Rules Blind Review

* if `{{reviewer_lane}}` is empty
  * stop and report that the lane entrypoint must set `{{reviewer_lane}}`
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute parent of this file's `workflows/blind-reviewers` directory
* if `{{rules_pack}}` is set
  * set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/{{rules_pack}}.rules.md`
  * if `{{rules_file}}` is still relative or missing
    * resolve it from this file's directory as `../../references/engineering-rules/{{rules_pack}}.rules.md`
* if `{{rules_file}}` is empty
  * stop and report that the lane entrypoint must set `{{rules_pack}}` or `{{rules_file}}`
* set `{{reviewer_id}}` to `{{reviewer_lane}}`
* set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-{{reviewer_lane}}.mdscript.md` when `{{review_signoff_dir}}` is set, otherwise `{{run_dir}}/signoff-reviewer-{{reviewer_lane}}.mdscript.md` when `{{run_dir}}` is set, otherwise `{{artifact_dir}}/signoff-reviewer-{{reviewer_lane}}.mdscript.md`
* you are a **blind adversarial** reviewer for **engineering rules in `{{rules_file}}` only**
* read only the neutral review packet, packet-authorized paths, and `{{rules_file}}` — do not read other reviewers' sign-offs, prompts, verdicts, chat repair narratives, or preferred grades before writing your own
* default to `signed_off: false`
* actively try to prove the change violates a MUST or MUST NOT rule in `{{rules_file}}` before any sign-off
* do not review agent-instruction files, security penetration, goal completeness, or UML HSM semantics unless those appear as linked obligations inside `{{rules_file}}`
* [Load Rules File](#load-rules-file)

## Load Rules File

* if `{{rules_file}}` does not exist
  * keep `signed_off: false`
  * set `remaining_gaps` to the exact missing rules path
  * [Sign-off Decision](#sign-off-decision)
* read `{{rules_file}}` end-to-end
* parse every top-level `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` heading as a rule under review
* follow Markdown See-links to related rules only when needed to interpret an in-scope rule; do not expand into an unbounded walk of the whole rules repo
* set `rules_reviewed` to `{{rules_file}}` plus any linked rule files actually opened
* [Attack Surface](#attack-surface)

## Attack Surface

* map each MUST and MUST NOT rule to the current diff, claimed done state, and packet proof
* treat SHOULD / SHOULD NOT as findings only when the change clearly chooses the discouraged path without a packet-carried exception
* treat MAY as non-blocking unless the change relies on the optional path unsafely
* attack hidden ownership, unbounded work, missing failure handling, weak API contracts, missing validation, non-deterministic tests, and language- or framework-specific violations named by the file
* reject "mostly compliant", silent rule skips, and narrative that overrides written rules
* if the lane is language- or framework-specific and no in-scope path actually uses that language or framework
  * set `lane_applicable` to `false`
  * record the search that proved non-applicability in `attack_attempts` and `evidence`
  * allow `signed_off: true` only with the same evidence bar as other n/a lanes
* grade every standing issue `P0`/`P1`/`P2`/`P3` in `p_findings` with `location`, `summary`, `contract` (rule id + keyword + title), and `remediation`
* map RFC MUST / MUST NOT breaches to at least `P1`, and release-blocking defects (data races, UB, secret leakage, unvalidated untrusted input) to `P0` when the rule text supports it
* record ≥2 real `attack_attempts` (include failed attacks and rules that did not fire)
* set `objectives_checked` to the rule ids evaluated
* set `artifact_paths` to packet paths and any files opened while checking rules
* set `commands_run` to discovery or falsification commands used
* [Sign-off Decision](#sign-off-decision)

## Sign-off Decision

* if `lane_applicable` is `false`
  * allow `signed_off: true` only when the non-applicability search is evidenced with ≥2 `evidence`, ≥2 `attack_attempts`, and ≥1 `commands_run`
  * never sign off n/a from an unsearched scope or the author's claim alone
* otherwise allow `signed_off: true` only when every serious rules attack fails, `p_findings` is `[]`, and `remaining_gaps` is `[]`
* otherwise keep `signed_off: false` with non-empty `p_findings` and/or `remaining_gaps`
* write only `{{signoff_path}}` as executable MDScript: the exact execution header, YAML front matter, then the states below
* set front matter to `reviewer_id`, `reviewer_lane`, `rules_file`, `lane_applicable`, `goal` and `conversation_id` from the packet when present, `signed_off`, `verifier_summary` (≥40 chars covering attacks + rules reviewed), `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), `p_findings`, `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, `signed_off_at`, and `repair_resume_command` when the packet supplies one
* write a `## Signoff` state that names the lane verdict, the rules file, and one bullet per `p_findings` entry with rule id, location, and remediation
* write a `## Resume From Signoff` state that continues at `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs` (or the path resolved from this skill's install directory) when `signed_off` is `true`
* in that same state, when `signed_off` is `false`, name `repair_resume_command` as the next jump and require a fresh blind reviewer after repair — never re-enter this lane's own review from the sign-off
* do not write other lanes' sign-off files
* stop after writing the sign-off
