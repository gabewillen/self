<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Examine Circuit

* count the `{{findings}}` again to set `{{p0_count}}`, `{{p1_count}}`, and `{{p2_count}}`
* if a finding that is not waived has a rule id that starts with `LEN-`
  * set `{{circuit}}` to `open`
  * set `{{trip_gate}}` to `{{current_gate}}`
  * set `{{trip_reason}}` to `line-count violation in gate {{current_gate}}`
  * stop this state, so that the caller goes to [Trip Circuit Breaker](#trip-circuit-breaker)
* if a finding that is not waived has severity `P0`
  * set `{{circuit}}` to `open`
  * set `{{trip_gate}}` to `{{current_gate}}`
  * set `{{trip_reason}}` to `P0 violation in gate {{current_gate}}`
  * stop this state, so that the caller goes to [Trip Circuit Breaker](#trip-circuit-breaker)
* if `{{p1_count}}` is equal to or more than `{{p1_trip_threshold}}`
  * set `{{circuit}}` to `open`
  * set `{{trip_gate}}` to `{{current_gate}}`
  * set `{{trip_reason}}` to `P1 threshold {{p1_trip_threshold}} reached at gate {{current_gate}}`
  * stop this state, so that the caller goes to [Trip Circuit Breaker](#trip-circuit-breaker)
* if no trip condition is true, keep `{{circuit}}` closed

## Trip Circuit Breaker

* set `{{circuit}}` to `open`
* set `{{verdict}}` to `fail`
* set `{{gates_skipped}}` to each full-mode gate after `{{trip_gate}}`
* do not run more review gates
* [Report Verdict](#report-verdict)

## Grade Pass

* if `{{circuit}}` is `open`
  * [Report Verdict](#report-verdict)
* if a finding that is not waived has a rule id that starts with `LEN-`
  * set `{{verdict}}` to `fail`
  * [Report Verdict](#report-verdict)
* if `{{p0_count}}` is more than `0`
  * set `{{verdict}}` to `fail`
  * [Report Verdict](#report-verdict)
* if `{{p1_count}}` is more than `0`
  * set `{{verdict}}` to `pass-with-findings`
  * [Report Verdict](#report-verdict)
* set `{{verdict}}` to `pass`
* [Report Verdict](#report-verdict)

## Report Verdict

* sort `{{findings}}` by severity `P0`, `P1`, and `P2`, then by file path and line
* tell the user `Verdict: {{verdict}}`
* tell the user `Circuit: {{circuit}}`
* if `{{circuit}}` is `open`
  * tell the user `Trip gate: {{trip_gate}}`
  * tell the user `Trip reason: {{trip_reason}}`
  * tell the user `Gates skipped: {{gates_skipped}}`
* tell the user the counts `P0={{p0_count}}` `P1={{p1_count}}` `P2={{p2_count}}`
* if `{{line_counts}}` is not empty
  * show each measured file and its exact `wc -l` line count
  * show the soft limit `{{soft_line_limit}}` and the hard limit `{{hard_line_limit}}`
* for each finding, show the rule id, severity, file, line or heading, evidence quote, and fix hint
* if `{{verdict}}` is `pass`
  * tell the user that no gate tripped and each MDScript is below the soft line limit
  * tell the user that there are no other findings
* if `{{verdict}}` is `pass-with-findings`
  * show the findings that do not block, and tell the user that the circuit stayed closed
* if `{{verdict}}` is `fail`
  * tell the user to correct the findings in `{{target_paths}}`
  * tell the user to run `/mdscript-review {{target}}` again
* stop
