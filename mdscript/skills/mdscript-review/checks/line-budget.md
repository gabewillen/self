<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Line Budget

* set `{{soft_line_limit}}` to `200` when empty
* set `{{hard_line_limit}}` to `500` when empty
* set `{{line_counts}}` to an empty list
* for each path in `{{target_paths}}`
  * if the file is not an MDScript workflow (no execution header and no `##` state headings), skip it
  * measure the exact line count with `wc -l` on the file (do not estimate, do not skip)
  * append `{path, line_count}` to `{{line_counts}}`
  * if `line_count` is greater than or equal to `{{hard_line_limit}}`
    * append finding `LEN-001` P0 with file, exact `line_count`, evidence `wc -l => {{line_count}} (hard limit {{hard_line_limit}})`, and fix from the catalog
  * if `line_count` is greater than or equal to `{{soft_line_limit}}` and less than `{{hard_line_limit}}`
    * append finding `LEN-002` P0 with file, exact `line_count`, evidence `wc -l => {{line_count}} (soft limit {{soft_line_limit}}; must be under {{soft_line_limit}})`, and fix from the catalog
  * if the file contains an `ALWAYS READ THE ENTIRE FILE` directive
    * append finding `LEN-003` P0 with file, matching line, evidence quote, and fix from the catalog
* if any path was skipped without running `wc -l` and it is an MDScript workflow
  * append finding `LEN-004` P0 with file and evidence that line count was not measured
* return to the caller with updated `{{findings}}` and `{{line_counts}}`
