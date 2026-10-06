<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Resolve Agent Home

* if the `{{repo_root}}/skills` directory exists, set `{{skills_root}}` to it, otherwise to `~/.agents/skills`
* set `{{project_home}}` to the output of `node {{skills_root}}/../scripts/agent-home.mjs {{repo_root}}`
* if that script is not available or fails
  * set `{{main_repo_root}}` to the output of `git -C {{repo_root}} rev-parse --path-format=absolute --git-common-dir` without the final `/.git`, or to `{{repo_root}}`
  * set `{{project_name}}` to its base name, with each character outside `A-Za-z0-9._-` replaced by `-`
  * set `{{project_home}}` to `$AGENTS_HOME/projects/{{project_name}}`, or `~/.agents/projects/{{project_name}}`
* if the pack was installed with `--local`, `$SELF_LOCAL` is `1`, or the user asks for project-local state
  * set `{{project_home}}` to `{{repo_root}}/.agents`, and make sure that the repository ignores `.agents/`
* create `{{project_home}}` if it is missing
* write all agent state under `{{project_home}}`: goals, tasks, comments, plans, returns, ledgers, run state, sign-offs, and verdicts
* keep product changes in the working repository, and agent state out of it
* return to the caller
