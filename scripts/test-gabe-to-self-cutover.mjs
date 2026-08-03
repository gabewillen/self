#!/usr/bin/env node
/**
 * Plant gabe-era dangling artifacts, re-run install, assert cutover cleared them.
 *
 * Usage:
 *   node scripts/test-gabe-to-self-cutover.mjs
 */
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const install = join(pkgRoot, "scripts", "install.mjs");
const home = mkdtempSync(join(tmpdir(), "self-cutover-home-"));
const agentsHome = join(home, ".agents");
process.on("exit", () => {
  try {
    rmSync(home, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup on normal and error exits.
  }
});

function plant() {
  // Marker files
  mkdirSync(join(home, ".agents"), { recursive: true });
  writeFileSync(
    join(home, ".agents", "gabe-agents-live.json"),
    JSON.stringify({ mode: "live", stale: true }) + "\n",
  );
  writeFileSync(
    join(home, ".agents", "gabe-agents-integrity.json"),
    JSON.stringify({ ok: false, stale: true }) + "\n",
  );

  // Retired skill symlink
  const cursorSkills = join(home, ".cursor", "skills");
  mkdirSync(cursorSkills, { recursive: true });
  const dangling = join(cursorSkills, "gabe-common");
  if (existsSync(dangling)) rmSync(dangling, { recursive: true, force: true });
  try {
    symlinkSync("/tmp/nonexistent-gabe-common", dangling);
  } catch {
    writeFileSync(dangling, "not-a-dir");
  }

  // Cursor hooks: inject legacy gabe entry + metadata
  const hooksPath = join(home, ".cursor", "hooks.json");
  let hooks = { version: 1, hooks: { stop: [] }, metadata: {} };
  try {
    hooks = JSON.parse(readFileSync(hooksPath, "utf8"));
  } catch {
    // fresh
  }
  hooks.hooks = hooks.hooks || {};
  hooks.hooks.stop = Array.isArray(hooks.hooks.stop) ? hooks.hooks.stop : [];
  hooks.hooks.stop.push({
    id: "gabe-learn-stop",
    command:
      "/Users/gabrielwillen/.bun/bin/bun /tmp/skills/gabe-common/hooks/learn-stop.ts",
  });
  hooks.metadata = hooks.metadata || {};
  hooks.metadata["gabe-agents"] = {
    "gabe-common": {
      skill_dir: join(cursorSkills, "gabe-common"),
      adapter: "cursor",
    },
  };
  writeFileSync(hooksPath, JSON.stringify(hooks, null, 2) + "\n");
  // Claude nested settings: legacy commands and metadata must be removed while
  // unrelated metadata and current self hooks survive the cutover.
  const claudeDir = join(home, ".claude");
  const claudeSettingsPath = join(claudeDir, "settings.json");
  mkdirSync(claudeDir, { recursive: true });
  let claudeSettings = { hooks: {}, metadata: {} };
  try {
    claudeSettings = JSON.parse(readFileSync(claudeSettingsPath, "utf8"));
  } catch {
    // fresh
  }
  claudeSettings.hooks = claudeSettings.hooks || {};
  claudeSettings.hooks.Stop = [
    ...(Array.isArray(claudeSettings.hooks.Stop)
      ? claudeSettings.hooks.Stop
      : []),
    {
      hooks: [
        {
          type: "command",
          command: "bun /tmp/skills/gabe-common/hooks/learn-stop.ts",
        },
      ],
    },
  ];
  claudeSettings.metadata = claudeSettings.metadata || {};
  claudeSettings.metadata.self = {
    ...(claudeSettings.metadata.self || {}),
    "gabe-common": { stale: true },
    unrelated: { keep: true },
  };
  claudeSettings.metadata["self-agents"] = {
    ...(claudeSettings.metadata["self-agents"] || {}),
    "gabe-goal": { stale: true },
    unrelated: { keep: true },
  };
  claudeSettings.metadata.unrelated_namespace = { keep: true };
  writeFileSync(
    claudeSettingsPath,
    JSON.stringify(claudeSettings, null, 2) + "\n",
  );

  // Grok legacy per-skill hook file
  const grokHooks = join(home, ".grok", "hooks");
  mkdirSync(grokHooks, { recursive: true });
  writeFileSync(
    join(grokHooks, "gabe-common.json"),
    JSON.stringify({
      hooks: {
        Stop: [
          {
            hooks: [
              {
                type: "command",
                command: "bun /tmp/skills/gabe-common/hooks/learn-stop.ts",
              },
            ],
          },
        ],
      },
      metadata: { "gabe-agents": { "gabe-common": {} } },
    }) + "\n",
  );

  // Instruction file with dual router + old skill name
  const agentsMd = join(home, ".agents", "AGENTS.md");
  let body = existsSync(agentsMd) ? readFileSync(agentsMd, "utf8") : "# AGENTS\n";
  if (!body.includes("gabe-agents:router")) {
    body +=
      "\n<!-- gabe-agents:router -->\n- ALWAYS use the `gabe` router skill and gabe-review.\n<!-- /gabe-agents:router -->\n";
  }
  if (!body.includes("gabe-review")) {
    body += "\n- use `gabe-review` for reviews\n";
  }
  writeFileSync(agentsMd, body);
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
    return false;
  }
  console.log("ok  ", msg);
  return true;
}

