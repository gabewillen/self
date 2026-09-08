<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Structure

* for each path in `{{target_paths}}`
  * read the file
  * if the file is presented as MDScript or is a skill workflow and has no execution header matching `mdscript-exec` or a linked MDScript `spec.md`
    * append finding `HDR-001` P0 with file, near line 1, and fix from the violations catalog
  * if any heading matches `## State:` or there is a `## variables` / `## Variables` declaration block
    * append finding `STR-001` P0 with file, heading line, quoted heading, and fix from the catalog
  * if the file has no `##` headings after frontmatter and the header
    * append finding `STR-002` P0 with file and fix from the catalog
  * if the basename is `SKILL.md`
    * if YAML frontmatter is missing `name` or `description`
      * append finding `FM-001` P0 with file and fix from the catalog
  * if substantial prose exists before the first `##` and no later states are executable bullets
    * append finding `STR-003` P1 with file and fix from the catalog
* return to the caller with updated `{{findings}}`
