<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Actions

* for each path in `{{target_paths}}`
  * read the file
  * for each bullet in a `##` state
    * if the bullet has two or more independent tool actions, for example run, edit, and examine
      * append finding `ACT-001` P1 with file, heading, line, evidence quote, and fix from the catalog
    * if the bullet only describes an intention with words such as "would", "should consider", or "could"
      * append finding `ACT-002` P1 with file, heading, line, evidence quote, and fix from the catalog
    * if the bullet only gives the reason for a rule and has no executable action
      * append finding `ACT-003` P2 with file, heading, line, evidence quote, and fix from the catalog
* go back to the caller with the updated `{{findings}}`
