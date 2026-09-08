<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Choose Function

* if `{{target_function}}` is empty
  * infer `{{target_function}}` from the input

* find the definition of `{{target_function}}` in the codebase

* read the full function body
  * if the function is shorter than 5 lines, warn and ask to confirm

## Analyze Complexity

* identify cyclomatic complexity `{{complexity}}`

* if `{{complexity}}` > 10
  * break `{{target_function}}` into smaller helpers
  * [Extract Helpers](#extract-helpers)

* if `{{complexity}}` <= 10
  * [Apply Refactor](#apply-refactor)

## Extract Helpers

* identify logical blocks within `{{target_function}}`
* extract each block into a private helper function `{{helper_name}}`

* update `{{target_function}}` to call the helpers

* [Apply Refactor](#apply-refactor)

## Apply Refactor

* apply the refactored version of `{{target_function}}`

* run `npm run test` to verify nothing is broken
  * if tests fail, revert and [Choose Function](#choose-function)

* run `npm run lint` to verify style
