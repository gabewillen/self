<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Gather Changes

* if `{{git_range}}` is empty
  * infer `{{git_range}}` from the last tag to HEAD

* collect commits in `{{git_range}}` using `git log`

## Categorize Commits

* group commits into categories:
  * `{{features}}`: commits matching "feat:" or "feature:"
  * `{{fixes}}`: commits matching "fix:" or "bug:"
  * `{{chores}}`: everything else

## Generate Notes

* if `{{features}}` is not empty
  * list each under a "## Features" heading

* if `{{fixes}}` is not empty
  * list each under a "## Bug Fixes" heading

* if `{{chores}}` is not empty
  * list each under a "## Maintenance" heading

* write the result to `CHANGELOG.md`

* [Gather Changes](#gather-changes) if the user wants to regenerate
