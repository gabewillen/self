<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Climb Least Work Ladder

* use this state before you add work
  * work is a step, a subagent, a lane, a thread, a file, or an automation
  * work is also a review lane, a model tier, a rule, or report text
* this state adapts the ladder of [Ponytail](https://github.com/DietrichGebert/ponytail) to agent work
* the code version of the ladder is in [Ponytail Rules](../../self-review/references/engineering-rules/ponytail.rules.md)
* set `{{candidate_work}}` to the item that you will add
* read and trace the problem before you climb
  * the ladder makes the solution shorter, never the reading
* stop at the first step that satisfies the need:
  * if the need is speculative, do not add `{{candidate_work}}`, and say so in one line
  * if an existing artifact, lane, goal, thread, workflow, helper, or rule does it, use that item
  * if this process can do it now with no new subagent, lane, thread, automation, or file, do it here
  * if a host built-in does it, use the built-in, for example a harness loop or a native tool
  * otherwise add the smallest new item: one subagent before many, one file before many, one rule before many
* if two steps work, use the higher step
* [Keep Required Work](#keep-required-work)

## Keep Required Work

* do not apply the ladder to these items:
  * the reading and tracing that the problem needs
  * the real proof that a claim needs
  * validation, data-loss handling, security, and accessibility
  * authority, consent, and attribution boundaries
  * anything that the user asked for, or that `AGENTS.md` or a `MUST` rule needs, for example a running-log MDScript
* if the user asks for the full version, do the full version, and do not argue again
* if `{{ponytail_level}}` is `off`, do not apply the ladder, and keep the items above
* [Report Least Work](#report-least-work)

## Report Least Work

* put the result first in the report
* for each item that you skipped, write `skipped: <item>, add when <trigger>`
* do not write prose that the user did not ask for to defend a smaller choice
* write the explanation in full when the user asks for it
* return to the caller
