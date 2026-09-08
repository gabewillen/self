#!/usr/bin/env python3
"""Tool-using (agentic) MDScript executor on a local ollama model.

The single-shot harness (run_ollama.py) forces the model to imagine and
serialize the entire run into one JSON blob; small models collapse that to one
event plus a prose summary. This harness instead gives the model real tools and
runs a turn-by-turn loop, the way mdscript-exec is actually used: each action is
a separate tool call. Tool calls are recorded as the event trace and graded with
the SAME deterministic checklist, so scores are comparable to run_ollama.py.

Usage: python3 run_ollama_tools.py --model gemma4:e2b --skill-file opt/skill-v0.md --tag tools-v0
"""
import argparse
import json
import re
import statistics
import urllib.request
from collections import defaultdict
from pathlib import Path

from run_ollama import eval_check, SPEC  # reuse grader + spec

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent
CASES = ["deploy_branch", "release_notes", "onboard_service"]

# tool name -> trace EVENT type
EVENT_MAP = {
    "goto_state": "ENTER_STATE", "ask_user": "ASK_USER",
    "request_confirmation": "REQUEST_CONFIRMATION", "run_command": "RUN_COMMAND",
    "write_file": "WRITE_FILE", "health_check": "HEALTH_CHECK", "notify": "NOTIFY",
    "rollback": "ROLLBACK", "git_init": "GIT_INIT", "complete": "COMPLETE", "abort": "ABORT",
}

TOOLS = [
    ("goto_state", "Enter/return to a workflow state (## heading) by name", {"state": "string"}, ["state"]),
    ("ask_user", "Ask the user a question and get their answer", {"question": "string"}, ["question"]),
    ("request_confirmation", "Ask the user to approve a risky/destructive action before doing it", {"action": "string"}, ["action"]),
    ("run_command", "Run a shell command and get its result", {"command": "string"}, ["command"]),
    ("write_file", "Create or edit a file with the given content", {"path": "string", "content": "string"}, ["path"]),
    ("health_check", "Run a health check against the deployment", {"target": "string"}, []),
    ("notify", "Notify the team/user of an outcome (include 'fail' when reporting a failure)", {"message": "string"}, ["message"]),
    ("rollback", "Roll back the deployment after a failure", {"reason": "string"}, []),
    ("git_init", "Initialize a git repository", {}, []),
    ("complete", "Mark the workflow finished with a one-sentence summary", {"summary": "string"}, ["summary"]),
    ("abort", "Stop the workflow without completing it", {"reason": "string"}, []),
]


def tool_specs():
    out = []
    for name, desc, props, req in TOOLS:
        out.append({"type": "function", "function": {
            "name": name, "description": desc,
            "parameters": {"type": "object",
                           "properties": {k: {"type": v} for k, v in props.items()},
                           "required": req}}})
    return out


class World:
    """Mocks command results and user answers for one scenario."""
    def __init__(self, scenario):
        w = scenario.get("world", {})
        self.cmd = w.get("command_results", {})
        self.answers = w.get("user_answers", {})
        self.idx = defaultdict(int)  # per-key consumption index for list values

    def _consume(self, table, key, default):
        val = table.get(key, default)
        if isinstance(val, list):
            i = self.idx[key]
            self.idx[key] += 1
            return val[i] if i < len(val) else (val[-1] if val else default)
        return val

    def command(self, command):
        c = (command or "").lower()
        for k in self.cmd:
            if k.lower() in c or c in k.lower():
                return self._consume(self.cmd, k, "pass")
        return "pass"

    def health(self, _target=""):
        if "health_check" in self.cmd:
            return self._consume(self.cmd, "health_check", "fail")
        return "pass"

    def answer(self, question):
        q = (question or "").lower()
        best = None
        for key in self.answers:
            tokens = [t for t in re.split(r"[_\s]+", key.lower()) if len(t) > 2]
            if any(t in q for t in tokens):
                best = key
                break
        if best is None:
            # fall back to first not-yet-consumed answer in declared order
            for key in self.answers:
                if self.idx[key] == 0 and not isinstance(self.answers[key], list):
                    best = key
                    break
            if best is None and self.answers:
                best = next(iter(self.answers))
        if best is None:
            return "yes"
        return self._consume(self.answers, best, "yes")


