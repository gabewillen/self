#!/usr/bin/env python3
"""Run the robust benchmark's EXECUTION step on a local ollama model.

The executor produces the structured trace; grading uses the SAME deterministic
checklist as the Claude-executor run, so the primary metric is directly
comparable. Ollama models have no tools, so the artifact (and, for MDScript, the
spec) is inlined into the prompt instead of read from disk.

Usage: python3 run_ollama.py --model gemma4:e2b --repeats 1
Writes results/ollama-<model>.json and prints a per-system checklist summary.
Judge (blind Claude) is run separately over the produced traces.
"""
import argparse
import json
import re
import statistics
import urllib.request
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent
SPEC = (ROOT / "spec.md").read_text()
SKILL = (ROOT / "skills/mdscript-exec/SKILL.md").read_text()  # may be overridden by --skill-file
EXT = {"mdscript": "md", "guidance": "py", "lmql": "lmql", "ell": "py"}
SYSTEMS = ["mdscript", "guidance", "lmql", "ell"]
CASES = ["deploy_branch", "release_notes", "onboard_service"]
EVENTS = ["ASK_USER", "REQUEST_CONFIRMATION", "RUN_COMMAND", "WRITE_FILE", "NOTIFY",
          "ROLLBACK", "HEALTH_CHECK", "ENTER_STATE", "GIT_INIT", "ABORT", "COMPLETE"]


def contains_all(text, kws):
    t = str(text or "").lower()
    return all(str(k).lower() in t for k in (kws or []))


def eval_check(check, trace):
    events = trace.get("events") or []
    outputs = trace.get("outputs") or {}
    def match(e):
        if not isinstance(e, dict):  # model emitted a bare string event; untyped, cannot verify
            return False
        return e.get("type") == check["event"] and (not check.get("contains") or contains_all(e.get("detail"), check["contains"]))
    c = check["check"]
    if c == "event":
        return any(match(e) for e in events)
    if c == "event_absent":
        return not any(match(e) for e in events)
    if c == "count":
        n = sum(1 for e in events if match(e))
        op, v = check["op"], check["value"]
        return {">=": n >= v, ">": n > v, "==": n == v, "<=": n <= v}.get(op, False)
    if c == "output":
        return check["key"] in outputs and contains_all(json.dumps(outputs[check["key"]]), check.get("contains") or [])
    if c == "output_absent":
        if check["key"] not in outputs:
            return True
        return not contains_all(json.dumps(outputs[check["key"]]), check.get("contains") or [])
    return False


def exec_prompt(case_goal, system, artifact_text, scenario, aid="spec"):
    spec_block = ""
    if system == "mdscript":
        if aid == "skill":
            spec_block = (
                "You have the mdscript-exec skill. Execute the workflow strictly according to "
                "this skill (it is your operating procedure, not MDScript to run):\n"
                "----- mdscript-exec SKILL -----\n" + SKILL + "\n----- end skill -----\n\n"
            )
        else:
            spec_block = (
                "This artifact is MDScript. Its execution spec (how to run it) is below:\n"
                "----- MDScript spec -----\n" + SPEC + "\n----- end spec -----\n\n"
            )
    return (
        "You are a neutral execution engine. Execute ONE workflow artifact against a "
        "fixed scenario. Do not judge or improve it; run it faithfully and record what happens.\n\n"
        + spec_block +
        "Artifact to execute:\n----- artifact -----\n" + artifact_text + "\n----- end artifact -----\n\n"
        "Goal of the workflow: " + case_goal + "\n\n"
        "Scenario (the fixed world for THIS run). When the artifact asks the user something, "
        "answer from world.user_answers (match by intent). When it runs a command/deploys/"
        "health-checks, use world.command_results; values given as arrays are consumed in order.\n"
        "```json\n" + json.dumps(scenario, indent=2) + "\n```\n\n"
        "Return ONLY a JSON object: {\"events\": [{\"type\": <EVENT>, \"detail\": <string>}], "
        "\"outputs\": {<resulting facts the scenario may check>}, \"final_outcome\": <string>}.\n"
        "Emit an event ONLY for an action actually performed in THIS run given the world. "
        "Do NOT emit events for branches the world never triggers.\n"
        "EVENT is one of: " + ", ".join(EVENTS) + "."
    )


