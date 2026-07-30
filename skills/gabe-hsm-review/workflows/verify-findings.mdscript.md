<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Verify Findings

* set `{{unverified}}` to the findings in `{{findings_log}}` with no verdict
* if `{{unverified}}` is empty, return to the caller

## Refute

* for each finding in `{{unverified}}`, run an independent subagent in parallel, tasked to **refute**
  it, given only: rule id and rule text, location, evidence excerpt, and the graph or source it
  points at — never the reasoning that produced the finding, and never another verifier's verdict
* the verifier answers `refuted` or `stands`, with the reason, against these tests:
  * does the cited code or vertex exist as quoted, at that location, in the current tree?
  * does the rule as written actually cover this, or was it stretched to fit?
  * is there a reading under which the code is correct — a builder that supplies the missing
    element, an entry route the reachability walk missed, an injected dependency, a deliberate
    self-transition that is documented?
  * is it already blocked by `{{enforced_patterns}}`, making it unreachable in this tree?
  * is the consequence real, or is the finding true but inert?
* **default to `refuted` when uncertain**
* for the terminal pass, or any finding whose remediation is structural, use three blind verifiers
  with distinct lenses — rule conformance, runtime consequence, false positive — and keep the
  finding only when at least two return `stands`

## Record

* mark each finding `stands` or `refuted` with the verifier reasons in `{{findings_log}}`
* keep refuted findings in the log marked refuted; report them, do not silently delete them
* if a verifier shows the evidence does not exist at the cited location, record that the audit
  produced a fabricated citation and re-run that audit before continuing
* set `{{verified_count}}` and `{{refuted_count}}`
* return to the caller
