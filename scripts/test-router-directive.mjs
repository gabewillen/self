#!/usr/bin/env node
/**
 * The router directive is a single source of truth: every managed instruction
 * file must end with exactly one directive line, inside the managed markers,
 * no matter which wording or legacy block shape it started from — and a
 * malformed legacy marker must never swallow the user's own text.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "install.mjs"), "utf8");
const start = src.indexOf("const ROUTER_DIRECTIVE");
const end = src.indexOf("function ensureRouterDirective");
if (start < 0 || end < 0 || end <= start) {
  console.error("[test-router-directive] BROKEN: could not extract router directive section");
  process.exit(1);
}
const scratch = mkdtempSync(join(tmpdir(), "self-router-directive-"));
process.on("exit", () => {
  try {
    rmSync(scratch, { recursive: true, force: true });
  } catch {
    // best effort: a leaked scratch dir must not fail the suite
  }
});
const modPath = join(scratch, "router.mjs");
writeFileSync(
  modPath,
  `${src.slice(start, end)}\nexport { applyRouterDirective, ROUTER_DIRECTIVE, ROUTER_BLOCK_START, ROUTER_BLOCK_END, SHIPPED_DIRECTIVES };\n`,
);
const mod = await import(modPath);
// Byte-identical to the block ensureRouterDirective passes, trailing newline included.
const block = `${mod.ROUTER_BLOCK_START}\n${mod.ROUTER_DIRECTIVE}\n${mod.ROUTER_BLOCK_END}\n`;
const countDirectives = (text) => (text.match(/router skill/g) || []).length;

let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    console.log(`ok   ${name}${detail ? ` (${detail})` : ""}`);
    return;
  }
  failed += 1;
  console.error(`not ok   ${name}${detail ? ` (${detail})` : ""}`);
}

const USER_LINE = "never push to main";
// Verbatim wordings this pack shipped before the current one.
const OLD_SELF_DIRECTIVE =
  `- ALWAYS enter through the \`self\` router skill. Run it first on every request, before planning or answering, and let it choose the role: any parentless main agent is a root orchestrator (self-orchestrate); subagents are self-implement (or a single blind-lane MDScript); explicit routes cover self-watch, self-goal, self-automate, and self-learn; HSM is a self-review lane.`;
const OLD_GABE_DIRECTIVE =
  `- ALWAYS use the \`gabe\` router skill for Gabe-shaped work: judgment, delegation, prioritization, review, implementation, coordination, MR/PR watching, and goal loops. It routes to gabe-orchestrate, gabe-implement, gabe-review, gabe-watch, and gabe-goal.`;
// A shipped line the user then edited: it must survive untouched.
const CUSTOMIZED_DIRECTIVE = OLD_SELF_DIRECTIVE.replace(
  "before planning or answering",
  `before planning or answering, EXCEPT in ~/work/acme where you ${USER_LINE}`,
);

const cases = [
  {
    name: "managed block beside a marker-less stale bullet keeps one directive",
    input: `# x\n\n${OLD_GABE_DIRECTIVE}\n\n${block}\n`,
  },
  {
    name: "two marker-less stale bullets collapse to one directive",
    input: `# x\n\n${OLD_SELF_DIRECTIVE}\n${OLD_SELF_DIRECTIVE}\n`,
  },
  {
    name: "legacy self:router block plus managed block keeps one directive",
    input: `# x\n\n<!-- self:router -->\n${OLD_SELF_DIRECTIVE}\n<!-- /self:router -->\n\n${block}\n`,
  },
  {
    name: "unpaired legacy opener does not delete the user's own text",
    input: `# x\n\n<!-- self:router -->\n\n## Personal\n${USER_LINE}\n\n${block}\n`,
    keepsUserText: true,
  },
  { name: "already-clean file stays at one directive", input: `# x\n\n${block}\n` },
  { name: "empty file gets exactly one directive", input: "" },
  {
    name: "managed block wrapped in a legacy span keeps the directive",
    input: `# x\n\n<!-- self:router -->\n${block}\n<!-- /self:router -->\n`,
  },
  {
    name: "legacy span holding user text keeps that text",
    input: `# self:instructions wrapper\n\n<!-- self:instructions -->\n${OLD_SELF_DIRECTIVE}\n- ${USER_LINE}\n<!-- /self:instructions -->\n\n${block}\n`,
    keepsUserText: true,
  },
  {
    name: "user-customized directive line is preserved, not deleted",
    input: `# x\n\n${CUSTOMIZED_DIRECTIVE}\n\n${block}\n`,
    keepsUserText: true,
    allowExtraDirectiveLine: true,
  },
  {
    name: "a directive quoted inside a fenced block is left alone",
    input: `# x\n\n\`\`\`md\n${OLD_SELF_DIRECTIVE}\n\`\`\`\n\n${block}\n`,
    allowExtraDirectiveLine: true,
    keepsFence: true,
  },
  {
    name: "two managed blocks converge to one",
    input: `# x\n\n${block}\n${block}\n`,
  },
  {
    name: "user text wrapped in a legacy span with the managed block survives",
    input: `<!-- self:instructions -->\n${block}\n- ${USER_LINE}\n<!-- /self:instructions -->\n`,
    keepsUserText: true,
  },
  {
    name: "an indented code block quoting the markers is not treated as markup",
    input: `# x\n\nExample:\n\n    ${mod.ROUTER_BLOCK_START}\n    ${OLD_SELF_DIRECTIVE}\n    - ${USER_LINE}\n    ${mod.ROUTER_BLOCK_END}\n\n${block}\n`,
    keepsUserText: true,
    allowExtraDirectiveLine: true,
  },
  {
    name: "markers sharing a line with user text do not swallow it",
    input: `# x\n\n${mod.ROUTER_BLOCK_START} note: ${USER_LINE} ${mod.ROUTER_BLOCK_END}\n\n${block}\n`,
    keepsUserText: true,
  },
  {
    name: "an indented fence cannot skew parity for a later real example",
    input: `# x\n\n    \`\`\`json\n    {"a":1}\n    \`\`\`\n\n\`\`\`md\n${OLD_SELF_DIRECTIVE}\n\`\`\`\n\n${block}`,
    allowExtraDirectiveLine: true,
    keepsFence: true,
  },
  {
    name: "a user's own HTML comment inside a legacy span survives",
    input: `<!-- self:router -->\n${OLD_SELF_DIRECTIVE}\n<!-- ${USER_LINE} -->\n<!-- /self:router -->\n\n${block}`,
    keepsUserComment: true,
  },
  {
    name: "every historical wording is matchable",
    input: `# x\n\n${mod.SHIPPED_DIRECTIVES.join("\n")}\n\n${block}`,
  },
  {
    name: "a user line mentioning a marker INSIDE the managed block survives",
    input: `# x\n\n${mod.ROUTER_BLOCK_START}\n${mod.ROUTER_DIRECTIVE}\n<!-- self:router --> ALSO: ${USER_LINE}\n${mod.ROUTER_BLOCK_END}\n`,
    keepsUserText: true,
  },
  {
    name: "one of two identical user lines cannot be dropped",
    input: `# x\n\n- ${USER_LINE}\n\n${mod.ROUTER_BLOCK_START}\n${mod.ROUTER_DIRECTIVE}\n- ${USER_LINE}\n${mod.ROUTER_BLOCK_END}\n`,
    keepsUserText: true,
    expectTwoCopies: true,
  },
  {
    name: "a hard-wrapped stale directive is reported, never silently left alone",
    input: `# x\n\n- ALWAYS enter through the \`self\` router skill. Run it first on every\n  request, before planning or answering.\n\n${block}`,
    expectNearMiss: true,
    allowExtraDirectiveLine: true,
  },
  {
    name: "a pre-seeded placeholder sentinel cannot capture the block",
    input: `# x\n\n\u0000self-agents-router\u0000\n\n${block}\n`,
    noSentinel: true,
  },
];

for (const c of cases) {
  const result = mod.applyRouterDirective(c.input, block);
  const n = countDirectives(result.body);
  check(
    c.name,
    c.allowExtraDirectiveLine ? n >= 1 : n === 1,
    `directives=${n}, action=${result.action}`,
  );
  // Count only markers alone on a line outside fenced/indented code: a quoted
  // example in the user's file is theirs, not a second managed block.
  let fenced = false;
  const managedBlocks = result.body.split("\n").filter((l) => {
    if (/^\s*(?:```|~~~)/.test(l)) {
      fenced = !fenced;
      return false;
    }
    if (fenced || /^(?: {4}|\t)/.test(l)) return false;
    return l.trim() === mod.ROUTER_BLOCK_START;
  }).length;
  check(`${c.name} — exactly one managed block`, managedBlocks === 1, `blocks=${managedBlocks}`);
  if (c.keepsFence) {
    check(
      `${c.name} — fenced example survives`,
      result.body.includes(OLD_SELF_DIRECTIVE),
    );
  }
  if (c.expectTwoCopies) {
    const copies = result.body.split(USER_LINE).length - 1;
    check(`${c.name} — both copies survive`, copies === 2, `copies=${copies}`);
  }
  if (c.expectNearMiss) {
    check(
      `${c.name} — near-miss reported`,
      (result.nearMisses || []).length >= 1,
      `nearMisses=${(result.nearMisses || []).length}`,
    );
  }
  if (c.keepsUserComment) {
    check(`${c.name} — user comment survives`, result.body.includes(USER_LINE));
  }
  if (c.noSentinel) {
    check(`${c.name} — no sentinel written`, !result.body.includes("\u0000"));
  }
  if (c.keepsUserText) {
    check(
      `${c.name} — user text survives`,
      result.body.includes(USER_LINE),
      result.body.includes(USER_LINE) ? "kept" : "DELETED",
    );
  }
  const inManagedBlock = result.body.includes(mod.ROUTER_BLOCK_START);
  check(`${c.name} — directive sits inside the managed markers`, inManagedBlock);
}

// Applying twice must be a no-op: a repeat install cannot accumulate bullets.
const twice = mod.applyRouterDirective(
  mod.applyRouterDirective(`# x\n\n${OLD_SELF_DIRECTIVE}\n`, block).body,
  block,
);
check("second install is idempotent", countDirectives(twice.body) === 1, `action=${twice.action}`);

if (failed) {
  console.error(`\n[test-router-directive] BROKEN: ${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nok: router directive dedupe keeps exactly one directive and preserves user text");
