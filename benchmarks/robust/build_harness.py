#!/usr/bin/env python3
"""Generate a harness.js from the canonical scenario JSON files + artifact paths.

Keeping the harness generated (rather than hand-edited) guarantees the embedded
scenario data never drifts from scenarios/*.json.

Modes:
  --mode spec   MDScript executor is given the spec.md execution spec (default).
  --mode skill  MDScript executor is given the mdscript-exec SKILL (it "has the
                skill available"). Code systems are identical across modes.
"""
import argparse
import json
from pathlib import Path

ROOT = Path("/Users/gabrielwillen/VSCode/mdscript")
BASE = ROOT / "benchmarks/robust"
EXT = {"mdscript": "md", "guidance": "py", "lmql": "lmql", "ell": "py"}
SYSTEMS = ["mdscript", "guidance", "lmql", "ell"]
CASES = ["deploy_branch", "release_notes", "onboard_service"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["spec", "skill"], default="spec")
    ap.add_argument("--systems", default=",".join(SYSTEMS), help="csv of systems to run")
    ap.add_argument("--out", default=str(BASE / "harness.js"))
    args = ap.parse_args()
    systems_to_run = [s.strip() for s in args.systems.split(",") if s.strip()]

    cfg_cases = []
    for case in CASES:
        data = json.loads((BASE / "scenarios" / f"{case}.json").read_text())
        cfg_cases.append({
            "id": case,
            "goal": data["goal"],
            "artifacts": {s: str(BASE / "artifacts" / case / f"{s}.{EXT[s]}") for s in SYSTEMS},
            "scenarios": data["scenarios"],
        })

    skill_text = (ROOT / "skills/mdscript-exec/SKILL.md").read_text() if args.mode == "skill" else None

    CONFIG = {
        "mode": args.mode,
        "readme": str(ROOT / "spec.md"),
        "mdscript_skill": skill_text,
        "systems": SYSTEMS,
        "cases": cfg_cases,
    }

    name = "robust-scripting-bench" + ("-skill" if args.mode == "skill" else "")
    desc = ("Robust LLM-scripting benchmark (" + ("MDScript executor uses the mdscript-exec SKILL" if args.mode == "skill" else "MDScript executor reads spec.md") + ")")

    harness = TEMPLATE
    harness = harness.replace("__NAME__", name)
    harness = harness.replace("__DESC__", desc)
    harness = harness.replace("__SYSTEMS_TO_RUN__", json.dumps(systems_to_run))
    harness = harness.replace("__CONFIG__", json.dumps(CONFIG, indent=2))

    out = Path(args.out)
    out.write_text(harness)
    print(f"wrote {out} ({len(harness)} bytes) mode={args.mode} systems={systems_to_run}")
    print("cases:", [c["id"] for c in cfg_cases], "scenarios:", sum(len(c["scenarios"]) for c in cfg_cases))


