<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Agent Home

* if the `{{repo_root}}/skills` directory exists
  * set `{{skills_root}}` to `{{repo_root}}/skills`
* if that directory does not exist
  * set `{{skills_root}}` to `~/.agents/skills`
* run `node {{skills_root}}/../scripts/agent-home.mjs {{repo_root}}`
* if the script succeeds
  * set `{{project_home}}` to the script output
* if that script is not available or fails
  * [Derive Agent Home By Hand](#derive-agent-home-by-hand)
* do not select `{{project_name}}` by hand
* resolve a worktree to its main repository, so that all worktrees of a project use one home
* if `{{project_home}}` does not exist
  * create `{{project_home}}`
  * if the create operation fails, stop and report the exact path and error
* set `{{local_mode}}` to `true` only if one of these conditions is true:
  * the pack was installed with `--local`
  * `$SELF_LOCAL` is `1`
  * the user asked for project-local agent state in the current message
* if `{{local_mode}}` is `true`
  * set `{{project_home}}` to `{{repo_root}}/.agents`
  * if the repository ignore file does not already ignore `.agents/`, add `.agents/` to it
* [Keep The Working Repository Clean](#keep-the-working-repository-clean)

## Derive Agent Home By Hand

* if `$AGENTS_HOME` is set
  * set `{{agents_home}}` to `$AGENTS_HOME`
* if `$AGENTS_HOME` is not set
  * set `{{agents_home}}` to `~/.agents`
* resolve `{{agents_home}}` to an absolute path
* run `git -C {{repo_root}} rev-parse --path-format=absolute --git-common-dir`
* if that command fails
  * set `{{main_repo_root}}` to `{{repo_root}}`
  * [Finish Derived Agent Home](#finish-derived-agent-home)
* set `{{main_repo_root}}` to that output
* remove the `/.git` at the end of `{{main_repo_root}}`
* [Finish Derived Agent Home](#finish-derived-agent-home)

## Finish Derived Agent Home

* set `{{project_name}}` to the base name of `{{main_repo_root}}`
* in `{{project_name}}`, replace each character outside `A-Za-z0-9._-` with `-`
* set `{{project_home}}` to `{{agents_home}}/projects/{{project_name}}`
* return to [Resolve Agent Home](#resolve-agent-home)

## Keep The Working Repository Clean

* write all agent output under `{{project_home}}`
  * this output includes goals, tasks, comments, plans, instructions, returns, and ledgers
  * this output also includes run state, review baselines, sign-offs, verdicts, spools, and audit output
* if `{{local_mode}}` is not `true`, do not create agent directories in the working repository
* if `{{local_mode}}` is not `true`, do not write agent state into `.cursor/`, `.self/`, `.mdscript/`, or a similar repository directory
* if a repository-local path from an earlier run exists, read it
* write the new version of that artifact under `{{project_home}}`
* keep product changes in the working repository
* keep agent control state out of the working repository
* return to the caller
