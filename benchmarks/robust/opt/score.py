#!/usr/bin/env python3
"""Compact scorer for an mdscript optimization iteration.

Reads a results JSON produced by run_ollama.py and prints, for mdscript:
checklist coverage %, parse_ok %, mean output tokens, and the per-scenario
failures (where the model lost points) so the next revision is targeted.

Usage: python3 opt/score.py results/ollama-gemma4-e2b-skill-v1.json
"""
import json
import statistics
import sys
from collections import defaultdict

d = json.load(open(sys.argv[1]))
rows = [r for r in d["rows"] if r["system"] == "mdscript"]
if not rows:
    print("no mdscript rows"); sys.exit(1)

cov = 100 * statistics.mean([r["coverage"] for r in rows])
pok = 100 * statistics.mean([1 if r["parse_ok"] else 0 for r in rows])
out_tok = statistics.mean([r.get("cost", {}).get("output_tokens", 0) for r in rows])
print(f"model={d['model']} aid={d['aid']}  n={len(rows)}")
print(f"checklist={cov:.1f}%  parse_ok={pok:.1f}%  out_tok={out_tok:.0f}")

by_case = defaultdict(list)
for r in rows:
    by_case[r["case"]].append(r)
print("\nper-case:")
for c, rs in by_case.items():
    print(f"  {c:18} {100*statistics.mean([x['coverage'] for x in rs]):5.1f}%  "
          f"parse {100*statistics.mean([1 if x['parse_ok'] else 0 for x in rs]):5.1f}%")

print("\nlost points (scenario: failed checks):")
for r in sorted(rows, key=lambda r: r["coverage"]):
    if r["coverage"] >= 0.999 and r["parse_ok"]:
        continue
    if not r["parse_ok"]:
        print(f"  {r['case']}/{r['scenario']}: PARSE/SHAPE FAIL ({r.get('error','')[:60]})")
        continue
    fails = [c["desc"] for c in r["results"] if not c["pass"]]
    print(f"  {r['case']}/{r['scenario']} ({r['passed']}/{r['total']}): " + "; ".join(fails))
