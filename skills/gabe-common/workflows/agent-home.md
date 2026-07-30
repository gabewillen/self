<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Agent Home

* set `{{agents_home}}` to `$AGENTS_HOME` when configured, otherwise `~/.agents`
* resolve `{{agents_home}}` to an absolute path
* set `{{project_name}}` from the working repository, tracker project, or watched target
* set `{{project_home}}` to `{{agents_home}}/projects/{{project_name}}`
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
