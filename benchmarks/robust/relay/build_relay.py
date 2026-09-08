#!/usr/bin/env python3
"""Generate the multi-hop relay harness (head-to-head: enter-at-a-state delegation).

Each hop is an independent worker agent DISPATCHED to resume the shared deploy
workflow at a specific state, given the variables prior agents accumulated. We
check, deterministically, that it (a) entered at the requested state, (b) did
not re-run earlier states, (c) used the injected variables, (d) produced the
hand-off variable.
"""
import json
from pathlib import Path

ROOT = Path("/Users/gabrielwillen/VSCode/mdscript")
RELAY = ROOT / "benchmarks/robust/relay"
ART = RELAY / "artifacts/deploy_branch"
SKILL = (ROOT / "skills/mdscript-exec/SKILL.md").read_text()

PLAN = {
    "workflow": "deploy_branch",
    "artifacts": {
        "mdscript": str(ART / "mdscript.md"),
        "guidance": str(ART / "guidance.py"),
        "lmql": str(ART / "lmql.lmql"),
        "ell": str(ART / "ell.py"),
    },
    "hops": [
        {
            "anchor": "select-branch",
            "inject": {},
            "world": {"user_answers": {"branch": "feature/relay"}},
            "checks": [
                {"check": "event", "event": "ENTER_STATE", "contains": ["select"], "desc": "enters at select-branch"},
                {"check": "event", "event": "ASK_USER", "contains": ["branch"], "desc": "resolves the branch"},
                {"check": "output", "key": "branch", "contains": ["feature/relay"], "desc": "produces branch for hand-off"},
            ],
        },
        {
            "anchor": "run-checks",
            "inject": {"branch": "feature/relay"},
            "world": {"command_results": {"npm run typecheck": "pass", "npm run test -- --coverage": "pass, coverage 88%"}},
            "checks": [
                {"check": "event", "event": "ENTER_STATE", "contains": ["check"], "desc": "enters at run-checks"},
                {"check": "event_absent", "event": "ENTER_STATE", "contains": ["select"], "desc": "does not re-run select-branch"},
                {"check": "event_absent", "event": "ASK_USER", "contains": ["branch"], "desc": "does not re-ask for the injected branch"},
                {"check": "event", "event": "RUN_COMMAND", "contains": ["typecheck"], "desc": "runs the checks"},
                {"check": "output", "key": "coverage", "contains": ["88"], "desc": "produces coverage for hand-off"},
            ],
        },
        {
            "anchor": "build-artifact",
            "inject": {"branch": "feature/relay", "coverage": "88"},
            "world": {"command_results": {"npm run build": "pass"}},
            "checks": [
                {"check": "event", "event": "ENTER_STATE", "contains": ["build"], "desc": "enters at build-artifact"},
                {"check": "event_absent", "event": "RUN_COMMAND", "contains": ["typecheck"], "desc": "does not re-run checks"},
                {"check": "event_absent", "event": "ENTER_STATE", "contains": ["select"], "desc": "does not re-run select-branch"},
                {"check": "output", "key": "artifact", "contains": ["feature-relay"], "desc": "uses injected branch in the artifact name (variable carried across hand-off)"},
            ],
        },
        {
            "anchor": "deploy",
            "inject": {"branch": "feature/relay", "artifact": "dist/feature-relay-20260101.tar.gz", "environment": "staging"},
            "world": {"command_results": {"deploy": "success"}},
            "checks": [
                {"check": "event", "event": "ENTER_STATE", "contains": ["deploy"], "desc": "enters at deploy"},
                {"check": "event_absent", "event": "RUN_COMMAND", "contains": ["build"], "desc": "does not re-build"},
                {"check": "event", "event": "NOTIFY", "desc": "notifies on deploy"},
                {"check": "output", "key": "artifact", "contains": ["feature-relay"], "desc": "deploys the injected artifact (variable carried across hand-off)"},
            ],
        },
        {
            "anchor": "verify-deployment",
            "inject": {"branch": "feature/relay", "deploy_url": "https://staging.example.test"},
            "world": {"command_results": {"health_check": ["pass"]}},
            "checks": [
                {"check": "event", "event": "ENTER_STATE", "contains": ["verif"], "desc": "enters at verify-deployment"},
                {"check": "event", "event": "HEALTH_CHECK", "desc": "runs the health check"},
                {"check": "output", "key": "result", "contains": ["complete"], "desc": "reports completion"},
            ],
        },
    ],
}

