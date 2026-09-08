export const meta = {
  name: 'robust-scripting-bench-skill',
  description: 'Robust LLM-scripting benchmark (MDScript executor uses the mdscript-exec SKILL)',
  phases: [
    { title: 'Execute', detail: 'haiku executes each artifact against each scenario' },
    { title: 'Score', detail: 'deterministic checklist grader + blind judge per execution' },
  ],
}

// ---- knobs (edit + re-run to scale) ----
const CASES_TO_RUN = ['deploy_branch', 'release_notes', 'onboard_service']
const SYSTEMS_TO_RUN = ["mdscript"]
const REPEATS = 2
// ----------------------------------------

const CONFIG = {
  "mode": "skill",
  "readme": "/Users/gabrielwillen/VSCode/mdscript/spec.md",
  "mdscript_skill": "---\nname: mdscript-exec\ndescription: >-\n  Execute MDScript Markdown workflows. Use when the user invokes\n  /mdscript-exec, asks to run an MDScript file, asks to start from a specific\n  heading, or a file header requires the mdscript-exec skill.\n---\n\n# MDScript Executor\n\nUse this skill as the bootstrap executor for MDScript. Do not interpret this\nSKILL.md as MDScript; these are normal skill instructions for executing other\nMarkdown workflow files that use MDScript syntax.\n\n## Inputs\n\nAccept any of these forms:\n\n- `/mdscript-exec path/to/workflow.md`\n- `/mdscript-exec path/to/workflow.md#heading-anchor`\n- natural language that names a workflow file and, optionally, a heading to\n  start from\n\nIf the workflow path is missing or ambiguous, ask for the path. If a heading is\nprovided, store it as the requested start state.\n\n## Load The Workflow\n\nRead the workflow file. If the path contains a `#fragment`, strip the fragment\nfrom the file path and use the fragment as the requested heading or anchor.\n\nIf the workflow header says to use `mdscript-exec` or read the MDScript spec,\nand the MDScript rules are not already clear in this session, read the linked\nspec (`spec.md`) before executing the workflow.\n\n## Parse States\n\nIgnore YAML frontmatter, the execution header comment, and prose before the\nfirst `##` heading.\n\nTreat each `##` heading as a state. The state body continues until the next\n`##` heading or end of file. Treat bullets under a state as executable\ninstructions.\n\nCompute a Markdown anchor slug for each state heading using the normal\nlowercase, hyphenated heading text convention. If the user requested a start\nheading, match it against either the literal heading text or the anchor slug. If\nthere is no match, list the available headings and ask for a valid starting\nheading instead of silently starting at the top.\n\nWhen no start heading is requested, begin at the first state.\n\n## Execute States\n\nExecute each instruction in the current state in order. Maintain state for\nMDScript variables such as `{{service_name}}` across the workflow.\n\nPerform actions directly with available tools. Do not narrate that an action\nwould be performed. If an instruction says to infer, ask, read, create, edit,\nrun, verify, notify, or report something, do that action.\n\nFollow Markdown links to state anchors when the surrounding condition applies.\nUse those links for branches, retries, and loops. Follow Markdown links to other\nfiles by reading or executing the linked file according to the instruction text.\n\nIf a required value is missing and cannot be inferred safely, ask the user for\nthat value and continue from the current state.\n\nIf a command or validation step fails and the workflow gives a linked recovery\nstate, follow that recovery link. If no recovery is specified, stop and report\nthe failed command or validation, the relevant output, and the current state.\n\nWhen the current state completes without a branch, continue to the next state in\nfile order. Stop when there are no more states.\n\n## Report Completion\n\nAt the end, summarize the workflow completed, files changed, commands run, and\nvalidation results. Mention any skipped optional branches or unresolved\nfollow-ups.\n",
  "systems": [
    "mdscript",
    "guidance",
    "lmql",
    "ell"
  ],
  "cases": [
    {
      "id": "deploy_branch",
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "artifacts": {
        "mdscript": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/deploy_branch/mdscript.md",
        "guidance": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/deploy_branch/guidance.py",
        "lmql": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/deploy_branch/lmql.lmql",
        "ell": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/deploy_branch/ell.py"
      },
      "scenarios": [
        {
          "id": "happy_path",
          "description": "Branch given, all checks pass, deploy succeeds, health passes first try.",
          "inputs": {
            "branch": "feature/checkout",
            "environment": "staging",
            "deploy_url": "https://staging.example.test"
          },
          "world": {
            "command_results": {
              "npm run typecheck": "pass",
              "npm run test -- --coverage": "pass, coverage 91%",
              "npm run build": "pass",
              "deploy": "success",
              "health_check": [
                "pass"
              ]
            },
            "user_answers": {}
          },
          "checks": [
            {
              "check": "event",
              "event": "RUN_COMMAND",
              "contains": [
                "typecheck"
              ],
              "desc": "runs typecheck"
            },
            {
              "check": "event",
              "event": "RUN_COMMAND",
              "contains": [
                "build"
              ],
              "desc": "runs build"
            },
            {
              "check": "event",
              "event": "NOTIFY",
              "contains": [
                "team"
              ],
              "desc": "notifies team on success"
            },
            {
              "check": "event",
              "event": "COMPLETE",
              "contains": [
                "complete"
              ],
              "desc": "marks deploy complete"
            },
            {
              "check": "event_absent",
              "event": "REQUEST_CONFIRMATION",
              "desc": "no confirmation prompts when nothing risky"
            },
            {
              "check": "event_absent",
              "event": "ROLLBACK",
              "desc": "no rollback on a clean deploy"
            }
          ]
        },
        {
          "id": "missing_branch",
          "description": "Branch is empty; workflow must ask for it before doing anything.",
          "inputs": {
            "branch": "",
            "environment": "staging",
            "deploy_url": "https://staging.example.test"
          },
          "world": {
            "command_results": {
              "npm run typecheck": "pass",
              "npm run test -- --coverage": "pass, coverage 88%",
              "npm run build": "pass",
              "deploy": "success",
              "health_check": [
                "pass"
              ]
            },
            "user_answers": {
              "branch": "feature/login"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "ASK_USER",
              "contains": [
                "branch"
              ],
              "desc": "asks for the missing branch"
            },
            {
              "check": "output",
              "key": "branch",
              "contains": [
                "feature/login"
              ],
              "desc": "uses the branch the user supplied"
            },
            {
              "check": "event",
              "event": "COMPLETE",
              "desc": "completes the deploy"
            }
          ]
        },
        {
          "id": "main_declined",
          "description": "Branch is main and the user declines approval; must stop before any checks or deploy.",
          "inputs": {
            "branch": "main",
            "environment": "production",
            "deploy_url": "https://prod.example.test"
          },
          "world": {
            "command_results": {},
            "user_answers": {
              "confirm_main": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "REQUEST_CONFIRMATION",
              "contains": [
                "main"
              ],
              "desc": "asks for confirmation before deploying main"
            },
            {
              "check": "event",
              "event": "ABORT",
              "desc": "stops because approval was declined"
            },
            {
              "check": "event_absent",
              "event": "RUN_COMMAND",
              "contains": [
                "build"
              ],
              "desc": "never builds when not approved"
            },
            {
              "check": "event_absent",
              "event": "ROLLBACK",
              "desc": "nothing to roll back"
            }
          ]
        },
        {
          "id": "low_coverage_proceed",
          "description": "Coverage below 80%; user chooses to proceed; deploy then succeeds.",
          "inputs": {
            "branch": "feature/reports",
            "environment": "staging",
            "deploy_url": "https://staging.example.test"
          },
          "world": {
            "command_results": {
              "npm run typecheck": "pass",
              "npm run test -- --coverage": "pass, coverage 72%",
              "npm run build": "pass",
              "deploy": "success",
              "health_check": [
                "pass"
              ]
            },
            "user_answers": {
              "proceed_low_coverage": "yes"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "REQUEST_CONFIRMATION",
              "contains": [
                "coverage"
              ],
              "desc": "warns/confirms on low coverage"
            },
            {
              "check": "event",
              "event": "RUN_COMMAND",
              "contains": [
                "build"
              ],
              "desc": "proceeds to build after user agrees"
            },
            {
              "check": "event",
              "event": "COMPLETE",
              "desc": "completes the deploy"
            }
          ]
        },
        {
          "id": "low_coverage_declined",
          "description": "Coverage below 80%; user declines; must cancel before build/deploy.",
          "inputs": {
            "branch": "feature/reports",
            "environment": "staging",
            "deploy_url": "https://staging.example.test"
          },
          "world": {
            "command_results": {
              "npm run typecheck": "pass",
              "npm run test -- --coverage": "pass, coverage 72%"
            },
            "user_answers": {
              "proceed_low_coverage": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "REQUEST_CONFIRMATION",
              "contains": [
                "coverage"
              ],
              "desc": "warns/confirms on low coverage"
            },
            {
              "check": "event",
              "event": "ABORT",
              "desc": "cancels when user declines"
            },
            {
              "check": "event_absent",
              "event": "RUN_COMMAND",
              "contains": [
                "build"
              ],
              "desc": "does not build after cancel"
            }
          ]
        },
        {
          "id": "deploy_fails_then_recovers",
          "description": "Checks pass; first deploy fails (rollback + notify + return to Select Branch); user re-supplies same branch; second deploy succeeds; health passes.",
          "inputs": {
            "branch": "feature/payments",
            "environment": "staging",
            "deploy_url": "https://staging.example.test"
          },
          "world": {
            "command_results": {
              "npm run typecheck": "pass",
              "npm run test -- --coverage": "pass, coverage 90%",
              "npm run build": "pass",
              "deploy": [
                "fail",
                "success"
              ],
              "health_check": [
                "pass"
              ]
            },
            "user_answers": {
              "branch": "feature/payments"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "ROLLBACK",
              "desc": "rolls back on deploy failure"
            },
            {
              "check": "event",
              "event": "NOTIFY",
              "contains": [
                "fail"
              ],
              "desc": "notifies team that the deploy failed"
            },
            {
              "check": "event",
              "event": "ENTER_STATE",
              "contains": [
                "select"
              ],
              "desc": "returns to Select Branch after failure"
            },
            {
              "check": "event",
              "event": "COMPLETE",
              "desc": "eventually completes after recovery"
            }
          ]
        },
        {
          "id": "health_exhausted_then_recovers",
          "description": "Deploy succeeds but health fails all 3 attempts; rollback + return to Select Branch; second round health passes.",
          "inputs": {
            "branch": "feature/search",
            "environment": "staging",
            "deploy_url": "https://staging.example.test"
          },
          "world": {
            "command_results": {
              "npm run typecheck": "pass",
              "npm run test -- --coverage": "pass, coverage 85%",
              "npm run build": "pass",
              "deploy": "success",
              "health_check": [
                "fail",
                "fail",
                "fail",
                "pass"
              ]
            },
            "user_answers": {
              "branch": "feature/search"
            }
          },
          "checks": [
            {
              "check": "count",
              "event": "HEALTH_CHECK",
              "op": ">=",
              "value": 3,
              "desc": "retries health check up to 3 times"
            },
            {
              "check": "event",
              "event": "ROLLBACK",
              "desc": "rolls back after health exhaustion"
            },
            {
              "check": "event",
              "event": "ENTER_STATE",
              "contains": [
                "select"
              ],
              "desc": "returns to Select Branch after rollback"
            }
          ]
        }
      ]
    },
    {
      "id": "release_notes",
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "artifacts": {
        "mdscript": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/release_notes/mdscript.md",
        "guidance": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/release_notes/guidance.py",
        "lmql": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/release_notes/lmql.lmql",
        "ell": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/release_notes/ell.py"
      },
      "scenarios": [
        {
          "id": "range_given_all_categories",
          "description": "Range supplied; commits span features, fixes, and chores; no regenerate.",
          "inputs": {
            "git_range": "v1.4.0..HEAD"
          },
          "world": {
            "command_results": {
              "git log": [
                "feat: add export button",
                "fix: correct timezone offset",
                "bug: avoid duplicate rows",
                "docs: update readme",
                "chore: bump deps"
              ]
            },
            "user_answers": {
              "regenerate": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "RUN_COMMAND",
              "contains": [
                "git log"
              ],
              "desc": "collects commits with git log"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "CHANGELOG.md"
              ],
              "desc": "writes CHANGELOG.md"
            },
            {
              "check": "output",
              "key": "sections",
              "contains": [
                "Features"
              ],
              "desc": "has a Features section"
            },
            {
              "check": "output",
              "key": "sections",
              "contains": [
                "Bug Fixes"
              ],
              "desc": "has a Bug Fixes section"
            },
            {
              "check": "output",
              "key": "sections",
              "contains": [
                "Maintenance"
              ],
              "desc": "has a Maintenance section"
            }
          ]
        },
        {
          "id": "infer_range",
          "description": "Range is empty; must infer last-tag..HEAD before collecting commits.",
          "inputs": {
            "git_range": ""
          },
          "world": {
            "command_results": {
              "git describe --tags": "v2.1.0",
              "git log": [
                "feat: new dashboard",
                "fix: login redirect"
              ]
            },
            "user_answers": {
              "regenerate": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "RUN_COMMAND",
              "contains": [
                "tag"
              ],
              "desc": "looks up the most recent tag"
            },
            {
              "check": "event",
              "event": "RUN_COMMAND",
              "contains": [
                "git log"
              ],
              "desc": "collects commits after inferring the range"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "CHANGELOG.md"
              ],
              "desc": "writes CHANGELOG.md"
            }
          ]
        },
        {
          "id": "only_features",
          "description": "All commits are features; only the Features section should be written.",
          "inputs": {
            "git_range": "v3.0.0..HEAD"
          },
          "world": {
            "command_results": {
              "git log": [
                "feat: dark mode",
                "feature: keyboard shortcuts"
              ]
            },
            "user_answers": {
              "regenerate": "no"
            }
          },
          "checks": [
            {
              "check": "output",
              "key": "sections",
              "contains": [
                "Features"
              ],
              "desc": "writes the Features section"
            },
            {
              "check": "output_absent",
              "key": "sections",
              "contains": [
                "Bug Fixes"
              ],
              "desc": "omits the empty Bug Fixes section"
            },
            {
              "check": "output_absent",
              "key": "sections",
              "contains": [
                "Maintenance"
              ],
              "desc": "omits the empty Maintenance section"
            }
          ]
        },
        {
          "id": "regenerate_once",
          "description": "User asks to regenerate once, then stops; the gather/categorize/write cycle must run twice.",
          "inputs": {
            "git_range": "v1.0.0..HEAD"
          },
          "world": {
            "command_results": {
              "git log": [
                "feat: initial release",
                "chore: ci setup"
              ]
            },
            "user_answers": {
              "regenerate": [
                "yes",
                "no"
              ]
            }
          },
          "checks": [
            {
              "check": "count",
              "event": "WRITE_FILE",
              "contains": [
                "CHANGELOG.md"
              ],
              "op": ">=",
              "value": 2,
              "desc": "writes the changelog again on regenerate"
            },
            {
              "check": "event",
              "event": "COMPLETE",
              "desc": "stops after the user declines a second regenerate"
            }
          ]
        }
      ]
    },
    {
      "id": "onboard_service",
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "artifacts": {
        "mdscript": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/onboard_service/mdscript.md",
        "guidance": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/onboard_service/guidance.py",
        "lmql": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/onboard_service/lmql.lmql",
        "ell": "/Users/gabrielwillen/VSCode/mdscript/benchmarks/robust/artifacts/onboard_service/ell.py"
      },
      "scenarios": [
        {
          "id": "kebab_reject_then_fix",
          "description": "Given a non-kebab name, must warn and re-ask before scaffolding.",
          "inputs": {
            "service_name": "Billing Api"
          },
          "world": {
            "user_answers": {
              "service_name": "billing-api",
              "language": "Go",
              "database": "none",
              "messaging": "none",
              "http": "raw server",
              "deploy_target": "Docker Compose",
              "health_endpoint": "yes",
              "initialize_git": "no",
              "run_locally": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "ASK_USER",
              "contains": [
                "kebab"
              ],
              "desc": "warns the name must be kebab-case and re-asks"
            },
            {
              "check": "output",
              "key": "service_name",
              "contains": [
                "billing-api"
              ],
              "desc": "uses the corrected kebab-case name"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "README"
              ],
              "desc": "scaffolds the service README"
            }
          ]
        },
        {
          "id": "go_compose_sqlite_nats",
          "description": "Go + Docker Compose + SQLite + NATS; git no; run no.",
          "inputs": {
            "service_name": "orders"
          },
          "world": {
            "user_answers": {
              "language": "Go",
              "database": "SQLite",
              "messaging": "NATS",
              "http": "raw server",
              "deploy_target": "Docker Compose",
              "health_endpoint": "yes",
              "initialize_git": "no",
              "run_locally": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "docker-compose"
              ],
              "desc": "writes docker-compose.yml for Compose target"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "db"
              ],
              "desc": "adds a database module for SQLite"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "messaging"
              ],
              "desc": "adds a messaging stub for NATS"
            },
            {
              "check": "event_absent",
              "event": "WRITE_FILE",
              "contains": [
                "Dockerfile"
              ],
              "desc": "no Kubernetes Dockerfile for a Compose target"
            },
            {
              "check": "event_absent",
              "event": "WRITE_FILE",
              "contains": [
                "serverless"
              ],
              "desc": "no Lambda serverless.yml for a Compose target"
            },
            {
              "check": "event_absent",
              "event": "GIT_INIT",
              "desc": "does not init git when declined"
            }
          ]
        },
        {
          "id": "ts_k8s_helm_postgres_kafka",
          "description": "TypeScript + Kubernetes (+helm) + PostgreSQL + Kafka; git yes; run no.",
          "inputs": {
            "service_name": "gateway"
          },
          "world": {
            "user_answers": {
              "language": "TypeScript",
              "database": "PostgreSQL",
              "messaging": "Kafka",
              "http": "framework",
              "deploy_target": "Kubernetes",
              "helm": "yes",
              "health_endpoint": "yes",
              "initialize_git": "yes",
              "run_locally": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "Dockerfile"
              ],
              "desc": "writes a Dockerfile for Kubernetes"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "deployment"
              ],
              "desc": "writes a k8s deployment manifest"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "db"
              ],
              "desc": "adds a database module for PostgreSQL"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "messaging"
              ],
              "desc": "adds a messaging stub for Kafka"
            },
            {
              "check": "event",
              "event": "GIT_INIT",
              "desc": "initializes git when requested"
            },
            {
              "check": "event_absent",
              "event": "WRITE_FILE",
              "contains": [
                "docker-compose"
              ],
              "desc": "no Compose file for a Kubernetes target"
            }
          ]
        },
        {
          "id": "rust_lambda_nostack_run",
          "description": "Rust + Lambda (memory 512) + no database + no messaging; git no; run locally yes.",
          "inputs": {
            "service_name": "auth"
          },
          "world": {
            "user_answers": {
              "language": "Rust",
              "database": "none",
              "messaging": "none",
              "http": "raw server",
              "deploy_target": "Lambda",
              "memory_size": "512",
              "health_endpoint": "no",
              "initialize_git": "no",
              "run_locally": "yes"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "ASK_USER",
              "contains": [
                "memory"
              ],
              "desc": "asks for Lambda memory size"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "serverless"
              ],
              "desc": "writes serverless.yml for Lambda"
            },
            {
              "check": "event_absent",
              "event": "WRITE_FILE",
              "contains": [
                "db"
              ],
              "desc": "no database module when none chosen"
            },
            {
              "check": "event_absent",
              "event": "WRITE_FILE",
              "contains": [
                "messaging"
              ],
              "desc": "no messaging stub when none chosen"
            },
            {
              "check": "output",
              "key": "outcome",
              "contains": [
                "run"
              ],
              "desc": "starts the service locally when asked"
            }
          ]
        },
        {
          "id": "custom_runtime",
          "description": "Language 'other' must prompt for a custom runtime.",
          "inputs": {
            "service_name": "edge-fn"
          },
          "world": {
            "user_answers": {
              "language": "other",
              "custom_runtime": "Deno",
              "database": "none",
              "messaging": "none",
              "http": "raw server",
              "deploy_target": "Docker Compose",
              "health_endpoint": "yes",
              "initialize_git": "no",
              "run_locally": "no"
            }
          },
          "checks": [
            {
              "check": "event",
              "event": "ASK_USER",
              "contains": [
                "runtime"
              ],
              "desc": "asks for a custom runtime when language is other"
            },
            {
              "check": "output",
              "key": "language_config",
              "contains": [
                "Deno"
              ],
              "desc": "uses the custom runtime"
            },
            {
              "check": "event",
              "event": "WRITE_FILE",
              "contains": [
                "README"
              ],
              "desc": "scaffolds the service"
            }
          ]
        }
      ]
    }
  ]
}

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
