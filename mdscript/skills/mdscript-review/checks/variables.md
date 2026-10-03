<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Variables

* for each path in `{{target_paths}}`
  * read the file
  * record each `{{variable}}` mention
  * record each bullet that sets, finds, asks for, or gets a saved value for a variable
  * for each variable in a path, shell command, entry command, or file write target
    * if no state sets the variable and no earlier bullet tells that the caller must give it
      * append finding `VAR-001` P0 with file, first line, variable name, and fix from the catalog
  * for each variable that only a condition uses
    * if the condition is the first mention and no earlier bullet sets, finds, or asks for it
      * append finding `VAR-002` P1 with file, line, variable name, and fix from the catalog
  * for each variable of a public entry skill with a name such as `data`, `thing`, or `tmp`
    * append finding `VAR-003` P2 with file, line, variable name, and fix from the catalog
* go back to the caller with the updated `{{findings}}`