def author_prompt(case_goal, system, scenario, aid="spec"):
    """Track B: model gets the GOAL only (no artifact), authors an MDScript
    workflow decomposed into reusable sub-scripts, then executes its own
    workflow recursively against the world. Grading is identical (same checklist
    over the produced trace), so self-authored MDScript is measured against the
    same bar as hand-authored artifacts."""
    aid_block = ""
    if aid == "skill":
        aid_block = ("You have the mdscript-exec skill (your operating procedure for writing and "
                     "running MDScript):\n----- mdscript-exec SKILL -----\n" + SKILL + "\n----- end skill -----\n\n")
    else:
        aid_block = ("MDScript spec (how MDScript works and how to run it):\n"
                     "----- MDScript spec -----\n" + SPEC + "\n----- end spec -----\n\n")
    return (
        "You are an MDScript agent. You are NOT given a workflow. You must AUTHOR an MDScript "
        "workflow for the goal below, then EXECUTE your own workflow against a fixed scenario, "
        "recording what happens.\n\n"
        + aid_block +
        "Goal: " + case_goal + "\n\n"
        "Author then run, in this order:\n"
        "1. Draft a main MDScript workflow: `##` states, `{{variables}}`, and `[Title](#anchor)` "
        "links for branches, loops, and recovery. Cover the guard and failure branches the goal implies "
        "(missing input, confirmation before risky actions, validation failure, retry, recovery).\n"
        "2. DECOMPOSE: when a step is reusable or self-contained, write it as a separate sub-script file "
        "and link to it from the main workflow with `[Title](sub.md)`. Aim for a few focused sub-scripts.\n"
        "3. RECURSE: executing a link to a sub-script means executing that sub-script in place, then "
        "returning. Sub-scripts may themselves link to sub-scripts.\n"
        "4. EXECUTE your authored workflow against the world below, following your own branches.\n\n"
        "Scenario (the fixed world for THIS run). When your workflow asks the user something, answer "
        "from world.user_answers (match by intent). When it runs a command/deploys/health-checks, use "
        "world.command_results; array values are consumed in order.\n"
        "```json\n" + json.dumps(scenario, indent=2) + "\n```\n\n"
        "Return ONLY a JSON object: {"
        "\"authored\": {\"main\": <main workflow markdown>, \"subscripts\": {<filename>: <markdown>}}, "
        "\"events\": [{\"type\": <EVENT>, \"detail\": <string>}], "
        "\"outputs\": {<resulting facts the scenario may check>}, \"final_outcome\": <string>}.\n"
        "Emit an event ONLY for an action actually performed in THIS run given the world. Do NOT emit "
        "events for branches the world never triggers. When you execute a sub-script, emit an "
        "ENTER_SUBWORKFLOW event naming it, then the events for its actions.\n"
        "EVENT is one of: " + ", ".join(EVENTS + ["ENTER_SUBWORKFLOW"]) + "."
    )


