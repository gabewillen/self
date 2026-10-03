<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Prompts

* for each path in `{{target_paths}}`
  * read the file
  * for each bullet that asks the user for input, a confirmation, or a decision
    * if the bullet does not give a `{{variable}}` or a decision name for the answer
      * append finding `PRM-001` P0 with file, heading, line, evidence quote, and fix from the catalog
    * if the answer must continue outside the current state and no `[State](#anchor)` gives that target
      * append finding `PRM-002` P1 with file, heading, line, evidence quote, and fix from the catalog
  * if the file gives its own prompt sequence for executors with tools
    * if the sequence does not write a return script before the prompt
      * append finding `PRM-003` P1 with file and fix from the catalog
    * if the sequence does not end the prompt with `mdscript-exec <return-script-path>`
      * append finding `PRM-003` P1 with file and fix from the catalog
* go back to the caller with the updated `{{findings}}`
