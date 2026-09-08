#!/usr/bin/env python3
"""Generate a blind-Claude-judge workflow over an ollama executor's traces.

Executor = local model (already run); judge = blind claude-sonnet. The judge sees
only the produced trace + the task, never the artifact or system name.
"""
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
model_file = sys.argv[1] if len(sys.argv) > 1 else "results/ollama-gemma4-e2b.json"
data = json.loads((BASE / model_file).read_text())

scen = {}
for cid in ["deploy_branch", "release_notes", "onboard_service"]:
    s = json.loads((BASE / "scenarios" / f"{cid}.json").read_text())
    scen[cid] = {"goal": s["goal"], "scenarios": {x["id"]: x.get("description", "") for x in s["scenarios"]}}

jobs = []
for r in data["rows"]:
    if not r.get("trace"):
        continue
    jobs.append({
        "system": r["system"], "case": r["case"], "scenario": r["scenario"], "repeat": r["repeat"],
        "goal": scen[r["case"]]["goal"], "desc": scen[r["case"]]["scenarios"].get(r["scenario"], ""),
        "trace": r["trace"],
    })

CONFIG = {"model": data["model"], "jobs": jobs}

TEMPLATE = r'''export const meta = {
  name: 'judge-ollama-traces',
  description: 'Blind claude-sonnet judge over a local model executor\'s traces',
  phases: [ { title: 'Judge', detail: 'blind sonnet scores each produced trace' } ],
}

const CONFIG = __CONFIG__
const VERDICT_SCHEMA = { type:'object', additionalProperties:false, required:['outcome_score','notes'],
  properties: { outcome_score:{type:'integer',minimum:1,maximum:10}, notes:{type:'string'} } }

const judgePrompt = (j) => `You are judging ONE produced workflow execution result. You do NOT see the source artifact or its language/format. Score only the produced trace against the task. Reward correct, complete handling of the scenario's branches; penalize missing or wrong behavior.

Goal: ${j.goal}
Scenario intent: ${j.desc}

Produced trace:
` + '```json\n' + JSON.stringify(j.trace, null, 2) + '\n```' + `

Give outcome_score 1-10: did this run accomplish the task correctly for this scenario, including the conditional/branch behavior the scenario is designed to exercise?`

const rows = await pipeline(
  CONFIG.jobs,
  (j) => agent(judgePrompt(j), { label:`judge:${j.system}:${j.case}:${j.scenario}:r${j.repeat}`, phase:'Judge', model:'sonnet', schema:VERDICT_SCHEMA })
            .then((v)=> v ? { system:j.system, judge:v.outcome_score } : null)
)
const clean = rows.filter(Boolean)
const mean=(a)=> a.length? a.reduce((s,x)=>s+x,0)/a.length : NaN
const by={}
for (const r of clean) (by[r.system]=by[r.system]||[]).push(r.judge)
const summary = Object.entries(by).map(([system,v])=>({system, judge_mean:+mean(v).toFixed(2), n:v.length})).sort((a,b)=>b.judge_mean-a.judge_mean)
log('JUDGE ' + JSON.stringify(summary))
return { model: CONFIG.model, summary }
'''

out = BASE / "judge-ollama.js"
out.write_text(TEMPLATE.replace("__CONFIG__", json.dumps(CONFIG, indent=2)))
print(f"wrote {out} with {len(jobs)} judge jobs over {data['model']}")
