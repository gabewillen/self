#!/usr/bin/env node
/**
 * Assert live installs use an absolute target when the destination path is a
 * macOS-style alias such as /var -> /private/var.
 *
 * Usage:
 *   node scripts/test-install-symlink.mjs
 */
import {
  existsSync,
  mkdtempSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(scriptsDir, "..");
const install = join(scriptsDir, "install.mjs");

const aliasRoot = mkdtempSync(join(tmpdir(), "self-install-symlink-"));
const home = mkdtempSync(join(aliasRoot, "home-"));
const destination = join(aliasRoot, "skills");
const expectedSource = resolve(join(pkgRoot, "skills", "self"));
let exitCode = 0;

try {
  const canonicalRoot = realpathSync(aliasRoot);
  if (canonicalRoot === aliasRoot) {
    console.log("SKIP: temporary directory has no /private/var-style alias");
  } else {
    const result = spawnSync(
    process.execPath,
    [
      install,
      "--live",
      "--live-root",
      pkgRoot,
      "--target",
      destination,
      "--no-instructions",
      "--no-mdscript",
      "--no-adapters",
    ],
    {
      cwd: pkgRoot,
      encoding: "utf8",
      timeout: 30_000,
      env: {
        ...process.env,
        HOME: home,
        AGENTS_HOME: join(home, ".agents"),
        SELF_LIVE_BRANCH: "0",
        GABE_LIVE_BRANCH: "0",
      },
    },
    );

    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    if (result.error || result.status !== 0) {
      console.error("[test-install-symlink] installer failed");
      console.error(output);
      if (result.error) console.error(result.error);
      exitCode = 1;
    } else {
      const link = join(destination, "self");
      if (!existsSync(link)) {
        console.error(`[test-install-symlink] missing ${link}`);
        exitCode = 1;
      } else {
        const linkTarget = readlinkSync(link);
        if (linkTarget !== expectedSource) {
          console.error(
            `[test-install-symlink] expected absolute target ${expectedSource}, got ${linkTarget}`,
          );
          exitCode = 1;
        } else if (realpathSync(link) !== realpathSync(expectedSource)) {
          console.error("[test-install-symlink] symlink does not resolve to its source");
          exitCode = 1;
        } else {
          console.log(
            `[test-install-symlink] ok: ${link} -> ${linkTarget} via ${aliasRoot} -> ${canonicalRoot}`,
          );
        }
      }
    }
  }
} finally {
  rmSync(aliasRoot, { recursive: true, force: true });
}
process.exit(exitCode);