plant();

const r = spawnSync(
  process.execPath,
  [install, "--live", "--live-root", pkgRoot],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      AGENTS_HOME: agentsHome,
      SELF_LIVE_BRANCH: "0",
      GABE_LIVE_BRANCH: "0",
    },
    cwd: pkgRoot,
  },
);
if (r.status !== 0) {
  console.error("install failed", r.status);
  console.error(r.stdout);
  console.error(r.stderr);
  process.exit(1);
}
console.log(
  (r.stdout || "")
    .split("\n")
    .filter((l) => /cutover|removed legacy|scrubbed|rewrote|integrity ok|mode=/.test(l))
    .join("\n"),
);

assert(
  !existsSync(join(home, ".agents", "gabe-agents-live.json")),
  "gabe-agents-live.json removed",
);
assert(
  !existsSync(join(home, ".agents", "gabe-agents-integrity.json")),
  "gabe-agents-integrity.json removed",
);
assert(
  !existsSync(join(home, ".cursor", "skills", "gabe-common")),
  "cursor skills/gabe-common removed",
);
assert(
  !existsSync(join(home, ".grok", "hooks", "gabe-common.json")),
  "grok hooks/gabe-common.json removed",
);

const hooks = JSON.parse(readFileSync(join(home, ".cursor", "hooks.json"), "utf8"));
assert(
  !hooks.metadata?.["gabe-agents"],
  "cursor metadata.gabe-agents removed",
);
const stopCmds = (hooks.hooks?.stop || []).map((e) => e.command || "");
const stopIds = (hooks.hooks?.stop || []).map((e) => e.id || "");
assert(
  !stopCmds.some((c) => /gabe-common|skills\/gabe/.test(c)),
  "cursor stop has no gabe-common command",
);
assert(
  !stopIds.some((id) => String(id).startsWith("gabe-")),
  "cursor stop has no gabe-* id",
);
assert(
  stopIds.includes("self-learn-stop"),
  "cursor still has self-learn-stop",
);
const claudeSettings = JSON.parse(
  readFileSync(join(home, ".claude", "settings.json"), "utf8"),
);
const claudeStopHandlers = (claudeSettings.hooks?.Stop || []).flatMap((group) =>
  Array.isArray(group?.hooks) ? group.hooks : [],
);
assert(
  !claudeStopHandlers.some((entry) => /gabe-common|skills\/gabe/.test(entry.command || "")),
  "claude Stop has no legacy gabe command",
);
assert(
  claudeStopHandlers.some((entry) => /self-common\/hooks\/learn-stop\.ts/.test(entry.command || "")),
  "claude Stop retains current self learn hook",
);
assert(
  !claudeSettings.metadata?.self?.["gabe-common"] &&
    !claudeSettings.metadata?.["self-agents"]?.["gabe-goal"],
  "claude metadata.self and metadata.self-agents legacy entries removed",
);
assert(
  claudeSettings.metadata?.self?.unrelated?.keep === true &&
    claudeSettings.metadata?.["self-agents"]?.unrelated?.keep === true &&
    claudeSettings.metadata?.unrelated_namespace?.keep === true,
  "claude unrelated metadata preserved",
);

const agentsMd = readFileSync(join(home, ".agents", "AGENTS.md"), "utf8");
assert(
  !agentsMd.includes("gabe-agents:router"),
  "gabe-agents router block removed",
);
assert(
  !agentsMd.includes("gabe-review"),
  "gabe-review skill id rewritten in AGENTS.md",
);
assert(agentsMd.includes("self-agents:router"), "self-agents router present");
assert(agentsMd.includes("self-review") || agentsMd.includes("`self`"), "self skill ids present");

if (process.exitCode) {
  console.error("\ncutover test failed");
  process.exit(1);
}
console.log("\nok: gabe→self cutover clears dangling artifacts");
