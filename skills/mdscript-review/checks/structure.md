<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Structure

* for each path in `{{target_paths}}`
  * read the file
  * if the file is MDScript or a skill workflow
    * if the file has no execution header for `mdscript-exec` or a linked MDScript `spec.md`
      * append finding `HDR-001` P0 with file, line 1, and fix from the violations catalog
  * if a heading starts with `## State:`, or the file has a `## variables` or `## Variables` block
    * append finding `STR-001` P0 with file, heading line, heading quote, and fix from the catalog
  * if the file has no `##` headings after the frontmatter and the header
    * append finding `STR-002` P0 with file and fix from the catalog
  * if the file name is `SKILL.md` and the YAML frontmatter has no `name` or no `description`
    * append finding `FM-001` P0 with file and fix from the catalog
  * if much text comes before the first `##` and the states after it have no executable bullets
    * append finding `STR-003` P1 with file and fix from the catalog
* go back to the caller with the updated `{{findings}}`
