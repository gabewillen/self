# Ownership and permission policy

Hold these rules while checking authority boundaries and provenance.

## Separate authority surfaces

Keep these distinct; do not infer one from another:

- triage
- edits
- push
- public mutation
- CI rerun
- merge
- release
- deployment
- close
- publication
- live-proof waiver

## Findings for authority violations

**Add findings** for:

- default-branch merges without exact permission
- subtree code edited without upstream review ownership
- review-thread cleanup that hides unfinished work
- public mutation without authority
- live-proof waivers inferred from other permissions

## Subtree / vendored / embedded upstream

When work is in a subtree, squashed import, vendored checkout, or embedded upstream repository, require the upstream PR/MR issue and review surface for code changes.

## Provenance boundaries

Preserve user, assistant, automation, worker, reviewer, and author provenance boundaries.

**Add findings** for:

- assistant decisions attributed to the user
- automation follow-ups described as direct human instructions
- provenance claims unsupported by evidence

## GitLab public writes from reviewer role

Before GitLab issue, review, or comment writes from this reviewer role:

1. Resolve GitLab sudo alias with `{{self_role}}` set to `reviewer`
2. Use the alias before the public write
3. If the alias or `gitlab-sudo-alias` tooling is unavailable for a required public review record:
   - set `{{grade}}` to `Blocked`
   - set `{{blocker}}` to the exact missing GitLab sudo alias capability
