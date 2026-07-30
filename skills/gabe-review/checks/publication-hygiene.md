<!-- mdscript: use the mdscript-exec skill or read [mdscript.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/README.md) -->

## Check Publication Hygiene

* if the artifact is public writing, documentation, issue/MR/PR text, release notes, dashboard text, or a decision record
  * require portable, sanitized content

* add findings for local filesystem paths, private endpoints, secrets, unredacted customer data, raw transcript dumps, command-log prose, or third-person masking of the author's own actions

* add findings for metadata the publication surface requires but the artifact is missing, using the surface's own contract as the source of truth
