#!/usr/bin/env python3
"""Build a workflow that executes the mdscript artifacts on claude-haiku with a
given candidate skill, grades with the same deterministic checklist, and returns
ONLY the aggregate (traces stay in the workflow, not the caller's context).

Mirrors run_ollama.py's exec_prompt so haiku and gemma get the same prompt.

Usage: python3 build_haiku_exec.py --skill-file opt/skill-v4.md --tag v4
       then run haiku-exec-<tag>.js via the Workflow tool.
"""
import argparse
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent
CASES = ["deploy_branch", "release_notes", "onboard_service"]
EVENTS = ["ASK_USER", "REQUEST_CONFIRMATION", "RUN_COMMAND", "WRITE_FILE", "NOTIFY",
          "ROLLBACK", "HEALTH_CHECK", "ENTER_STATE", "GIT_INIT", "ABORT", "COMPLETE"]

ap = argparse.ArgumentParser()
ap.add_argument("--skill-file", required=True)
ap.add_argument("--tag", required=True)
ap.add_argument("--model", default="haiku")
args = ap.parse_args()

SKILL = Path(args.skill_file).read_text()
jobs = []
for cid in CASES:
    data = json.loads((BASE / "scenarios" / f"{cid}.json").read_text())
    art = (BASE / "artifacts" / cid / "mdscript.md").read_text()
    for sc in data["scenarios"]:
        jobs.append({"case": cid, "goal": data["goal"], "scenario": sc["id"],
                     "artifact": art, "world": sc, "checks": sc["checks"]})

CONFIG = {"model": args.model, "tag": args.tag, "skill": SKILL, "events": EVENTS, "jobs": jobs}

TEMPLATE = r'''export const meta = {
  name: 'haiku-mdscript-exec',
  description: 'Execute mdscript artifacts on a Claude model with a candidate skill, grade by checklist',
  phases: [ { title: 'Execute', detail: 'one agent per scenario, graded in-script' } ],
}

const CONFIG = __CONFIG__

const TRACE_SCHEMA = { type:'object', additionalProperties:true, required:['events','outputs','final_outcome'],
  properties: {
    events: { type:'array', items: { type:'object', additionalProperties:true, required:['type','detail'],
      properties: { type:{type:'string'}, detail:{type:'string'} } } },
    outputs: { type:'object', additionalProperties:true },
    final_outcome: { type:'string' } } }

const containsAll = (text, kws) => { const t=String(text||'').toLowerCase(); return (kws||[]).every(k=>t.includes(String(k).toLowerCase())) }
function evalCheck(check, trace) {
  const events = trace.events || [], outputs = trace.outputs || {}
  const matchEv = (e) => e && typeof e==='object' && e.type===check.event && (!check.contains || containsAll(e.detail, check.contains))
  if (check.check==='event') return events.some(matchEv)
  if (check.check==='event_absent') return !events.some(matchEv)
  if (check.check==='count') { const n=events.filter(matchEv).length, v=check.value
    if (check.op==='>=') return n>=v; if (check.op==='>') return n>v; if (check.op==='==') return n===v; if (check.op==='<=') return n<=v; return false }
  if (check.check==='output') return Object.prototype.hasOwnProperty.call(outputs,check.key) && containsAll(JSON.stringify(outputs[check.key]), check.contains||[])
  if (check.check==='output_absent') { if (!Object.prototype.hasOwnProperty.call(outputs,check.key)) return true; return !containsAll(JSON.stringify(outputs[check.key]), check.contains||[]) }
  return false
}

const execPrompt = (j) => `You are a neutral execution engine. Execute ONE workflow artifact against a fixed scenario. Do not judge or improve it; run it faithfully and record what happens.

You have the mdscript-exec skill. Execute the workflow strictly according to this skill (it is your operating procedure, not MDScript to run):
----- mdscript-exec SKILL -----
${CONFIG.skill}
----- end skill -----

Artifact to execute:
----- artifact -----
${j.artifact}
----- end artifact -----

Goal of the workflow: ${j.goal}

Scenario (the fixed world for THIS run). When the artifact asks the user something, answer from world.user_answers (match by intent). When it runs a command/deploys/health-checks, use world.command_results; values given as arrays are consumed in order.
` + '```json\n' + JSON.stringify(j.world, null, 2) + '\n```' + `

Return a JSON object: {"events": [{"type": <EVENT>, "detail": <string>}], "outputs": {<facts the scenario may check>}, "final_outcome": <string>}.
Emit an event ONLY for an action actually performed in THIS run given the world. Do NOT emit events for branches the world never triggers.
EVENT is one of: ${CONFIG.events.join(', ')}.`

const rows = await pipeline(
  CONFIG.jobs,
  (j) => agent(execPrompt(j), { label:`exec:${j.case}:${j.scenario}`, phase:'Execute', model:CONFIG.model, schema:TRACE_SCHEMA })
    .then((trace) => {
      if (!trace) return { case:j.case, scenario:j.scenario, parse_ok:false, coverage:0, passed:0, total:j.checks.length }
      const results = j.checks.map(c=>({desc:c.desc, pass:evalCheck(c, trace)}))
      const passed = results.filter(r=>r.pass).length
      return { case:j.case, scenario:j.scenario, parse_ok:true, coverage:passed/results.length, passed, total:results.length,
               fails: results.filter(r=>!r.pass).map(r=>r.desc) }
    })
)
const clean = rows.filter(Boolean)
const mean = (a)=> a.length? a.reduce((s,x)=>s+x,0)/a.length : 0
const byCase = {}
for (const r of clean) (byCase[r.case]=byCase[r.case]||[]).push(r)
const perCase = Object.entries(byCase).map(([c,rs])=>({case:c, coverage:+(100*mean(rs.map(r=>r.coverage))).toFixed(1)}))
const overall = +(100*mean(clean.map(r=>r.coverage))).toFixed(1)
const parse_ok = +(100*mean(clean.map(r=>r.parse_ok?1:0))).toFixed(1)
log(`HAIKU-EXEC ${CONFIG.tag}: checklist=${overall}% parse_ok=${parse_ok}% n=${clean.length}`)
return { tag: CONFIG.tag, model: CONFIG.model, overall, parse_ok, perCase,
         lost: clean.filter(r=>r.coverage<0.999).map(r=>({s:`${r.case}/${r.scenario}`, passed:r.passed, total:r.total, fails:r.fails})) }
'''

out = BASE / f"haiku-exec-{args.tag}.js"
out.write_text(TEMPLATE.replace("__CONFIG__", json.dumps(CONFIG, indent=2)))
print(f"wrote {out} with {len(jobs)} jobs, skill={args.skill_file} ({len(SKILL)} chars), model={args.model}")