TEMPLATE = r'''export const meta = {
  name: '__NAME__',
  description: '__DESC__',
  phases: [
    { title: 'Execute', detail: 'haiku executes each artifact against each scenario' },
    { title: 'Score', detail: 'deterministic checklist grader + blind judge per execution' },
  ],
}

// ---- knobs (edit + re-run to scale) ----
const CASES_TO_RUN = ['deploy_branch', 'release_notes', 'onboard_service']
const SYSTEMS_TO_RUN = __SYSTEMS_TO_RUN__
const REPEATS = 2
// ----------------------------------------

const CONFIG = __CONFIG__

const EVENTS = ['ASK_USER','REQUEST_CONFIRMATION','RUN_COMMAND','WRITE_FILE','NOTIFY','ROLLBACK','HEALTH_CHECK','ENTER_STATE','GIT_INIT','ABORT','COMPLETE']

const TRACE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['events', 'outputs', 'final_outcome'],
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['type', 'detail'],
        properties: { type: { type: 'string', enum: EVENTS }, detail: { type: 'string' } },
      },
    },
    outputs: { type: 'object', additionalProperties: true },
    final_outcome: { type: 'string' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['outcome_score', 'notes'],
  properties: {
    outcome_score: { type: 'integer', minimum: 1, maximum: 10 },
    notes: { type: 'string' },
  },
}

const containsAll = (text, kws) => {
  const t = String(text || '').toLowerCase()
  return (kws || []).every((k) => t.includes(String(k).toLowerCase()))
}

function evalCheck(check, trace) {
  const events = trace.events || []
  const outputs = trace.outputs || {}
  const matchEv = (e) => e.type === check.event && (!check.contains || containsAll(e.detail, check.contains))
  if (check.check === 'event') return events.some(matchEv)
  if (check.check === 'event_absent') return !events.some(matchEv)
  if (check.check === 'count') {
    const n = events.filter(matchEv).length
    const v = check.value
    if (check.op === '>=') return n >= v
    if (check.op === '>') return n > v
    if (check.op === '==') return n === v
    if (check.op === '<=') return n <= v
    return false
  }
  if (check.check === 'output') {
    return Object.prototype.hasOwnProperty.call(outputs, check.key) &&
      containsAll(JSON.stringify(outputs[check.key]), check.contains || [])
  }
  if (check.check === 'output_absent') {
    if (!Object.prototype.hasOwnProperty.call(outputs, check.key)) return true
    return !containsAll(JSON.stringify(outputs[check.key]), check.contains || [])
  }
  return false
}

function grade(scenario, trace) {
  const results = scenario.checks.map((c) => ({ desc: c.desc, pass: evalCheck(c, trace) }))
  const passed = results.filter((r) => r.pass).length
  return { passed, total: results.length, coverage: passed / results.length, results }
}

const mdscriptAid = () => {
  if (CONFIG.mdscript_skill) {
    return `You have the mdscript-exec skill available. Execute the workflow strictly according to this skill (treat it as your operating procedure, not as MDScript to run):\n\n----- mdscript-exec SKILL -----\n${CONFIG.mdscript_skill}\n----- end skill -----\n\nThe skill may direct you to read the MDScript spec at ${CONFIG.readme} if the rules are unclear.\n\n`
  }
  return `This artifact is MDScript. FIRST read its execution spec so you know how to run it:\n  ${CONFIG.readme}\nThe spec defines headings as states, {{vars}}, links as control-flow jumps, and that every instruction must be executed, not narrated.\n\n`
}

const execPrompt = (kase, system, scenario) => {
  const readSpec = system === 'mdscript' ? mdscriptAid() : ''
  return `You are a neutral execution engine. Read ONE workflow artifact and simulate executing it against a fixed scenario. Do not judge or improve the artifact; just run it faithfully and record what happens.

${readSpec}Read the artifact at this path:
  ${kase.artifacts[system]}

Goal of the workflow: ${kase.goal}

Scenario (the fixed world for THIS run). When the artifact asks the user something, answer from world.user_answers (match by intent). When it runs a command/deploys/health-checks, use world.command_results; values given as arrays are consumed in order across repeated calls.
` + '```json\n' + JSON.stringify(scenario, null, 2) + '\n```' + `

Record a TRACE of what ACTUALLY happens in this run:
- events: an ordered list. Emit one event for each real action you take, choosing type from: ${EVENTS.join(', ')}. Put specifics in detail (command string, file path, what you asked, which state you entered, etc.).
- CRITICAL: emit an event ONLY for an action actually performed in THIS run given the world. Do NOT emit events for branches the world never triggers. Do NOT credit yourself for code paths that merely exist but did not run.
- outputs: an object of resulting facts the scenario may check, e.g. final variable values (branch, service_name, language_config), and for changelog runs a "sections" array of the section titles you wrote, and an "outcome" string.
- final_outcome: one short sentence on how the run ended.`
}

const judgePrompt = (kase, scenario, trace) => `You are judging ONE produced workflow execution result. You do NOT see the source artifact or its language/format. Score only the produced trace against the task. Reward correct, complete handling of the scenario's branches; penalize missing or wrong behavior.

Goal: ${kase.goal}
Scenario intent: ${scenario.description}

Produced trace:
` + '```json\n' + JSON.stringify(trace, null, 2) + '\n```' + `

Give outcome_score 1-10: did this run accomplish the task correctly for this scenario, including the conditional/branch behavior the scenario is designed to exercise?`

// build jobs
const jobs = []
for (const kase of CONFIG.cases) {
  if (!CASES_TO_RUN.includes(kase.id)) continue
  for (const system of CONFIG.systems) {
    if (!SYSTEMS_TO_RUN.includes(system)) continue
    for (const scenario of kase.scenarios) {
      for (let r = 1; r <= REPEATS; r++) jobs.push({ kase, system, scenario, repeat: r })
    }
  }
}
log(`running ${jobs.length} executions [mode=${CONFIG.mode}] (${CASES_TO_RUN.join(',')} x ${SYSTEMS_TO_RUN.join(',')} x REPEATS=${REPEATS})`)

const rows = await pipeline(
  jobs,
  (job) =>
    agent(execPrompt(job.kase, job.system, job.scenario), {
      label: `exec:${job.kase.id}:${job.system}:${job.scenario.id}:r${job.repeat}`,
      phase: 'Execute', model: 'haiku', schema: TRACE_SCHEMA,
    }).then((trace) => ({ ...job, trace })),
  (g) => {
    if (!g || !g.trace) return null
    const checklist = grade(g.scenario, g.trace)
    return agent(judgePrompt(g.kase, g.scenario, g.trace), {
      label: `judge:${g.kase.id}:${g.system}:${g.scenario.id}:r${g.repeat}`,
      phase: 'Score', model: 'sonnet', schema: VERDICT_SCHEMA,
    }).then((v) => ({
      case: g.kase.id, system: g.system, scenario: g.scenario.id, repeat: g.repeat,
      checklist_coverage: checklist.coverage, checklist_passed: checklist.passed, checklist_total: checklist.total,
      checklist_detail: checklist.results, judge: v ? v.outcome_score : null, judge_notes: v ? v.notes : null,
    }))
  }
)

// aggregate
const clean = rows.filter(Boolean)
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN)
const pstdev = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))) }

const bySystem = {}
for (const row of clean) (bySystem[row.system] = bySystem[row.system] || []).push(row)
const summary = Object.entries(bySystem).map(([system, rs]) => {
  const cov = rs.map((r) => r.checklist_coverage)
  const jud = rs.map((r) => r.judge).filter((x) => x != null)
  return {
    system, mode: CONFIG.mode,
    checklist_pct: +(mean(cov) * 100).toFixed(1),
    checklist_sd: +(pstdev(cov) * 100).toFixed(1),
    judge_mean: +mean(jud).toFixed(2),
    n: rs.length,
  }
}).sort((a, b) => b.checklist_pct - a.checklist_pct)

const byCaseSystem = {}
for (const row of clean) {
  const k = row.case + '::' + row.system
  ;(byCaseSystem[k] = byCaseSystem[k] || []).push(row.checklist_coverage)
}
const perCase = Object.entries(byCaseSystem).map(([k, v]) => ({ k, pct: +(mean(v) * 100).toFixed(1) }))

const disagreements = clean.filter((r) =>
  (r.checklist_coverage < 0.6 && r.judge >= 8) || (r.checklist_coverage === 1 && r.judge <= 6)
).map((r) => ({ case: r.case, system: r.system, scenario: r.scenario, repeat: r.repeat, checklist: +(r.checklist_coverage * 100).toFixed(0), judge: r.judge }))

log('SUMMARY ' + JSON.stringify(summary))
return { mode: CONFIG.mode, summary, perCase, disagreements, rows: clean }
'''


if __name__ == "__main__":
    main()
