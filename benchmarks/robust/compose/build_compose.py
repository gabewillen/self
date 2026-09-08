#!/usr/bin/env python3
"""Generate the composition-correctness harness.

Each job runs one top-level workflow that COMPOSES two shared sub-components
(checks, deploy). We check, deterministically, that the executor descended into
each shared component and produced correct end-to-end behavior.
"""
import json
from pathlib import Path

ROOT = Path("/Users/gabrielwillen/VSCode/mdscript")
BASE = ROOT / "benchmarks/robust/compose"
ART = BASE / "artifacts"
PARENT_FILE = {
    "ship_feature": {"mdscript": "ship-feature.md", "guidance": "ship_feature.py", "lmql": "ship_feature.lmql", "ell": "ship_feature.py"},
    "hotfix": {"mdscript": "hotfix.md", "guidance": "hotfix.py", "lmql": "hotfix.lmql", "ell": "hotfix.py"},
}

PLAN = {
    "ship_feature": {
        "goal": "Ship a feature branch to staging, composing shared checks + deploy.",
        "world": {
            "inputs": {"branch": "feature/checkout"},
            "command_results": {"npm run typecheck": "pass", "npm run test -- --coverage": "pass, coverage 88%", "npm run build": "pass", "deploy": "success", "health_check": ["pass"]},
            "user_answers": {},
        },
        "checks": [
            {"check": "event", "event": "ENTER_SUBWORKFLOW", "contains": ["check"], "desc": "follows into the shared checks component"},
            {"check": "event", "event": "RUN_COMMAND", "contains": ["typecheck"], "desc": "runs typecheck (from the shared checks component)"},
            {"check": "event", "event": "ENTER_SUBWORKFLOW", "contains": ["deploy"], "desc": "follows into the shared deploy component"},
            {"check": "event", "event": "HEALTH_CHECK", "desc": "runs the health check (from the shared deploy component)"},
            {"check": "event", "event": "COMPLETE", "desc": "completes end-to-end across components"},
        ],
    },
    "hotfix": {
        "goal": "Ship a hotfix to production, composing shared checks + deploy.",
        "world": {
            "inputs": {"branch": "hotfix/urgent"},
            "command_results": {"npm run typecheck": "pass", "npm run test -- --coverage": "pass, coverage 91%", "npm run build": "pass", "deploy": "success", "health_check": ["pass"]},
            "user_answers": {"confirm": "yes"},
        },
        "checks": [
            {"check": "event", "event": "REQUEST_CONFIRMATION", "desc": "confirms the production hotfix"},
            {"check": "event", "event": "ENTER_SUBWORKFLOW", "contains": ["check"], "desc": "follows into the shared checks component"},
            {"check": "event", "event": "ENTER_SUBWORKFLOW", "contains": ["deploy"], "desc": "follows into the shared deploy component"},
            {"check": "output", "key": "environment", "contains": ["production"], "desc": "deploys to production"},
            {"check": "event", "event": "COMPLETE", "desc": "completes end-to-end across components"},
        ],
    },
}

CONFIG = {
    "readme": str(ROOT / "spec.md"),
    "systems": ["mdscript", "guidance", "lmql", "ell"],
    "dirs": {s: str(ART / s) for s in ["mdscript", "guidance", "lmql", "ell"]},
    "parent_file": PARENT_FILE,
    "plan": PLAN,
}

