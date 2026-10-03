<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Engineering Rules Blind Review

* if `{{reviewer_lane}}` is empty
  * report that the lane entrypoint must set `{{reviewer_lane}}`
  * stop
* if `{{review_skill_root}}` is empty
  * set `{{review_skill_root}}` to the absolute parent of the `workflows/blind-reviewers` directory of this file
* if `{{rules_pack}}` is set
  * set `{{rules_file}}` to `{{review_skill_root}}/references/engineering-rules/{{rules_pack}}.rules.md`
  * if `{{rules_file}}` is still relative or does not exist
    * resolve it from the directory of this file as `../../references/engineering-rules/{{rules_pack}}.rules.md`
* if `{{rules_file}}` is empty
  * report that the lane entrypoint must set `{{rules_pack}}` or `{{rules_file}}`
  * stop
* set `{{reviewer_id}}` to `{{reviewer_lane}}`
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
    * set `{{signoff_path}}` to `{{review_signoff_dir}}/signoff-reviewer-{{reviewer_lane}}.mdscript.md`
  * otherwise, if `{{run_dir}}` is set
    * set `{{signoff_path}}` to `{{run_dir}}/signoff-reviewer-{{reviewer_lane}}.mdscript.md`
  * otherwise set `{{signoff_path}}` to `{{artifact_dir}}/signoff-reviewer-{{reviewer_lane}}.mdscript.md`
* this lane writes one sign-off and is exempt from the running-log contract
* the process that composes the review keeps the log of the round
* you are a **blind adversarial** reviewer for **engineering rules in `{{rules_file}}` only**
* read only the neutral review packet, the paths that the packet authorizes, and `{{rules_file}}`
* before you write your sign-off, do not read these items from other reviewers:
  * sign-offs, prompts, verdicts, chat repair narratives, and preferred grades
* set `signed_off: false` as the default
* before any sign-off, try actively to prove that the change violates a `MUST` or `MUST NOT` rule in `{{rules_file}}`
* do not review agent-instruction files, security penetration, goal completeness, or UML HSM semantics
  * if `{{rules_file}}` links to these items as obligations, review them
* [Load Rules File](#load-rules-file)

## Load Rules File

* if `{{rules_file}}` does not exist
  * keep `signed_off: false`
  * set `remaining_gaps` to the exact rules path that does not exist
  * [Sign-off Decision](#sign-off-decision)
* read `{{rules_file}}` from start to end
* read each file in `{{extra_rules_files}}` from the same directory, from start to end
* attack the change against the rules in those files too
* if a file in `{{extra_rules_files}}` does not exist
  * set `{{blocker}}` to that rules path
  * stop without a sign-off
* parse each top-level `# <RULE-ID> <RFC-2119-KEYWORD> <Title>` heading as a rule under review
* if you need a related rule to interpret an in-scope rule, follow its Markdown See-link
* do not expand into an unbounded walk of the whole rules repo
* set `rules_reviewed` to `{{rules_file}}` plus the linked rule files that you opened
* [Attack Surface](#attack-surface)

## Attack Surface

* map each `MUST` and `MUST NOT` rule to the current diff, the claimed done state, and the packet proof
* if the change clearly selects the discouraged path and the packet has no exception for it
  * treat `SHOULD` or `SHOULD NOT` as a finding
* otherwise do not treat `SHOULD` or `SHOULD NOT` as a finding
* if the change uses the optional path in an unsafe way, treat `MAY` as blocking
* otherwise treat `MAY` as non-blocking
* attack hidden ownership, unbounded work, failure paths without a handler, weak API contracts, and missing validation
* attack non-deterministic tests, and the language or framework violations that the file names
* reject "mostly compliant", silent rule skips, and narrative that overrides written rules
* if the lane is language- or framework-specific and no in-scope path uses that language or framework
  * set `lane_applicable` to `false`
  * record the search that proved non-applicability in `attack_attempts` and `evidence`
  * apply the same evidence bar as other n/a lanes before you allow `signed_off: true`
* grade each issue that stands `P0`/`P1`/`P2`/`P3` in `p_findings`
  * give each issue `location`, `summary`, `contract` (rule id + keyword + title), and `remediation`
* map each RFC `MUST` / `MUST NOT` breach to `P1` or higher
* if the rule text supports it, map release-blocking defects (data races, UB, secret leakage, unvalidated untrusted input) to `P0`
* record ≥2 real `attack_attempts`, and include failed attacks and rules that did not fire
* set `objectives_checked` to the rule ids that you evaluated
* set `artifact_paths` to the packet paths and the files that you opened to check rules
* set `commands_run` to the discovery or falsification commands that you used
* [Sign-off Decision](#sign-off-decision)

## Sign-off Decision

* if `lane_applicable` is `false`
  * if the non-applicability search has ≥2 `evidence`, ≥2 `attack_attempts`, and ≥1 `commands_run`, allow `signed_off: true`
  * never sign off n/a from an unsearched scope, or from only the claim of the author
* otherwise, if all serious rules attacks fail, `p_findings` is `[]`, and `remaining_gaps` is `[]`, allow `signed_off: true`
* otherwise keep `signed_off: false` with non-empty `p_findings`, non-empty `remaining_gaps`, or both
* write only `{{signoff_path}}` as executable MDScript: YAML front matter first, then the exact execution header, then the states below
* set these front matter fields: `reviewer_id`, `reviewer_lane`, `rules_file`, `lane_applicable`, and `review_round` from the packet
* if the packet has `goal` and `conversation_id`, set them from the packet
* set `signed_off`, and set `verifier_summary` (≥40 characters about the attacks and the rules that you reviewed)
* set `evidence` (≥2), `commands_run`, `attack_attempts` (≥2), and `p_findings`
* set `rules_reviewed`, `artifact_paths`, `objectives_checked`, `remaining_gaps`, and `signed_off_at`
* if the packet gives `repair_resume_command`, set it
* write a `## Signoff` state that names the lane verdict and the rules file
* in that state, write one bullet for each `p_findings` entry, with its rule id, location, and remediation
* write a `## Resume From Signoff` state
* in that state, if `signed_off` is `true`, write a jump to `/mdscript-exec {{review_skill_root}}/workflows/triple-adversarial-blind-review.mdscript.md#aggregate-triple-signoffs`
  * as an alternative, resolve this path from the install directory of this skill
* in that state, if `signed_off` is `false`, name `repair_resume_command` as the next jump
* in that state, if `signed_off` is `false`, write that a new blind reviewer must review the repair
* never write a jump from the sign-off back into the review of this lane
* do not write the sign-off files of other lanes
* stop after you write the sign-off
