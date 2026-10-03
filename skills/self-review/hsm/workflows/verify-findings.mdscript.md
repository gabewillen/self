<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Verify Findings

* set `{{unverified}}` to the findings in `{{findings_log}}` that have no verdict
* if `{{unverified}}` is empty, return to the caller

## Refute

* for each finding in `{{unverified}}`, run an independent terminal-lane refutation pass
  * give the pass only the rule id, the rule text, the location, and the evidence excerpt
  * also give the pass the graph or source that the finding points at
  * do not give the pass the analysis that produced the finding
  * do not give the pass the verdict of a different verifier
  * do not spawn nested agents
  * do not make parallel workers necessary
* make the verifier answer `refuted` or `stands`, with the reason, against these tests:
  * does the cited code or vertex exist as quoted, at that location, in the current tree?
  * does the rule as written really cover this, or did the audit stretch the rule to fit?
  * is there an interpretation where the code is correct? For example:
    * a builder gives the missing element
    * the reachability walk missed an entry route
    * an injected dependency, or a documented self-transition
  * do `{{enforced_patterns}}` already block it, so that it cannot occur in this tree?
  * is the consequence real, or is the finding true but inert?
* **if you are not sure, use the verdict `refuted`**
* for the terminal pass, or for a finding with a structural remediation, do three independent checks in this lane
  * use a different lens for each check: rule conformance, runtime consequence, false positive
  * keep the finding only if two or more checks return `stands`

## Record

* mark each finding `stands` or `refuted` in `{{findings_log}}`, with the verifier reasons
* keep the refuted findings in the log, with the mark refuted
* report the refuted findings, and do not delete them silently
* if a verifier shows that the evidence does not exist at the cited location
  * record that the audit produced a fabricated citation
  * run that audit again before you continue
* set `{{verified_count}}` and `{{refuted_count}}`
* return to the caller