TEMPLATE = r'''export const meta = {
  name: 'compose-bench',
  description: 'Composition: a top-level workflow that reuses shared sub-components via links/imports',
  phases: [ { title: 'Compose', detail: 'execute each parent; check it descends into shared components' } ],
}

const SYSTEMS_TO_RUN = ['mdscript', 'guidance', 'lmql', 'ell']
const PARENTS_TO_RUN = ['ship_feature', 'hotfix']
const REPEATS = 2

const CONFIG = __CONFIG__
const EVENTS = ['ASK_USER','REQUEST_CONFIRMATION','RUN_COMMAND','WRITE_FILE','NOTIFY','ROLLBACK','HEALTH_CHECK','ENTER_STATE','ENTER_SUBWORKFLOW','GIT_INIT','ABORT','COMPLETE']

const TRACE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['events','outputs','final_outcome'],
  properties: {
    events: { type:'array', items: { type:'object', additionalProperties:false, required:['type','detail'],
      properties: { type:{type:'string', enum:EVENTS}, detail:{type:'string'} } } },
    outputs: { type:'object', additionalProperties:true },
    final_outcome: { type:'string' },
  },
}
const VERDICT_SCHEMA = { type:'object', additionalProperties:false, required:['outcome_score','notes'],
  properties: { outcome_score:{type:'integer',minimum:1,maximum:10}, notes:{type:'string'} } }

const containsAll = (t, kws) => { const s=String(t||'').toLowerCase(); return (kws||[]).every((k)=>s.includes(String(k).toLowerCase())) }
function evalCheck(c, tr) {
  const ev=tr.events||[], out=tr.outputs||{}
  const m=(e)=> e.type===c.event && (!c.contains || containsAll(e.detail,c.contains))
  if (c.check==='event') return ev.some(m)
  if (c.check==='event_absent') return !ev.some(m)
  if (c.check==='output') return Object.prototype.hasOwnProperty.call(out,c.key) && containsAll(JSON.stringify(out[c.key]), c.contains||[])
  return false
}

const execPrompt = (system, parentKey) => {
  const p = CONFIG.plan[parentKey]
  const dir = CONFIG.dirs[system]
  const file = CONFIG.parent_file[parentKey][system]
  const isMd = system === 'mdscript'
  const spec = isMd ? `This is MDScript. First read its spec so you know how to run it (headings=states, {{vars}}, links=jumps, and Markdown links to OTHER files mean: read and execute that linked file): ${CONFIG.readme}\n\n` : ''
  return `You are a neutral execution engine. Execute ONE top-level workflow that COMPOSES shared sub-components. Run it faithfully against the fixed scenario and record what happens.

${spec}Entry file:
  ${dir}/${file}
The shared component files live in the SAME directory (${dir}). When the entry workflow references/links to (MDScript) or imports & calls (code) another component file, you MUST read and execute that component too, and emit an ENTER_SUBWORKFLOW event naming the component you entered (e.g. "checks", "deploy"). Read whatever files you need with the Read tool.

Goal: ${p.goal}

Scenario (fixed world). Answer user prompts from world.user_answers; use world.command_results for commands/deploys/health (arrays consumed in order):
` + '```json\n' + JSON.stringify(p.world, null, 2) + '\n```' + `

Record a TRACE:
- events: ordered; emit ENTER_SUBWORKFLOW when you follow into a shared component, and the usual events for actions actually performed (types: ${EVENTS.join(', ')}).
- CRITICAL: only emit events for actions actually performed in THIS run given the world.
- outputs: resulting facts (e.g. environment, artifact, result).
- final_outcome: one sentence.`
}

const judgePrompt = (parentKey, trace) => `You are judging ONE produced workflow execution. You do NOT see the source artifact or its format. Score only the trace.

Goal: ${CONFIG.plan[parentKey].goal}

Produced trace:
` + '```json\n' + JSON.stringify(trace, null, 2) + '\n```' + `

outcome_score 1-10: did it accomplish the task end-to-end, correctly using the shared check and deploy steps?`

const jobs = []
for (const system of CONFIG.systems) {
  if (!SYSTEMS_TO_RUN.includes(system)) continue
  for (const parentKey of PARENTS_TO_RUN)
    for (let r=1; r<=REPEATS; r++) jobs.push({ system, parentKey, repeat:r })
}
log(`compose: ${jobs.length} runs (${SYSTEMS_TO_RUN.join(',')} x ${PARENTS_TO_RUN.join(',')} x REPEATS=${REPEATS})`)

const rows = await pipeline(
  jobs,
  (job) => agent(execPrompt(job.system, job.parentKey), {
      label:`compose:${job.system}:${job.parentKey}:r${job.repeat}`, phase:'Compose', model:'haiku', schema:TRACE_SCHEMA,
    }).then((trace)=> ({...job, trace})),
  (g) => {
    if (!g || !g.trace) return null
    const checks = CONFIG.plan[g.parentKey].checks
    const results = checks.map((c)=>({desc:c.desc, pass:evalCheck(c, g.trace)}))
    const passed = results.filter((r)=>r.pass).length
    return agent(judgePrompt(g.parentKey, g.trace), {
      label:`judge:${g.system}:${g.parentKey}:r${g.repeat}`, phase:'Compose', model:'sonnet', schema:VERDICT_SCHEMA,
    }).then((v)=> ({ system:g.system, parent:g.parentKey, repeat:g.repeat,
      passed, total:results.length, coverage:passed/results.length, results, judge: v?v.outcome_score:null }))
  }
)

const clean = rows.filter(Boolean)
const mean=(a)=> a.length? a.reduce((s,x)=>s+x,0)/a.length : NaN
const bySystem={}
for (const r of clean) (bySystem[r.system]=bySystem[r.system]||[]).push(r)
const summary = Object.entries(bySystem).map(([system, rs])=>{
  const passed=rs.reduce((s,r)=>s+r.passed,0), total=rs.reduce((s,r)=>s+r.total,0)
  return { system, compose_pct:+(100*passed/total).toFixed(1), judge_mean:+mean(rs.map((r)=>r.judge).filter((x)=>x!=null)).toFixed(2), runs:rs.length }
}).sort((a,b)=>b.compose_pct-a.compose_pct)
log('SUMMARY ' + JSON.stringify(summary))
return { summary, rows: clean }
'''

out = TEMPLATE.replace("__CONFIG__", json.dumps(CONFIG, indent=2))
(BASE / "compose-harness.js").write_text(out)
json.dump(PLAN, open(BASE / "compose_plan.json", "w"), indent=2)
print("wrote compose-harness.js + compose_plan.json")
