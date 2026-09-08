#!/usr/bin/env python3
"""Static metrics for composition: navigability + wiring cost.

Two deterministic, model-free metrics over the PARENT files (the call sites):
  navigability: of all cross-component references, how many are click-navigable
                hyperlinks in a code host (GitHub) that resolve to a real file?
  wiring:       dedicated composition-plumbing lines (imports + call sites) a
                parent needs to reuse a shared component.
"""
import json
import re
from pathlib import Path

BASE = Path("/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/compose/artifacts")
PARENTS = {
    "mdscript": ["ship-feature.md", "hotfix.md"],
    "guidance": ["ship_feature.py", "hotfix.py"],
    "lmql": ["ship_feature.lmql", "hotfix.lmql"],
    "ell": ["ship_feature.py", "hotfix.py"],
}
SHARED = {"checks", "deploy"}  # the shared component basenames

MD_LINK = re.compile(r"\[[^\]]+\]\((\.[^)]+\.md)\)")
IMPORT = re.compile(r"^\s*(?:from\s+(\w+)\s+import|import\s+(\w+))")


def analyze_mdscript(d, files):
    refs, clickable, wiring = 0, 0, 0
    for fn in files:
        for line in (d / fn).read_text().splitlines():
            for m in MD_LINK.finditer(line):
                target = m.group(1)
                base = Path(target).stem
                if base not in SHARED:
                    continue
                refs += 1
                # a markdown relative link is click-navigable iff the target file exists
                if (d / target).resolve().exists():
                    clickable += 1
                # the link is inline in the instruction bullet, no dedicated wiring line
    return refs, clickable, wiring


def analyze_code(d, files):
    refs, clickable, wiring = 0, 0, 0
    for fn in files:
        text = (d / fn).read_text()
        for line in text.splitlines():
            m = IMPORT.match(line)
            if m:
                mod = m.group(1) or m.group(2)
                if mod in SHARED:
                    refs += 1          # an import of a shared component is a reference
                    wiring += 1        # ...and a dedicated wiring line
                    # an import statement is NOT a hyperlink in a code host
        # call sites of the shared components are additional dedicated wiring
        for name in ("run_checks(", "deploy("):
            wiring += len(re.findall(re.escape(name), text))
    return refs, clickable, wiring


rows = {}
for system, files in PARENTS.items():
    d = BASE / system
    if system == "mdscript":
        refs, clickable, wiring = analyze_mdscript(d, files)
    else:
        refs, clickable, wiring = analyze_code(d, files)
    rows[system] = {
        "references": refs,
        "click_navigable": clickable,
        "navigability_pct": round(100 * clickable / refs, 1) if refs else 0.0,
        "dedicated_wiring_lines": wiring,
    }

out = Path("/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/compose/results/static.json")
out.write_text(json.dumps(rows, indent=2) + "\n")
print(f"{'system':10} {'refs':>5} {'clickable':>10} {'nav%':>6} {'wiring lines':>13}")
for s, r in rows.items():
    print(f"{s:10} {r['references']:>5} {r['click_navigable']:>10} {r['navigability_pct']:>6} {r['dedicated_wiring_lines']:>13}")
print("\nsaved", out)
