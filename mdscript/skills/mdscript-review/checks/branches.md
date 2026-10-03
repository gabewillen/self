<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Branches

* for each path in `{{target_paths}}`
  * read the file
  * for each condition bullet for a failure, retry, recovery, declined confirmation, or failed check
    * if the branch has no explicit `[State](#anchor)` link and no explicit stop
      * append finding `BR-001` P0 with file, heading, line, evidence quote, and fix from the catalog
  * for each bullet that sends the flow to a different agent or heading
    * if the state has more unrelated actions after it, without an explicit stop or next-state link
      * append finding `BR-002` P1 with file, heading, line, evidence quote, and fix from the catalog
  * for each retry in text, such as "try again", that has no `[State](#anchor)` back-link
    * append finding `BR-003` P1 with file, heading, line, evidence quote, and fix from the catalog
* go back to the caller with the updated `{{findings}}`