def call_ollama(model, prompt, timeout=240):
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a precise execution engine. Return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        "stream": False, "format": "json", "options": {"temperature": 0, "num_ctx": 16384},
    }
    req = urllib.request.Request("http://127.0.0.1:11434/api/chat",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        resp = json.loads(r.read().decode())
    content = resp["message"]["content"]
    # Real measured cost, straight from ollama. Durations are nanoseconds.
    # exec time excludes load_duration (one-time model load), so it reflects
    # per-request input+output work, not cold-start overhead.
    cost = {
        "input_tokens": resp.get("prompt_eval_count", 0),
        "output_tokens": resp.get("eval_count", 0),
        "exec_s": round((resp.get("total_duration", 0) - resp.get("load_duration", 0)) / 1e9, 3),
        "total_s": round(resp.get("total_duration", 0) / 1e9, 3),
    }
    return content, cost


def extract_json(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    s, e = text.find("{"), text.rfind("}")
    return json.loads(text[s:e + 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="gemma4:e2b")
    ap.add_argument("--repeats", type=int, default=1)
    ap.add_argument("--aid", choices=["spec", "skill"], default="spec", help="MDScript executor aid")
    ap.add_argument("--mode", choices=["exec", "author"], default="exec",
                    help="exec=run given artifact; author=model writes MDScript then runs it recursively")
    ap.add_argument("--systems", default=",".join(SYSTEMS), help="csv of systems to run")
    ap.add_argument("--cases", default=",".join(CASES), help="csv of cases to run")
    ap.add_argument("--skill-file", default=None, help="override mdscript-exec SKILL.md path (for optimization)")
    ap.add_argument("--tag", default=None, help="suffix for the output filename (avoids clobbering)")
    ap.add_argument("--price-in", type=float, default=0.80, help="$/Mtok input (default Haiku 4.5)")
    ap.add_argument("--price-out", type=float, default=4.00, help="$/Mtok output (default Haiku 4.5)")
    args = ap.parse_args()
    run_systems = [s.strip() for s in args.systems.split(",") if s.strip()]
    run_cases = [c.strip() for c in args.cases.split(",") if c.strip()]
    if args.mode == "author" and run_systems != ["mdscript"]:
        print("author mode is mdscript-only; restricting systems to mdscript")
        run_systems = ["mdscript"]

    if args.skill_file:
        global SKILL
        SKILL = Path(args.skill_file).read_text()

    cases = {}
    for cid in run_cases:
        cases[cid] = json.loads((BASE / "scenarios" / f"{cid}.json").read_text())

    rows = []
    total_jobs = sum(len(cases[c]["scenarios"]) for c in run_cases) * len(run_systems) * args.repeats
    n = 0
    for cid in run_cases:
        goal = cases[cid]["goal"]
        for system in run_systems:
            art = "" if args.mode == "author" else (BASE / "artifacts" / cid / f"{system}.{EXT[system]}").read_text()
            for sc in cases[cid]["scenarios"]:
                for rep in range(1, args.repeats + 1):
                    n += 1
                    if args.mode == "author":
                        prompt = author_prompt(goal, system, sc, aid=args.aid)
                    else:
                        prompt = exec_prompt(goal, system, art, sc, aid=args.aid)
                    cost = {"input_tokens": 0, "output_tokens": 0, "exec_s": 0.0, "total_s": 0.0}
                    try:
                        raw, cost = call_ollama(args.model, prompt)
                        trace = extract_json(raw)
                        if not isinstance(trace.get("events"), list):
                            trace = {"events": [], "outputs": trace.get("outputs", {}) if isinstance(trace, dict) else {}, "final_outcome": ""}
                        results = [{"desc": ch["desc"], "pass": bool(eval_check(ch, trace))} for ch in sc["checks"]]
                        passed = sum(r["pass"] for r in results)
                        rows.append({"case": cid, "system": system, "scenario": sc["id"], "repeat": rep,
                                     "passed": passed, "total": len(results), "coverage": passed / len(results),
                                     "results": results, "trace": trace, "parse_ok": True, "cost": cost})
                    except Exception as exc:
                        rows.append({"case": cid, "system": system, "scenario": sc["id"], "repeat": rep,
                                     "passed": 0, "total": len(sc["checks"]), "coverage": 0.0,
                                     "results": [], "trace": None, "parse_ok": False, "error": repr(exc)[:200], "cost": cost})
                    print(f"[{n}/{total_jobs}] {cid}/{system}/{sc['id']} r{rep}: "
                          f"{rows[-1]['passed']}/{rows[-1]['total']}" + ("" if rows[-1]["parse_ok"] else " (PARSE FAIL)"), flush=True)

    tag = f"-{args.tag}" if args.tag else ""
    modetag = "-author" if args.mode == "author" else ""
    out = BASE / "results" / f"ollama-{args.model.replace(':', '-').replace('/', '-')}-{args.aid}{modetag}{tag}.json"
    out.write_text(json.dumps({"model": args.model, "aid": args.aid, "mode": args.mode,
                               "repeats": args.repeats, "rows": rows}, indent=2) + "\n")

    by_sys = defaultdict(list)
    for r in rows:
        by_sys[r["system"]].append(r)
    # Dollars are the real bill, and output is priced ~5x input, so raw token
    # counts mislead. $/1k runs prices each call; cached prices MDScript's static
    # aid (spec/skill) as a cacheable prefix read at 0.1x (what it costs in a real
    # session where the aid is a fixed prompt prefix), which the DSLs have nothing
    # equivalent to.
    AID_TOK = {"spec": len(SPEC) // 4, "skill": len(SKILL) // 4}[args.aid]
    print(f"\n=== {args.model} executor [aid={args.aid}], deterministic checklist (primary) ===")
    print(f"prices: ${args.price_in}/Mtok in, ${args.price_out}/Mtok out")
    print(f"{'system':10} {'checklist%':>10} {'parse_ok%':>10} {'in_tok':>8} {'out_tok':>8} {'exec_s':>7} {'$/1k':>7} {'$/1k$':>7} {'n':>4}")
    for s in sorted(by_sys, key=lambda s: -statistics.mean([r["coverage"] for r in by_sys[s]])):
        rs = by_sys[s]
        cov = 100 * statistics.mean([r["coverage"] for r in rs])
        pok = 100 * statistics.mean([1 if r["parse_ok"] else 0 for r in rs])
        intok = statistics.mean([r.get("cost", {}).get("input_tokens", 0) for r in rs])
        outtok = statistics.mean([r.get("cost", {}).get("output_tokens", 0) for r in rs])
        secs = statistics.mean([r.get("cost", {}).get("exec_s", 0) for r in rs])
        dollars = (intok * args.price_in + outtok * args.price_out) / 1e6 * 1000
        aid = AID_TOK if s == "mdscript" else 0
        cached = ((intok - aid) * args.price_in + aid * args.price_in * 0.1 + outtok * args.price_out) / 1e6 * 1000
        print(f"{s:10} {cov:>10.1f} {pok:>10.1f} {intok:>8.0f} {outtok:>8.0f} {secs:>7.1f} {dollars:>7.2f} {cached:>7.2f} {len(rs):>4}")
    print(f"\n($/1k = per 1000 runs uncached; $/1k$ = MDScript aid cached at 0.1x prefix)")
    print(f"\nsaved {out}")


if __name__ == "__main__":
    main()
