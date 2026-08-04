#!/usr/bin/env node
/**
 * Validate MDScript files against the mdscript-write contract.
 *
 * Usage:
 *   node scripts/validate-mdscript.mjs [path ...]     (default: skills/)
 *   node scripts/validate-mdscript.mjs --json
 *
 * Exits 1 when any error-level finding exists, so a review gate can run it.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const roots = args.filter((a) => !a.startsWith("--"));
const searchRoots = roots.length ? roots : ["skills"];

const HEADER = "mdscript: use the mdscript-exec";
const LINE_TARGET = 200;
const LINE_CEILING = 500;
// Illustrative anchors in the authoring docs, not real targets.
const PLACEHOLDER = /^(#?(anchor|title|verify|setup-name|state-title)|url|path\/to|examples\/|templates\/)/;
const RATIONALE =
  /(;|—)\s*(it |a |the executor|which |that is|because |these |they )/i;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  if (statSync(dir).isFile()) return dir.endsWith(".md") ? [...out, dir] : out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, out) : p.endsWith(".md") && out.push(p);
  }
  return out;
}

function anchorOf(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9 \-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parse(file) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  const states = [];
  const body = [];
  let inFence = false;
  // Front matter is the block between the first `---` on line 1 and the next
  // `---`, however long the description runs.
  let inFrontMatter = lines[0]?.trim() === "---";
  let frontMatterDone = !inFrontMatter;
  lines.forEach((line, i) => {
    const n = i + 1;
    if (inFrontMatter) {
      if (n > 1 && line.trim() === "---") {
        inFrontMatter = false;
        frontMatterDone = true;
      }
      return;
    }
    void frontMatterDone;
    if (line.trim().startsWith("```")) inFence = !inFence;
    else if (!inFence) {
      if (/^## /.test(line)) states.push({ name: line.slice(3).trim(), line: n });
      body.push({ line: n, text: line });
    }
  });
  return { text, lines, states, body, isMdscript: text.includes(HEADER) };
}

const files = searchRoots.flatMap((r) => walk(r));
const parsed = new Map(files.map((f) => [resolve(f), parse(f)]));
const setVars = new Set();
for (const { text } of parsed.values()) {
  for (const line of text.split("\n")) {
    if (!/^\s*\* (set|otherwise set|restore|infer|resolve|read) /.test(line)) continue;
    for (const m of line.matchAll(/\{\{([a-z0-9_]+)\}\}/g)) setVars.add(m[1]);
  }
  for (const m of text.matchAll(/front matter[^\n]*`([a-z0-9_]+)`/g)) setVars.add(m[1]);
}
// Values a caller or runtime supplies rather than a state setting them.
const INHERITED = new Set([
  "repo_root", "parent_agent", "parent_reporting_path", "project_name", "skill_root",
  "self_role", "conversation_id", "run_id", "run_dir", "session_dir", "goal_text",
  "workflow", "home", "task_id", "lane_id", "issue_or_mr", "watched_target",
]);

const findings = [];
const add = (file, line, level, rule, message) =>
  findings.push({ file: relative(process.cwd(), file), line, level, rule, message });

for (const [abs, doc] of parsed.entries()) {
  const { text, lines, states, body, isMdscript } = doc;

  if (abs.endsWith("SKILL.md")) {
    if (!/^---\n[\s\S]*?\nname:|^---\nname:/m.test(text))
      add(abs, 1, "error", "frontmatter", "SKILL.md has no YAML frontmatter with name");
    if (!/\ndescription:/.test(text.split("---")[1] || ""))
      add(abs, 1, "error", "frontmatter", "SKILL.md frontmatter has no description");
    if (!isMdscript)
      add(abs, 1, "error", "header", "SKILL.md has no MDScript execution header");
  }
  if (!isMdscript) continue;

  // The name carries the grammar: an MDScript that does not say so in its
  // filename gets read and edited as a document, which is how invalid MDScript
  // gets written. SKILL.md is the one name the harness fixes for us.
  if (!abs.endsWith(".mdscript.md") && !abs.endsWith("SKILL.md"))
    add(
      abs,
      1,
      "error",
      "naming",
      "carries the MDScript execution header but is not named <name>.mdscript.md",
    );

  if (lines.length > LINE_CEILING)
    add(abs, lines.length, "error", "size", `${lines.length} lines exceeds the ${LINE_CEILING}-line ceiling`);
  else if (lines.length > LINE_TARGET)
    add(abs, lines.length, "warn", "size", `${lines.length} lines exceeds the ${LINE_TARGET}-line target; extract states into linked sub-scripts`);

  for (const { line, text: l } of body) {
    if (/^### /.test(l))
      add(abs, line, "error", "structure", "`###` is not a state; use `##` or fold into the parent state");
    if (l && !/^\s/.test(l) && !/^(#|<!--|\||\*|-|>)/.test(l))
      add(abs, line, "error", "narration", "prose outside a bullet; a state body is executable steps");
    if (/^\s*\d+[.)]\s/.test(l))
      add(
        abs,
        line,
        "error",
        "ordered-list",
        "numbered list in a state body; sequence is expressed by bullet order and heading links",
      );
    if (/^\s*\* /.test(l) && RATIONALE.test(l))
      add(abs, line, "warn", "rationale", "bullet explains why rather than naming an action; move it to a reference file");
  }

  // Links and anchors, including /mdscript-exec re-entry commands.
  const dir = dirname(abs);
  for (const m of text.matchAll(/\]\(([^)]+)\)/g)) {
    const link = m[1];
    if (/^(https?:|mailto:)/.test(link) || PLACEHOLDER.test(link)) continue;
    const [path, anchor] = link.split("#");
    const target = path ? resolve(dir, path) : abs;
    const line = text.slice(0, m.index).split("\n").length;
    if (!existsSync(target)) {
      add(abs, line, "error", "link", `link target does not exist: ${link}`);
      continue;
    }
    if (!anchor) continue;
    const doc2 = parsed.get(target) || parse(target);
    if (!doc2.states.some((s) => anchorOf(s.name) === anchor))
      add(abs, line, "error", "anchor", `no \`## \` state matches #${anchor} in ${path || "this file"}`);
  }

  for (const m of text.matchAll(/mdscript-exec\s+([^\s`'"]+)#([a-z0-9-]+)/g)) {
    const [, path, anchor] = m;
    if (path.includes("{{") || path.startsWith("<")) continue;
    const target = path.startsWith("~") || path.startsWith("/") ? null : resolve(dir, path);
    if (!target || !existsSync(target)) continue;
    const line = text.slice(0, m.index).split("\n").length;
    const doc2 = parsed.get(resolve(target)) || parse(target);
    if (!doc2.states.some((s) => anchorOf(s.name) === anchor))
      add(abs, line, "error", "reentry", `re-entry #${anchor} matches no \`## \` state in ${path}`);
  }

  // Only flag a variable used inside a path or command: an unset {{var}} there
  // builds a path that resolves to nothing, which is the failure that hides.
  for (const m of text.matchAll(/`([^`\n]*\{\{[a-z0-9_]+\}\}[^`\n]*)`/g)) {
    const token = m[1];
    const looksPath = token.includes("/") || /^(gh|node|bash|python3|setsid|tail)\s/.test(token);
    if (!looksPath) continue;
    for (const v of token.matchAll(/\{\{([a-z0-9_]+)\}\}/g)) {
      const name = v[1];
      if (setVars.has(name) || INHERITED.has(name)) continue;
      const line = text.slice(0, m.index).split("\n").length;
      add(abs, line, "error", "variable", `{{${name}}} builds a path or command but no state sets it`);
    }
  }

  const seen = new Set();
  for (const s of states) {
    const a = anchorOf(s.name);
    if (seen.has(a)) add(abs, s.line, "error", "duplicate-state", `duplicate state anchor #${a}`);
    seen.add(a);
  }
}

const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");
if (asJson) {
  console.log(JSON.stringify({ files: parsed.size, findings }, null, 2));
} else {
  for (const f of [...errors, ...warns])
    console.log(`${f.level.toUpperCase()} ${f.file}:${f.line} [${f.rule}] ${f.message}`);
  console.log(
    `\n${parsed.size} files checked — ${errors.length} error(s), ${warns.length} warning(s)`,
  );
}
process.exit(errors.length ? 1 : 0);
