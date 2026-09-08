<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Branches

* for each path in `{{target_paths}}`
  * read the file
  * for each conditional bullet that describes failure, retry, recovery, declined confirmation, or missing validation
    * if the branch neither contains an explicit `[State](#anchor)` link nor an explicit stop
      * append finding `BR-001` P0 with file, heading, line, evidence quote, and fix from the catalog
  * for each bullet that routes, dispatches, or hands off to another agent or heading
    * if the state continues into further unrelated actions after the route without an explicit stop or next-state link
      * append finding `BR-002` P1 with file, heading, line, evidence quote, and fix from the catalog
  * for each prose retry such as "try again" or "re-run the check" without a `[State](#anchor)` back-link
    * append finding `BR-003` P1 with file, heading, line, evidence quote, and fix from the catalog
* return to the caller with updated `{{findings}}`
