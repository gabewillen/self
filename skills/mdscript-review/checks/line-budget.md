<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Line Budget

* if `{{soft_line_limit}}` is empty
  * set `{{soft_line_limit}}` to `200`
* if `{{hard_line_limit}}` is empty
  * set `{{hard_line_limit}}` to `500`
* set `{{line_counts}}` to an empty list
* for each path in `{{target_paths}}`
  * if the file has no execution header and no `##` state headings, go to the next path
  * run `wc -l` on the file to get the exact line count
  * do not estimate the line count
  * append `{path, line_count}` to `{{line_counts}}`
  * if `line_count` is equal to or more than `{{hard_line_limit}}`
    * append finding `LEN-001` P0 with file, `line_count`, evidence `wc -l => {{line_count}} (hard limit {{hard_line_limit}})`, and fix
  * if `line_count` is equal to or more than `{{soft_line_limit}}` and less than `{{hard_line_limit}}`
    * append finding `LEN-002` P0 with file, `line_count`, evidence `wc -l => {{line_count}} (soft limit {{soft_line_limit}})`, and fix
  * if the file has an `ALWAYS READ THE ENTIRE FILE` directive
    * append finding `LEN-003` P0 with file, line, evidence quote, and fix from the catalog
* for each MDScript path that has no `wc -l` result
  * append finding `LEN-004` P0 with file and the evidence that you did not measure it
* go back to the caller with the updated `{{findings}}` and `{{line_counts}}`
