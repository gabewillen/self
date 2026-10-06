# Ponytail engineering rules

Locally authored rules that are NOT vendored from gabewillen/rules. They adapt the "lazy senior developer" rules of [Ponytail](https://github.com/DietrichGebert/ponytail) (MIT, Copyright (c) 2026 DietrichGebert) to the wording of this pack. A re-vendor of the upstream rule files must not remove this file.

The goal is the least code that works. Lazy means efficient, not careless. These rules shorten the solution, never the reading.

# PONY-READ-001 MUST Understand Before You Minimize

Read the task and each file that the change touches before you select a solution.

Trace the real flow from start to end before you apply [PONY-LADDER-001](#pony-ladder-001-must-climb-the-ladder-before-new-code).

For a bug fix, find each caller of the function that you will change.

Fix the root cause once, in the shared function that all callers use. Do not add a guard to each caller.

A small diff in the wrong location is a second defect, not a lazy fix.

# PONY-LADDER-001 MUST Climb The Ladder Before New Code

Stop at the first step that satisfies the need:

1. The need is speculative. Do not build it, and say so in one line.
2. A helper, utility, type, or pattern in this repository already does it. Use it.
3. The standard library does it. Use it.
4. A native platform feature does it, for example a database constraint, CSS, or a native input type. Use it.
5. A dependency that is already installed does it. Use it.
6. One line does it. Write one line.
7. Write the minimum code that works.

If two steps work, use the higher step.

If two standard-library options have the same size, use the option that is correct on edge cases.

# PONY-ABS-001 MUST NOT Add Unrequested Abstractions

Do not add an interface with one implementation.

Do not add a factory with one product.

Do not add configuration for a value that never changes.

Do not add a wrapper that only delegates, or a layer with one caller.

Do not add boilerplate or scaffolding for a future need. The future change can add it.

# PONY-DEP-001 MUST NOT Add A Dependency For A Few Lines

Do not add a new dependency for work that a few lines, the standard library, or the platform can do.

# PONY-DEL-001 SHOULD Prefer Deletion And The Shortest Correct Diff

Prefer deletion to addition.

Prefer boring code to clever code.

Use the fewest files possible.

Use the shortest diff that is correct, in the location that [PONY-READ-001](#pony-read-001-must-understand-before-you-minimize) found.

Do not write prose that the user did not ask for to defend a simplification. Explanation that the user asked for is not debt.

# PONY-MARK-001 MUST Mark Deliberate Shortcuts

Mark each deliberate simplification that has a known limit with a `ponytail:` comment.

The comment names the limit and the trigger to upgrade it, for example `# ponytail: global lock, use per-account locks if throughput matters`.

A `ponytail:` comment without an upgrade trigger is a defect, because nobody will find the time to fix it.

# PONY-KEEP-001 MUST NOT Simplify Away Safety

Do not remove or skip input validation at trust boundaries.

Do not remove or skip error handling that prevents data loss.

Do not remove or skip security measures or accessibility basics.

Do not remove or skip anything that the user explicitly asked for. If the user asks for the full version, build it, and do not argue again.

For hardware, keep the calibration setting. A real clock drifts and a real sensor reads off.

These rules do not relax a `MUST` rule in a different selected pack.

# PONY-CHECK-001 MUST Leave One Runnable Check For Non-Trivial Logic

Non-trivial logic leaves at least one runnable check that fails if the logic breaks. Non-trivial logic includes a branch, a loop, a parser, a money path, or a security path.

The smallest check is an `assert`-based self-check or one small test file.

A trivial one-line change needs no new test.

This rule sets a minimum. A different selected pack or a repository rule can require more tests.

# PONY-OUT-001 SHOULD Report Skipped Work With Its Trigger

In the final report, name each item that you skipped and the condition that makes it necessary.

Use the form `skipped: <item>, add when <trigger>`.

Name each `ponytail:` comment that the change added.
