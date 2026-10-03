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
// Named so call sites do not pass a bare severity string (LOCAL-ARG-001).
const ERROR = "error";
const WARN = "warn";
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
    if (!/^\s*\* (set|otherwise set|restore|infer|find|resolve|read) /.test(line)) continue;
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
const add = ({ file, line, level, rule, message }) =>
  findings.push({ file: relative(process.cwd(), file), line, level, rule, message });

for (const [abs, doc] of parsed.entries()) {
  const { text, lines, states, body, isMdscript } = doc;

  if (abs.endsWith("SKILL.md")) {
    if (!/^---\n[\s\S]*?\nname:|^---\nname:/m.test(text))
      add({ file: abs, line: 1, level: ERROR, rule: "frontmatter", message: "SKILL.md has no YAML frontmatter with name" });
    if (!/\ndescription:/.test(text.split("---")[1] || ""))
      add({ file: abs, line: 1, level: ERROR, rule: "frontmatter", message: "SKILL.md frontmatter has no description" });
    if (!isMdscript)
      add({ file: abs, line: 1, level: ERROR, rule: "header", message: "SKILL.md has no MDScript execution header" });
  }
  if (!isMdscript) continue;

  // A record's readers parse front matter off the first line. A file that
  // carries front matter after the execution header parses as absent, which is
  // how a whole review gate went inert without any error.
  if (text.includes("\n---\n") && lines[0]?.trim() !== "---") {
    const fmLine = lines.findIndex((l) => l.trim() === "---") + 1;
    if (fmLine > 1)
      add({ file: abs, line: fmLine, level: ERROR, rule: "frontmatter-order", message: "YAML front matter must start on line 1; readers parse it before anything else" });
  }

  // The name carries the grammar: an MDScript that does not say so in its
  // filename gets read and edited as a document, which is how invalid MDScript
  // gets written. SKILL.md is the one name the harness fixes for us.
  if (!abs.endsWith(".mdscript.md") && !abs.endsWith("SKILL.md"))
    add({ file: abs, line: 1, level: ERROR, rule: "naming", message: "carries the MDScript execution header but is not named <name>.mdscript.md" });

  if (lines.length > LINE_CEILING)
    add({ file: abs, line: lines.length, level: ERROR, rule: "size", message: `${lines.length} lines exceeds the ${LINE_CEILING}-line ceiling` });
  else if (lines.length > LINE_TARGET)
    add({ file: abs, line: lines.length, level: WARN, rule: "size", message: `${lines.length} lines exceeds the ${LINE_TARGET}-line target; extract states into linked sub-scripts` });

  for (const { line, text: l } of body) {
    if (/^### /.test(l))
      add({ file: abs, line: line, level: ERROR, rule: "structure", message: "`###` is not a state; use `##` or fold into the parent state" });
    if (l && !/^\s/.test(l) && !/^(#|<!--|\||\*|-|>)/.test(l) && !/^\d+[.)]\s/.test(l))
      add({ file: abs, line: line, level: ERROR, rule: "narration", message: "prose outside a bullet; a state body is executable steps" });
    if (/^\s*\d+[.)]\s/.test(l))
      add({ file: abs, line: line, level: ERROR, rule: "ordered-list", message: "numbered list in a state body; sequence is expressed by bullet order and heading links" });
    if (/^\s*\* /.test(l) && RATIONALE.test(l))
      add({ file: abs, line: line, level: WARN, rule: "rationale", message: "bullet explains why rather than naming an action; move it to a reference file" });
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
      add({ file: abs, line: line, level: ERROR, rule: "link", message: `link target does not exist: ${link}` });
      continue;
    }
    if (!anchor) continue;
    const doc2 = parsed.get(target) || parse(target);
    if (!doc2.states.some((s) => anchorOf(s.name) === anchor))
      add({ file: abs, line: line, level: ERROR, rule: "anchor", message: `no \`## \` state matches #${anchor} in ${path || "this file"}` });
  }

  for (const m of text.matchAll(/mdscript-exec\s+([^\s`'"]+)#([a-z0-9-]+)/g)) {
    const [, path, anchor] = m;
    if (path.includes("{{") || path.startsWith("<")) continue;
    const target = path.startsWith("~") || path.startsWith("/") ? null : resolve(dir, path);
    if (!target || !existsSync(target)) continue;
    const line = text.slice(0, m.index).split("\n").length;
    const doc2 = parsed.get(resolve(target)) || parse(target);
    if (!doc2.states.some((s) => anchorOf(s.name) === anchor))
      add({ file: abs, line: line, level: ERROR, rule: "reentry", message: `re-entry #${anchor} matches no \`## \` state in ${path}` });
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
      add({ file: abs, line: line, level: ERROR, rule: "variable", message: `{{${name}}} builds a path or command but no state sets it` });
    }
  }

  const seen = new Set();
  for (const s of states) {
    const a = anchorOf(s.name);
    if (seen.has(a)) add({ file: abs, line: s.line, level: ERROR, rule: "duplicate-state", message: `duplicate state anchor #${a}` });
    seen.add(a);
  }
}

// ASD-STE100 language gate (mdscript spec "Language: ASD-STE100"). Only the
// rules a script can decide are checked here: sentence length (STE-001),
// unapproved words (STE-002), and contractions (STE-006). Passive voice, -ing
// forms, noun clusters, and condition order stay with the review lanes.
// Headings and link text are state names and durable re-entry anchors, so they
// count as technical names; code spans, variables, link targets, comments, and
// fenced blocks are exempt and count as one word each.
const STE_INSTRUCTION_WORDS = 20;
const STE_DESCRIPTIVE_WORDS = 25;
const STE_BANNED = [
  [/\bperform(s|ed|ing)?\b/i, "do"],
  [/\bensur(e|es|ed|ing)\b/i, "make sure"],
  [/\bverif(y|ies|ied|ying|ication|ications)\b/i, "examine, make sure"],
  [/\bconfirm(s|ed|ing)?\b/i, "make sure, examine"],
  [/\binfer(s|red|ring)?\b/i, "find"],
  [/\bdetermin(e|es|ed|ing)\b/i, "find"],
  [/\bobtain(s|ed|ing)?\b/i, "get"],
  [/\bretriev(e|es|ed|ing)\b/i, "get"],
  [/\bprovid(e|es|ed|ing)\b/i, "give"],
  [/\bsuppl(y|ies|ied|ying)\b/i, "give"],
  [/\brequir(e|es|ed|ing)\b/i, "must, is necessary"],
  [/\butiliz(e|es|ed|ing)\b/i, "use"],
  [/\bproceed(s|ed|ing)?\b/i, "continue, go"],
  [/\battempt(s|ed|ing)?\b/i, "try"],
  [/\bmodif(y|ies|ied|ying)\b/i, "change"],
  [/\bupdat(e|es|ing)\b/i, "change"],
  [/\badditional(ly)?\b/i, "more"],
  [/\bprior to\b/i, "before"],
  [/\bsubsequent(ly)?\b/i, "after"],
  [/\bterminat(e|es|ed|ing)\b/i, "stop"],
  [/\babort(s|ed|ing)?\b/i, "stop"],
  [/\bsufficient(ly)?\b/i, "enough"],
  [/\badequate(ly)?\b/i, "enough"],
  [/\bapproximately\b/i, "about"],
  [/\bassist(s|ed|ing)?\b/i, "help"],
  [/\bshould\b/i, "must, or a command"],
];
const STE_CONTRACTION = /\b[A-Za-z]+n't\b|\b[A-Za-z]+'(re|ve|ll|m|d)\b|\b(it|that|there|what|here|let|who|where)'s\b/i;

function steText(raw) {
  return raw
    .replace(/<!--.*?-->/g, " ")
    .replace(/`[^`]*`/g, " CODE ")
    .replace(/\{\{[^}]+\}\}/g, " VAR ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, " LINK ")
    .replace(/https?:\/\/\S+/g, " URL ")
    .replace(/(^|\s)[~./]?[\w.-]*\/[\w./<>*#-]*?(?=[.,;:!?]?(\s|$))/g, " PATH ")
    .replace(/\b[\w]+(?:[-_][\w]+)+\b/g, " NAME ")
    .replace(/\/[a-z][\w-]*/g, " CMD ");
}

function steCheck(file, line, raw, limit) {
  const text = steText(raw);
  for (const [re, use] of STE_BANNED) {
    const m = text.match(re);
    if (m) add({ file, line, level: ERROR, rule: "STE-002", message: `"${m[0]}" is not ASD-STE100; use ${use}` });
  }
  const c = text.match(STE_CONTRACTION);
  if (c) add({ file, line, level: ERROR, rule: "STE-006", message: `contraction "${c[0]}"; write the full words` });
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const words = sentence.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    if (words > limit)
      add({ file, line, level: ERROR, rule: "STE-001", message: `${words}-word sentence exceeds the ASD-STE100 limit of ${limit}; divide it` });
  }
}

for (const [abs, doc] of parsed.entries()) {
  if (!doc.isMdscript) continue;
  const fm = doc.text.match(/^---\n([\s\S]*?)\n---/);
  const desc = fm?.[1].match(/^description:\s*"?(.*?)"?\s*$/m);
  if (desc) steCheck(abs, doc.lines.findIndex((l) => l.startsWith("description:")) + 1, desc[1], STE_DESCRIPTIVE_WORDS);
  let inComment = false;
  for (const { line, text: l } of doc.body) {
    if (inComment) { if (l.includes("-->")) inComment = false; continue; }
    if (l.includes("<!--") && !l.includes("-->")) { inComment = true; continue; }
    if (/^#/.test(l) || !l.trim()) continue;
    if (/^\s*\|/.test(l)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue;
      for (const cell of l.split("|").slice(1, -1)) steCheck(abs, line, cell, STE_DESCRIPTIVE_WORDS);
      continue;
    }
    const bullet = /^\s*([*-]|\d+[.)])\s/.test(l);
    steCheck(abs, line, l.replace(/^\s*([*->]|\d+[.)])\s*/, ""), bullet ? STE_INSTRUCTION_WORDS : STE_DESCRIPTIVE_WORDS);
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
