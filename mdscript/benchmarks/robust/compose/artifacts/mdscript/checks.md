<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../../spec.md) -->
# Run Checks

A reusable check gate. Run it directly, or link to it from another workflow.

* run `npm run typecheck`
  * if it fails, stop and report the type errors

* run `npm run test -- --coverage`
  * if coverage is below 80%
    * warn the user that coverage is low
    * ask whether to proceed anyway
      * if they decline, stop and report that checks did not pass

* report that checks passed
