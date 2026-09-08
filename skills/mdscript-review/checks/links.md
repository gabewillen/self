<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Links

* for each path in `{{target_paths}}`
  * read the file
  * collect every `##` heading and its Markdown anchor slug (lowercase, hyphenated heading text)
  * for each in-file link of the form `[text](#anchor)`
    * if `#anchor` does not match any heading slug in that file
      * append finding `LNK-001` P0 with file, line, the dead anchor, and fix from the catalog
  * for each relative Markdown file link `[text](relative/path.md)` or `[text](relative/path.md#heading)`
    * resolve the path relative to the current file's directory
    * if the target file does not exist
      * append finding `LNK-002` P0 with file, line, the missing path, and fix from the catalog
    * if the target exists, is treated as executable MDScript, and has no `##` headings
      * append finding `LNK-003` P1 with file, line, target path, and fix from the catalog
* return to the caller with updated `{{findings}}`
