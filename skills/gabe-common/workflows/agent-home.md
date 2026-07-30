<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Agent Home

* run `node {{skills_root}}/../scripts/agent-home.mjs {{repo_root}}` and set `{{project_home}}` to its output
* if that script is not available, derive the same value by hand:
  * set `{{agents_home}}` to `$AGENTS_HOME` when configured, otherwise `~/.agents`
  * resolve `{{agents_home}}` to an absolute path
  * set `{{main_repo_root}}` to the output of `git -C {{repo_root}} rev-parse --path-format=absolute --git-common-dir` with the trailing `/.git` removed
  * if that command fails, set `{{main_repo_root}}` to `{{repo_root}}`
  * set `{{project_name}}` to the base name of `{{main_repo_root}}` with every character outside `A-Za-z0-9._-` replaced by `-`
  * set `{{project_home}}` to `{{agents_home}}/projects/{{project_name}}`
* do not hand-pick `{{project_name}}`
* resolve a worktree to its main repository so every worktree of a project shares one home
* create `{{project_home}}` when missing
* set `{{local_mode}}` to `true` only when one of these is true:
  * the pack was installed with `--local`
  * `$GABE_AGENTS_LOCAL` is `1`
  * the user asked for project-local agent state in the current message
* if `{{local_mode}}` is `true`
  * set `{{project_home}}` to `{{repo_root}}/.agents`
  * add `.agents/` to the repository's ignore file when it is not already ignored
* [Keep The Working Repository Clean](#keep-the-working-repository-clean)

## Keep The Working Repository Clean

* write goals, tasks, comments, plans, instructions, returns, ledgers, run state, review baselines, sign-offs, verdicts, spools, and audit output under `{{project_home}}`
* do not create agent directories in the working repository when `{{local_mode}}` is not `true`
* do not write agent state into `.cursor/`, `.gabe/`, `.mdscript/`, or a similar repository directory unless `{{local_mode}}` is `true`
* read a repository-local path from an earlier run when it exists, then write the refreshed artifact under `{{project_home}}`
* keep product changes in the working repository and agent control state out of it
* return to the caller
