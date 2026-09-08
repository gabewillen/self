<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../spec.md) -->
# Generate Release Notes

Collect commits in a range, categorize them, and write CHANGELOG.md.

## Gather Changes

* if `{{git_range}}` is empty
  * find the most recent tag and set `{{git_range}}` to `<last tag>..HEAD`

* run `git log {{git_range}}` and collect the commit subjects into `{{commits}}`

## Categorize Commits

* set `{{features}}`, `{{fixes}}`, and `{{chores}}` to empty lists

* for each subject in `{{commits}}`
  * if it starts with `feat:` or `feature:`, add it to `{{features}}`
  * else if it starts with `fix:` or `bug:`, add it to `{{fixes}}`
  * else add it to `{{chores}}`

## Generate Notes

* start with an empty document

* if `{{features}}` is not empty, add a `## Features` section listing them
* if `{{fixes}}` is not empty, add a `## Bug Fixes` section listing them
* if `{{chores}}` is not empty, add a `## Maintenance` section listing them

* write the document to `CHANGELOG.md`

* ask the user whether to regenerate
  * if yes, [Gather Changes](#gather-changes)
  * if no, report that the changelog is written
