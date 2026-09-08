<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Prompts

* for each path in `{{target_paths}}`
  * read the file
  * for each bullet that asks the user, confirms with the user, or requests a decision
    * if the bullet does not name a `{{variable}}` or an explicit decision identifier to bind the answer to
      * append finding `PRM-001` P0 with file, heading, line, evidence quote, and fix from the catalog
    * if the answer should resume outside the current state and no `[State](#anchor)` names that resume target
      * append finding `PRM-002` P1 with file, heading, line, evidence quote, and fix from the catalog
  * if the file reimplements prompt or ask sequencing for tool-using executors and never requires writing a return script before the ask, or never requires ending the prompt with `mdscript-exec <return-script-path>`
    * append finding `PRM-003` P1 with file and fix from the catalog
* return to the caller with updated `{{findings}}`
