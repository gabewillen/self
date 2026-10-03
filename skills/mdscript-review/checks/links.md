<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Links

* for each path in `{{target_paths}}`
  * read the file
  * record each `##` heading and its Markdown anchor slug (lowercase heading text with hyphens)
  * for each link in the file with the form `[text](#anchor)`
    * if `#anchor` is not the slug of a heading in that file
      * append finding `LNK-001` P0 with file, line, the dead anchor, and fix from the catalog
  * for each relative Markdown link `[text](relative/path.md)` or `[text](relative/path.md#heading)`
    * find the path from the directory of the current file
    * if the target file does not exist
      * append finding `LNK-002` P0 with file, line, the path that is not there, and fix from the catalog
    * if the target is executable MDScript and has no `##` headings
      * append finding `LNK-003` P1 with file, line, target path, and fix from the catalog
* go back to the caller with the updated `{{findings}}`
