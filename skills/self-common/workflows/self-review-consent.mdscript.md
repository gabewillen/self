<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Decide Self Review

* if `{{self_review_requested}}` is empty
  * if the user explicitly asked for a self-review or a multi-lane review of this change
    * set `{{self_review_requested}}` to `true`
  * if a goal run for this work has `self_review: requested`
    * set `{{self_review_requested}}` to `true`
  * if a goal run for this work has `self_review: declined`
    * set `{{self_review_requested}}` to `false`
* do not set `{{self_review_requested}}` from a skill rule, a hook, `AGENTS.md`, a default, or a different task
* if `{{self_review_requested}}` is `true`
  * set `{{self_review_required}}` to `true`
  * return to the caller
* if `{{self_review_requested}}` is `false`
  * set `{{self_review_required}}` to `false`
  * set `{{review_gate}}` to `declined-by-user`
  * return to the caller
* if this lane will not create or change a pull/merge request
  * if no merge into the target branch is in scope
    * set `{{self_review_required}}` to `false`
    * set `{{review_gate}}` to `not-required-until-pr-or-merge`
    * return to the caller
* [Ask For Self Review](#ask-for-self-review)

## Ask For Self Review

* set `{{self_review_required}}` to `false`
* set `{{review_gate}}` to `awaiting-user-self-review-decision`
* do not start a self-review before the user answers
* do not create or change the pull/merge request before the user answers
* do not merge before the user answers
* if this agent is a subagent, or this agent cannot ask the user
  * report to `{{parent_reporting_path}}` that the user must decide on a multi-lane self-review
  * tell the parent to ask the user and to give the answer as `self_review_requested`
  * stop
* ask the user for `{{self_review_requested}}`: "Do you want a multi-lane self-review before I open, change, or merge the pull/merge request?"
  * if the answer is yes, set `{{self_review_requested}}` to `true`
  * if the answer is no, set `{{self_review_requested}}` to `false`
  * [Decide Self Review](#decide-self-review)

## Require Self Review Consent

* use this state at the start of the `self-review` skill
* if `{{self_review_requested}}` is not `true`
  * if the user explicitly asked for this review
    * set `{{self_review_requested}}` to `true`
  * a review request, `/self-hsm-review`, or a review automation that the user set up is an explicit ask
* do not set `{{self_review_requested}}` from a skill rule, a hook, `AGENTS.md`, a default, or a different task
* if `{{self_review_requested}}` is `true`
  * return to the caller
* set `{{blocker}}` to `self-review requires an explicit user request or a yes answer`
* do not spawn blind reviewers
* report to `{{parent_reporting_path}}` that the user must ask for the self-review, or answer yes to it
* stop
