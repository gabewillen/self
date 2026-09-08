<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Variables

* for each path in `{{target_paths}}`
  * read the file
  * collect every `{{variable}}` mention
  * collect every bullet that sets, infers, asks for, or restores a variable
  * for each variable used to build a path, shell command, re-entry command, or file write target
    * if no state in this file sets, infers, asks for, or restores it, and no earlier bullet documents that the caller must supply it
      * append finding `VAR-001` P0 with file, first use line, variable name, and fix from the catalog
  * for each variable used only in a condition
    * if its first mention is the condition and no prior set/infer/ask exists in file order
      * append finding `VAR-002` P1 with file, line, variable name, and fix from the catalog
  * for each public entry skill variable named `data`, `thing`, `tmp`, or similarly vague
    * append finding `VAR-003` P2 with file, line, variable name, and fix from the catalog
* return to the caller with updated `{{findings}}`