def exec_tool(name, args, world, outputs):
    """Run one mocked tool, return (result_text, event_detail)."""
    if name == "run_command":
        cmd = args.get("command", "")
        return f"{cmd} -> {world.command(cmd)}", cmd
    if name == "health_check":
        return f"health: {world.health(args.get('target',''))}", args.get("target", "health")
    if name in ("ask_user", "request_confirmation"):
        q = args.get("question") or args.get("action") or ""
        return world.answer(q), q
    if name == "write_file":
        path, content = args.get("path", "file"), args.get("content", "")
        outputs[path] = content
        return f"wrote {path}", f"{path} {content[:120]}"
    if name == "notify":
        return "notified", args.get("message", "")
    if name == "rollback":
        return "rolled back", args.get("reason", "")
    if name == "goto_state":
        return f"entered {args.get('state','')}", args.get("state", "")
    if name == "git_init":
        return "git initialized", "git init"
    if name == "complete":
        return "done", args.get("summary", "")
    if name == "abort":
        return "aborted", args.get("reason", "")
    return "ok", json.dumps(args)


def call_ollama(model, messages, timeout=240):
    payload = {"model": model, "messages": messages, "tools": tool_specs(),
               "stream": False, "options": {"temperature": 0, "num_ctx": 16384}}
    req = urllib.request.Request("http://127.0.0.1:11434/api/chat",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def run_scenario(model, skill, goal, scenario, max_turns=30, author=False):
    world = World(scenario)
    if author:
        sysmsg = ("You are an MDScript agent WITH TOOLS. You are NOT given a workflow. FIRST author a "
                  "short MDScript workflow for the goal (## states, {{variables}}, [links] for branches/"
                  "loops/recovery; decompose reusable steps into linked sub-scripts). THEN execute your "
                  "OWN workflow by CALLING TOOLS, one call per action, until it ends. NEVER just describe "
                  "an action; call the matching tool. Call complete when finished.")
        user = (skill + "\n\nAuthor an MDScript workflow for this goal, then execute it with tools against "
                "the world. Cover the guard and failure branches the goal implies (missing input, confirm "
                "before risky actions, validation failure, retry, recovery). React to each tool result.\n\n"
                "Goal: " + goal)
    else:
        sysmsg = ("You are an MDScript execution engine WITH TOOLS. Execute the workflow by CALLING "
                  "TOOLS, one tool call per action, until the workflow ends. NEVER just describe an "
                  "action; call the matching tool. When the workflow is finished, call complete.")
        user = (skill + "\n\nExecute this MDScript workflow against the world below. Call a tool for "
                "EVERY action the workflow takes (commands, files, asks, confirmations, health checks, "
                "rollbacks, notifications, state changes). React to each tool result: if a command or "
                "deploy fails and the workflow has a recovery branch, follow it. Call complete at the end.\n\n"
                "Goal: " + goal + "\n\nWorkflow:\n----- artifact -----\n"
                + scenario["_artifact"] + "\n----- end artifact -----")
    messages = [{"role": "system", "content": sysmsg}, {"role": "user", "content": user}]
    authored = ""

    events, outputs = [], {}
    final_outcome, in_tok, out_tok, dur = "", 0, 0, 0
    nudged = False
    for _turn in range(max_turns):
        try:
            resp = call_ollama(model, messages)
        except Exception as exc:
            final_outcome = f"error: {exc!r}"[:120]
            break
        in_tok += resp.get("prompt_eval_count", 0)
        out_tok += resp.get("eval_count", 0)
        dur += resp.get("total_duration", 0) - resp.get("load_duration", 0)
        msg = resp.get("message", {})
        if author and not authored and msg.get("content"):
            authored = msg.get("content", "")  # the authored MDScript, for review
        calls = msg.get("tool_calls") or []
        if not calls:
            if not nudged:  # one nudge to keep going via tools
                nudged = True
                messages.append({"role": "user", "content":
                                 "Continue executing the workflow by calling tools, or call complete if finished."})
                continue
            final_outcome = final_outcome or (msg.get("content", "")[:200])
            break
        messages.append({"role": "assistant", "content": msg.get("content", ""), "tool_calls": calls})
        stop = False
        for call in calls:
            fn = call.get("function", {})
            name = fn.get("name", "")
            args = fn.get("arguments", {})
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    args = {}
            if name not in EVENT_MAP:  # phantom/hallucinated tool: reject, do not record, do not stop
                messages.append({"role": "tool", "content":
                                 f"No tool named '{name}'. There is no mdscript-exec tool; YOU are the executor. "
                                 f"Do the actual work by calling only: {', '.join(EVENT_MAP)}."})
                continue
            result, detail = exec_tool(name, args, world, outputs)
            events.append({"type": EVENT_MAP[name], "detail": str(detail)})
            messages.append({"role": "tool", "content": str(result)})
            if name in ("complete", "abort"):
                final_outcome = args.get("summary") or args.get("reason") or "done"
                stop = True
        if stop:
            break
    # release_notes section checks read written content; expose it under "sections"
    if outputs:
        outputs.setdefault("sections", "\n".join(str(v) for v in outputs.values()))
    trace = {"events": events, "outputs": outputs, "final_outcome": final_outcome,
             "cost": {"input_tokens": in_tok, "output_tokens": out_tok, "exec_s": round(dur / 1e9, 3)}}
    if author:
        trace["authored"] = authored
    return trace


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="gemma4:e2b")
    ap.add_argument("--skill-file", required=True)
    ap.add_argument("--tag", required=True)
    ap.add_argument("--cases", default=",".join(CASES))
    ap.add_argument("--max-turns", type=int, default=30)
    ap.add_argument("--author", action="store_true", help="model authors MDScript then executes it (Track B)")
    args = ap.parse_args()
    skill = Path(args.skill_file).read_text()
    run_cases = [c.strip() for c in args.cases.split(",") if c.strip()]

    rows = []
    total = sum(len(json.loads((BASE / "scenarios" / f"{c}.json").read_text())["scenarios"]) for c in run_cases)
    n = 0
    for cid in run_cases:
        data = json.loads((BASE / "scenarios" / f"{cid}.json").read_text())
        art = (BASE / "artifacts" / cid / "mdscript.md").read_text()
        for sc in data["scenarios"]:
            n += 1
            sc = dict(sc, _artifact=art)
            trace = run_scenario(args.model, skill, data["goal"], sc, args.max_turns, author=args.author)
            results = [{"desc": ch["desc"], "pass": bool(eval_check(ch, trace))} for ch in sc["checks"]]
            passed = sum(r["pass"] for r in results)
            rows.append({"case": cid, "scenario": sc["id"], "system": "mdscript",
                         "passed": passed, "total": len(results), "coverage": passed / len(results),
                         "results": results, "trace": trace, "parse_ok": True, "cost": trace["cost"]})
            print(f"[{n}/{total}] {cid}/{sc['id']}: {passed}/{len(results)} "
                  f"({len(trace['events'])} ev)", flush=True)

    out = BASE / "results" / f"ollama-{args.model.replace(':', '-')}-{args.tag}.json"
    out.write_text(json.dumps({"model": args.model, "mode": "tools", "tag": args.tag, "rows": rows}, indent=2) + "\n")
    cov = 100 * statistics.mean([r["coverage"] for r in rows])
    ev = statistics.mean([len(r["trace"]["events"]) for r in rows])
    print(f"\n=== {args.model} TOOLS [{args.tag}] ===")
    print(f"checklist={cov:.1f}%  events/run={ev:.1f}  n={len(rows)}")
    print(f"saved {out}")


if __name__ == "__main__":
    main()
