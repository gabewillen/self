<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Evaluate Circuit

* recompute `{{p0_count}}`, `{{p1_count}}`, and `{{p2_count}}` from `{{findings}}`
* if any unwaived finding has rule id starting with `LEN-`
  * set `{{circuit}}` to `open`
  * set `{{trip_gate}}` to `{{current_gate}}`
  * set `{{trip_reason}}` to `line-count violation in gate {{current_gate}}`
  * stop this state so the caller routes to [Trip Circuit Breaker](#trip-circuit-breaker)
* if any finding in `{{findings}}` has severity `P0` and is not waived
  * set `{{circuit}}` to `open`
  * set `{{trip_gate}}` to `{{current_gate}}`
  * set `{{trip_reason}}` to `P0 violation in gate {{current_gate}}`
  * stop this state so the caller routes to [Trip Circuit Breaker](#trip-circuit-breaker)
* if `{{p1_count}}` is greater than or equal to `{{p1_trip_threshold}}`
  * set `{{circuit}}` to `open`
  * set `{{trip_gate}}` to `{{current_gate}}`
  * set `{{trip_reason}}` to `P1 threshold {{p1_trip_threshold}} reached at gate {{current_gate}}`
  * stop this state so the caller routes to [Trip Circuit Breaker](#trip-circuit-breaker)
* leave `{{circuit}}` closed when neither trip condition holds

## Trip Circuit Breaker

* set `{{circuit}}` to `open`
* set `{{verdict}}` to `fail`
* set `{{gates_skipped}}` to every full-mode gate after `{{trip_gate}}`
* do not run any further review gates
* [Report Verdict](#report-verdict)

## Grade Pass

* if `{{circuit}}` is `open`
  * [Report Verdict](#report-verdict)
* if any unwaived finding has rule id starting with `LEN-`
  * set `{{verdict}}` to `fail`
  * [Report Verdict](#report-verdict)
* if `{{p0_count}}` is greater than `0`
  * set `{{verdict}}` to `fail`
  * [Report Verdict](#report-verdict)
* if `{{p1_count}}` is greater than `0`
  * set `{{verdict}}` to `pass-with-findings`
  * [Report Verdict](#report-verdict)
* set `{{verdict}}` to `pass`
* [Report Verdict](#report-verdict)

## Report Verdict

* order `{{findings}}` by severity `P0`, then `P1`, then `P2`, then file path and line
* report `Verdict: {{verdict}}`
* report `Circuit: {{circuit}}`
* if `{{circuit}}` is `open`
  * report `Trip gate: {{trip_gate}}`
  * report `Trip reason: {{trip_reason}}`
  * report `Gates skipped: {{gates_skipped}}`
* report counts `P0={{p0_count}}` `P1={{p1_count}}` `P2={{p2_count}}`
* if `{{line_counts}}` is not empty
  * report each measured file and its exact `wc -l` line count against soft limit `{{soft_line_limit}}` (default 200) and hard limit `{{hard_line_limit}}` (default 500)
* for each finding, report rule id, severity, file, line or heading, evidence quote, and fix hint from the violations catalog
* if `{{verdict}}` is `pass`
  * report that every run gate closed without trip, every measured MDScript is under the soft line limit, and no residual findings remain
* if `{{verdict}}` is `pass-with-findings`
  * report residual non-blocking findings and that the circuit stayed closed
* if `{{verdict}}` is `fail`
  * report the smallest repair entrypoint: fix the listed findings in `{{target_paths}}`, then re-run `/mdscript-review {{target}}`
* stop
