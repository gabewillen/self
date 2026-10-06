<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Decide Self Review

* set `{{self_review_requested}}` only from the user:
  * `true` if the user asked for a self-review, or the goal run has `self_review: requested`
  * `false` if the user said no, or the goal run has `self_review: declined`
* never set it from a skill rule, a hook, `AGENTS.md`, a default, or a different task
* if it is `true`, set `{{self_review_required}}` to `true`, and return to the caller
* set `{{self_review_required}}` to `false`
* if it is `false`, set `{{review_gate}}` to `declined-by-user`, and return to the caller
* if this lane does not create, change, or merge a pull/merge request
  * set `{{review_gate}}` to `not-required-until-pr-or-merge`, and return to the caller
* set `{{review_gate}}` to `awaiting-user-self-review-decision`
* do not review, open, change, or merge the pull/merge request before the user answers
* if this agent cannot ask the user, report the question to `{{parent_reporting_path}}`, and stop
* ask the user: "Do you want a multi-lane self-review before I open, change, or merge the pull/merge request?"
* [Decide Self Review](#decide-self-review)

## Require Self Review Consent

* if the user asked for this review, set `{{self_review_requested}}` to `true`
  * a review request, `/self-hsm-review`, or a review automation that the user set up is an ask
* if `{{self_review_requested}}` is `true`, return to the caller
* do not spawn blind reviewers
* report to `{{parent_reporting_path}}` that the user must ask for the self-review, or say yes to it
* stop
