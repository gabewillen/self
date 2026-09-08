<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Actions

* for each path in `{{target_paths}}`
  * read the file
  * for each bullet under a `##` state
    * if the bullet clearly performs two or more independent tool actions (for example run then edit then verify without nesting as a single failure branch)
      * append finding `ACT-001` P1 with file, heading, line, evidence quote, and fix from the catalog
    * if the bullet only narrates intent using phrasing such as "would", "should consider", or "could" instead of commanding an action
      * append finding `ACT-002` P1 with file, heading, line, evidence quote, and fix from the catalog
    * if the bullet is pure rationale about why a rule exists and names no executable action
      * append finding `ACT-003` P2 with file, heading, line, evidence quote, and fix from the catalog
* return to the caller with updated `{{findings}}`
