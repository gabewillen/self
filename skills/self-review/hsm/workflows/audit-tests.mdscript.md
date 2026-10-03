<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Tests

* for each guarded outcome and each choice default in `{{out_dir}}/graph.json`
  * if no test exercises it, record `RC-05` — `P2`
* prefer tests that drive the machine with events and assert the result state
  * use these tests in place of tests that assert the branch table of a helper
* for each test that asserts the state after a transition
  * if the test does not wait until the dispatch completes, record `ST-06` — `P1`
  * write in the finding that this is a race, not a test
* for each test that reads machine data directly and does not dispatch and observe, record `AC-01` — `P1`
* for each test that uses an internal lifecycle or observation hook to synchronize, record `AC-05` — `P2`
* report project policy items, such as pinned versions and file layout, separately from semantic findings
* keep the overlay rule id on each project policy item
* append the findings to `{{findings_log}}`
* return to the caller