CONFIG = {"skill": SKILL, "readme": str(ROOT / "spec.md"), "plan": PLAN, "systems": ["mdscript", "guidance", "lmql", "ell"]}

TEMPLATE = r'''export const meta = {
  name: 'relay-jumppoint-bench',
  description: 'Multi-hop relay: agents dispatch each other to enter a shared workflow at a specific state',
  phases: [ { title: 'Relay', detail: 'each hop is a worker dispatched to resume at one state' } ],
}

const SYSTEMS_TO_RUN = ['mdscript', 'guidance', 'lmql', 'ell']
const REPEATS = 3

const CONFIG = __CONFIG__
const EVENTS = ['ASK_USER','REQUEST_CONFIRMATION','RUN_COMMAND','WRITE_FILE','NOTIFY','ROLLBACK','HEALTH_CHECK','ENTER_STATE','GIT_INIT','ABORT','COMPLETE']

const TRACE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['events', 'outputs', 'final_outcome'],
  properties: {
    events: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type','detail'],
      properties: { type: { type: 'string', enum: EVENTS }, detail: { type: 'string' } } } },
    outputs: { type: 'object', additionalProperties: true },
    final_outcome: { type: 'string' },
  },
}

const containsAll = (text, kws) => { const t = String(text||'').toLowerCase(); return (kws||[]).every((k)=>t.includes(String(k).toLowerCase())) }
function evalCheck(check, trace) {
  const events = trace.events||[], outputs = trace.outputs||{}
  const m = (e)=> e.type===check.event && (!check.contains || containsAll(e.detail, check.contains))
  if (check.check==='event') return events.some(m)
  if (check.check==='event_absent') return !events.some(m)
  if (check.check==='output') return Object.prototype.hasOwnProperty.call(outputs, check.key) && containsAll(JSON.stringify(outputs[check.key]), check.contains||[])
  if (check.check==='output_absent') { if(!Object.prototype.hasOwnProperty.call(outputs,check.key)) return true; return !containsAll(JSON.stringify(outputs[check.key]), check.contains||[]) }
  return false
}

const dispatchInstruction = (system, anchor, path) => {
  if (system === 'mdscript') {
    return `You have the mdscript-exec skill (your operating procedure for running MDScript files):\n\n----- mdscript-exec SKILL -----\n${CONFIG.skill}\n----- end skill -----\n\nThe shared workflow file is: ${path}\nAnother agent dispatched you with:  mdscript-exec ${path}#${anchor}\nEnter at the "#${anchor}" heading. Execute ONLY that state's instructions, then hand back. Do not run earlier or later states.`
  }
  return `The shared workflow is the relay-enabled artifact at: ${path}\nRead it. Another agent dispatched you with:  enter('${anchor}', state)\nCall the entrant registered for the '${anchor}' state with the accumulated state below. Execute ONLY that state's body, then hand back. Do not run other states.`
}

const hopPrompt = (system, hop) => `You are a worker agent in a multi-agent relay. Another agent has DISPATCHED you to resume a shared deploy workflow at one specific state, with the variables prior agents already accumulated. Run only that state and report what it produces so control can hand off to the next agent.

${dispatchInstruction(system, hop.anchor, CONFIG.plan.artifacts[system])}

Variables already accumulated by prior agents (USE these; do NOT recompute or re-ask for them):
` + '```json\n' + JSON.stringify(hop.inject, null, 2) + '\n```' + `

World for this hop (command/user results to assume):
` + '```json\n' + JSON.stringify(hop.world, null, 2) + '\n```' + `

Emit a TRACE:
- events: ordered. The FIRST event must be ENTER_STATE with detail naming the state you entered ("${hop.anchor}"). Then one event per real action in THIS state only (type from: ${EVENTS.join(', ')}).
- CRITICAL: only this state. Do NOT re-run earlier states, do NOT re-ask for variables you were given, do NOT re-run prior commands.
- outputs: the variable(s) this state produces for the next agent, plus echo any injected variable you used.
- final_outcome: one sentence on what you handed back.`

const jobs = []
for (const system of CONFIG.systems) {
  if (!SYSTEMS_TO_RUN.includes(system)) continue
  for (let r = 1; r <= REPEATS; r++)
    for (let h = 0; h < CONFIG.plan.hops.length; h++) jobs.push({ system, repeat: r, hopIndex: h, hop: CONFIG.plan.hops[h] })
}
log(`relay: ${jobs.length} hops (${SYSTEMS_TO_RUN.join(',')} x ${CONFIG.plan.hops.length} hops x REPEATS=${REPEATS})`)

const rows = await pipeline(
  jobs,
  (job) => agent(hopPrompt(job.system, job.hop), {
      label: `relay:${job.system}:${job.hop.anchor}:r${job.repeat}`, phase: 'Relay', model: 'haiku', schema: TRACE_SCHEMA,
    }).then((trace) => {
      if (!trace) return null
      const results = job.hop.checks.map((c)=>({desc:c.desc, pass:evalCheck(c, trace)}))
      const passed = results.filter((r)=>r.pass).length
      return { system: job.system, repeat: job.repeat, anchor: job.hop.anchor,
               passed, total: results.length, coverage: passed/results.length, results, trace }
    })
)

const clean = rows.filter(Boolean)
const mean = (a)=> a.length ? a.reduce((s,x)=>s+x,0)/a.length : NaN
const bySystem = {}
for (const r of clean) (bySystem[r.system]=bySystem[r.system]||[]).push(r)
const summary = Object.entries(bySystem).map(([system, rs])=>{
  const passed = rs.reduce((s,r)=>s+r.passed,0), total = rs.reduce((s,r)=>s+r.total,0)
  return { system, handoff_pct: +(100*passed/total).toFixed(1), hop_checks_passed: passed, hop_checks_total: total, hops_run: rs.length }
}).sort((a,b)=>b.handoff_pct-a.handoff_pct)

const byHop = {}
for (const r of clean) { const k=r.system+'::'+r.anchor; (byHop[k]=byHop[k]||[]).push(r.coverage) }
const perHop = Object.entries(byHop).map(([k,v])=>({k, pct:+(100*mean(v)).toFixed(1)}))

// the key failures: did any agent re-run an earlier state or fail to enter at the requested one?
const enterOrReuse = clean.flatMap((r)=> r.results.filter((c)=>!c.pass && (/enters at|does not re-run|does not re-ask/.test(c.desc))).map((c)=>({system:r.system, anchor:r.anchor, repeat:r.repeat, failed:c.desc})))

log('SUMMARY ' + JSON.stringify(summary))
return { summary, perHop, jump_failures: enterOrReuse, rows: clean.map(({trace, ...r})=>r) }
'''

out = TEMPLATE.replace("__CONFIG__", json.dumps(CONFIG, indent=2))
(RELAY / "relay-harness.js").write_text(out)
json.dump(PLAN, open(RELAY / "relay_plan.json", "w"), indent=2)
print("wrote relay-harness.js and relay_plan.json")
print("hops:", [h["anchor"] for h in PLAN["hops"]], "total checks:", sum(len(h["checks"]) for h in PLAN["hops"]))
