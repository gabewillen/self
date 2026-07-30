#!/usr/bin/env node
/**
 * Resolve where agent state lives for a working directory.
 *
 * One derivation, used by both the skills and the hooks. A worktree resolves to
 * its main repository, so every worktree of a project shares one home instead of
 * each branch getting its own.
 *
 * Usage:
 *   node scripts/agent-home.mjs [root]        prints the project home
 *   node scripts/agent-home.mjs --slug [root] prints just the slug
 */
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

export function mainRepoRoot(root) {
  try {
    const out = execFileSync(
      "git",
      ["-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (out) return dirname(resolve(root, out));
  } catch {
    // Older git, or not a repository.
  }
  try {
    const out = execFileSync("git", ["-C", root, "rev-parse", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (out) return dirname(resolve(root, out));
  } catch {
    // Not a repository; fall back to the directory itself.
  }
  return resolve(root);
}

export function projectSlug(root) {
  const base = basename(mainRepoRoot(root)) || "project";
  return base.replace(/[^A-Za-z0-9._-]+/g, "-") || "project";
}

export function projectHome(root) {
  if (process.env.GABE_AGENTS_LOCAL === "1") return join(resolve(root), ".agents");
  const home = process.env.AGENTS_HOME
    ? resolve(process.env.AGENTS_HOME)
    : join(homedir(), ".agents");
  return join(home, "projects", projectSlug(root));
}

const isMain = process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));
if (isMain) {
  const args = process.argv.slice(2);
  const slugOnly = args.includes("--slug");
  const root = args.find((a) => !a.startsWith("--")) || process.cwd();
  console.log(slugOnly ? projectSlug(root) : projectHome(root));
}
