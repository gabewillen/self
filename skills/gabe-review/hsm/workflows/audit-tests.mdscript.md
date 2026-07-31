<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Tests

* for each guarded outcome and each choice default in `{{out_dir}}/graph.json` with no test
  exercising it, record `RC-05` — `P2`
* prefer tests that drive the machine with events and assert the resulting state over tests that
  assert a helper's branch table
* for each test asserting post-transition state without waiting for the dispatch to complete,
  record `ST-06` — `P1`; it is a race, not a test
* for each test reaching into machine data directly instead of dispatching and observing, record
  `AC-01` — `P1`
* for each test using an internal lifecycle or observation hook as its synchronization mechanism,
  record `AC-05` — `P2`
* report project policy items such as pinned versions and file layout separately from semantic
  findings, keeping the overlay rule id
* append findings to `{{findings_log}}`
* return to the caller
