export const meta = {
  name: 'judge-ollama-traces',
  description: 'Blind claude-sonnet judge over a local model executor\'s traces',
  phases: [ { title: 'Judge', detail: 'blind sonnet scores each produced trace' } ],
}

const CONFIG = {
  "model": "gemma4:e2b",
  "jobs": [
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "happy_path",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch given, all checks pass, deploy succeeds, health passes first try.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "which branch to deploy, set {{branch}}"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow asked the user which branch to deploy."
      }
    },
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "missing_branch",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is empty; workflow must ask for it before doing anything.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "which branch to deploy, set `{{branch}}`"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow asked the user for the branch."
      }
    },
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "main_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is main and the user declines approval; must stop before any checks or deploy.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "ask the user to confirm"
          }
        ],
        "outputs": {},
        "final_outcome": "The deployment of branch main was declined by the user, stopping the process before any checks or deploy."
      }
    },
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "low_coverage_proceed",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user chooses to proceed; deploy then succeeds.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "warn the user that coverage is low\nask whether to proceed anyway"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow proceeded after the user agreed to proceed."
      }
    },
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "low_coverage_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user declines; must cancel before build/deploy.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "ask whether to proceed anyway"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow was aborted because the user declined proceeding despite low coverage."
      }
    },
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "deploy_fails_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Checks pass; first deploy fails (rollback + notify + return to Select Branch); user re-supplies same branch; second deploy succeeds; health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "which branch to deploy, set `{{branch}}`"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow executed successfully, handling a deployment failure and subsequent recovery."
      }
    },
    {
      "system": "mdscript",
      "case": "deploy_branch",
      "scenario": "health_exhausted_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Deploy succeeds but health fails all 3 attempts; rollback + return to Select Branch; second round health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "which branch to deploy, set {{branch}}"
          }
        ],
        "outputs": {},
        "final_outcome": "Deploy succeeds but health fails all 3 attempts; rollback + return to Select Branch; second round health passes."
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "happy_path",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch given, all checks pass, deploy succeeds, health passes first try.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: feature/checkout"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "missing_branch",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is empty; workflow must ask for it before doing anything.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: "
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Deploying main requires approval. Proceed? (yes/no): yes"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run typecheck"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run test -- --coverage"
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 88% is below 80%. Proceed? (yes/no): no"
          },
          {
            "type": "COMPLETE"
          }
        ],
        "outputs": {},
        "final_outcome": "cancelled: low coverage"
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "main_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is main and the user declines approval; must stop before any checks or deploy.",
      "trace": {
        "events": [
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Deploying main requires approval. Proceed?"
          }
        ],
        "outputs": {},
        "final_outcome": "not approved: main deploy declined"
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "low_coverage_proceed",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user chooses to proceed; deploy then succeeds.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Coverage 72% is below 80%. Proceed?"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "low_coverage_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user declines; must cancel before build/deploy.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Coverage 72% is below 80%. Proceed?"
          }
        ],
        "outputs": {},
        "final_outcome": "cancelled: low coverage"
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "deploy_fails_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Checks pass; first deploy fails (rollback + notify + return to Select Branch); user re-supplies same branch; second deploy succeeds; health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: feature/payments"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "guidance",
      "case": "deploy_branch",
      "scenario": "health_exhausted_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Deploy succeeds but health fails all 3 attempts; rollback + return to Select Branch; second round health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: "
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 85% is below 80%. Proceed?"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run typecheck"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run test -- --coverage"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run build"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "deploy dist/feature-search-YYYYMMDDHHMMSS.tar.gz staging"
          },
          {
            "type": "NOTIFY",
            "detail": "deployed dist/feature-search-YYYYMMDDHHMMSS.tar.gz to staging"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "curl -fsS https://staging.example.test/health"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "curl -fsS https://staging.example.test/health"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "curl -fsS https://staging.example.test/health"
          },
          {
            "type": "ROLLBACK",
            "detail": "rollback --previous"
          },
          {
            "type": "NOTIFY",
            "detail": "health checks failed, rolled back"
          },
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: "
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "curl -fsS https://staging.example.test/health"
          },
          {
            "type": "ENTER_STATE",
            "detail": "select"
          },
          {
            "type": "COMPLETE",
            "detail": "deploy complete"
          }
        ]
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "happy_path",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch given, all checks pass, deploy succeeds, health passes first try.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "npm run typecheck"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run test -- --coverage"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run build"
          },
          {
            "type": "NOTIFY",
            "detail": "deployed dist/feature-checkout-2024-01-01T00:00:00.tar.gz to staging"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "missing_branch",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is empty; workflow must ask for it before doing anything.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy?"
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 88% is below 80%. Proceed?"
          },
          {
            "type": "COMPLETE",
            "detail": "deploy complete"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "main_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is main and the user declines approval; must stop before any checks or deploy.",
      "trace": {
        "events": [
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Deploying main requires approval. Proceed?"
          },
          {
            "type": "ABORT",
            "detail": "not approved: main deploy declined"
          }
        ],
        "outputs": {},
        "final_outcome": "not approved: main deploy declined"
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "low_coverage_proceed",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user chooses to proceed; deploy then succeeds.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy?"
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 72% is below 80%. Proceed?"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "low_coverage_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user declines; must cancel before build/deploy.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy?"
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 72% is below 80%. Proceed?"
          },
          {
            "type": "ABORT",
            "detail": "cancelled: low coverage"
          }
        ],
        "outputs": {},
        "final_outcome": "cancelled: low coverage"
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "deploy_fails_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Checks pass; first deploy fails (rollback + notify + return to Select Branch); user re-supplies same branch; second deploy succeeds; health passes.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "npm run typecheck"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run test -- --coverage"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run build"
          },
          {
            "type": "ROLLBACK",
            "detail": ""
          },
          {
            "type": "NOTIFY",
            "detail": "deploy failed, rolled back"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run typecheck"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run test -- --coverage"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run build"
          },
          {
            "type": "NOTIFY",
            "detail": "deployed dist/feature-payments-*.tar.gz to staging"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "https://staging.example.test/health"
          },
          {
            "type": "COMPLETE",
            "detail": ""
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "lmql",
      "case": "deploy_branch",
      "scenario": "health_exhausted_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Deploy succeeds but health fails all 3 attempts; rollback + return to Select Branch; second round health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy?"
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 85% is below 80%. Proceed?"
          },
          {
            "type": "NOTIFY",
            "detail": "deployed dist/feature-search-*.tar.gz to staging"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "https://staging.example.test/health"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "https://staging.example.test/health"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "https://staging.example.test/health"
          },
          {
            "type": "ROLLBACK",
            "detail": "health checks failed, rolled back"
          },
          {
            "type": "NOTIFY",
            "detail": "health checks failed, rolled back"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "happy_path",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch given, all checks pass, deploy succeeds, health passes first try.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: feature/checkout"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "missing_branch",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is empty; workflow must ask for it before doing anything.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: "
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "main_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Branch is main and the user declines approval; must stop before any checks or deploy.",
      "trace": {
        "events": [
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Deploying main requires approval. Proceed?"
          }
        ],
        "outputs": {},
        "final_outcome": "not approved: main deploy declined"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "low_coverage_proceed",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user chooses to proceed; deploy then succeeds.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: "
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 72% is below 80%. Proceed?"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run typecheck"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run test -- --coverage"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "npm run build"
          },
          {
            "type": "NOTIFY",
            "detail": "deployed dist/feature-reports-YYYYMMDDHHMMSS.tar.gz to staging"
          },
          {
            "type": "HEALTH_CHECK",
            "detail": "curl -fsS https://staging.example.test/health"
          },
          {
            "type": "ROLLBACK",
            "detail": "rollback --previous"
          },
          {
            "type": "NOTIFY",
            "detail": "health checks failed, rolled back"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "low_coverage_declined",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Coverage below 80%; user declines; must cancel before build/deploy.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: "
          },
          {
            "type": "REQUEST_CONFIRMATION",
            "detail": "Coverage 72% is below 80%. Proceed?"
          },
          {
            "type": "ABORT",
            "detail": "cancelled: low coverage"
          }
        ],
        "outputs": {},
        "final_outcome": "cancelled: low coverage"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "deploy_fails_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Checks pass; first deploy fails (rollback + notify + return to Select Branch); user re-supplies same branch; second deploy succeeds; health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: feature/payments"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "ell",
      "case": "deploy_branch",
      "scenario": "health_exhausted_then_recovers",
      "repeat": 1,
      "goal": "Deploy a branch to an environment after checks, then verify health.",
      "desc": "Deploy succeeds but health fails all 3 attempts; rollback + return to Select Branch; second round health passes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Branch to deploy: feature/search"
          }
        ],
        "outputs": {},
        "final_outcome": "deploy complete"
      }
    },
    {
      "system": "mdscript",
      "case": "release_notes",
      "scenario": "range_given_all_categories",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range supplied; commits span features, fixes, and chores; no regenerate.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log v1.4.0..HEAD"
          }
        ],
        "outputs": {
          "commits": [
            "feat: add export button",
            "fix: correct timezone offset",
            "bug: avoid duplicate rows",
            "docs: update readme",
            "chore: bump deps"
          ]
        },
        "final_outcome": "CHANGELOG.md is written."
      }
    },
    {
      "system": "mdscript",
      "case": "release_notes",
      "scenario": "infer_range",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range is empty; must infer last-tag..HEAD before collecting commits.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log v2.1.0..HEAD"
          }
        ],
        "outputs": {},
        "final_outcome": "The script executed the commands and generated the CHANGELOG.md file without regeneration."
      }
    },
    {
      "system": "mdscript",
      "case": "release_notes",
      "scenario": "only_features",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "All commits are features; only the Features section should be written.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log v3.0.0..HEAD"
          }
        ],
        "outputs": {
          "commits": [
            "feat: dark mode",
            "feature: keyboard shortcuts"
          ]
        },
        "final_outcome": "The changelog is written, omitting the Bug Fixes and Maintenance sections."
      }
    },
    {
      "system": "mdscript",
      "case": "release_notes",
      "scenario": "regenerate_once",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "User asks to regenerate once, then stops; the gather/categorize/write cycle must run twice.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log v1.0.0..HEAD"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow executed the 'Gather Changes' state, which involved running `git log` and collecting commit subjects into `commits`. Then it proceeded to generate notes, writing the content to CHANGELOG.md, and finally asked the user whether to regenerate. Since the user answered 'no', the process stopped after writing the changelog once."
      }
    },
    {
      "system": "guidance",
      "case": "release_notes",
      "scenario": "range_given_all_categories",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range supplied; commits span features, fixes, and chores; no regenerate.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log"
          },
          {
            "type": "WRITE_FILE",
            "detail": "CHANGELOG.md"
          }
        ],
        "outputs": {
          "sections": [
            "Features",
            "Bug Fixes",
            "Maintenance"
          ]
        },
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "guidance",
      "case": "release_notes",
      "scenario": "infer_range",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range is empty; must infer last-tag..HEAD before collecting commits.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git describe --tags"
          }
        ],
        "outputs": {},
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "guidance",
      "case": "release_notes",
      "scenario": "only_features",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "All commits are features; only the Features section should be written.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log --pretty=%s v3.0.0..HEAD"
          }
        ],
        "outputs": {
          "sections": [
            "Features"
          ]
        },
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "guidance",
      "case": "release_notes",
      "scenario": "regenerate_once",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "User asks to regenerate once, then stops; the gather/categorize/write cycle must run twice.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git describe --tags --abbrev=0"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "git log --pretty=%s v1.0.0..HEAD"
          }
        ],
        "outputs": {},
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "lmql",
      "case": "release_notes",
      "scenario": "range_given_all_categories",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range supplied; commits span features, fixes, and chores; no regenerate.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log"
          }
        ],
        "outputs": {
          "sections": [
            "Features",
            "Bug Fixes",
            "Maintenance"
          ]
        },
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "lmql",
      "case": "release_notes",
      "scenario": "infer_range",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range is empty; must infer last-tag..HEAD before collecting commits.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git describe --tags"
          }
        ],
        "outputs": {},
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "lmql",
      "case": "release_notes",
      "scenario": "only_features",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "All commits are features; only the Features section should be written.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log --pretty=%s v3.0.0..HEAD"
          }
        ],
        "outputs": {
          "sections": [
            "Features"
          ]
        },
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "lmql",
      "case": "release_notes",
      "scenario": "regenerate_once",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "User asks to regenerate once, then stops; the gather/categorize/write cycle must run twice.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git describe --tags --abbrev=0"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "git log --pretty=%s v1.0.0..HEAD"
          }
        ],
        "outputs": {},
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "ell",
      "case": "release_notes",
      "scenario": "range_given_all_categories",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range supplied; commits span features, fixes, and chores; no regenerate.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log"
          },
          {
            "type": "WRITE_FILE",
            "detail": "CHANGELOG.md"
          }
        ],
        "outputs": {
          "sections": [
            "Features",
            "Bug Fixes",
            "Maintenance"
          ]
        },
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "ell",
      "case": "release_notes",
      "scenario": "infer_range",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "Range is empty; must infer last-tag..HEAD before collecting commits.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git describe --tags"
          }
        ],
        "outputs": {},
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "ell",
      "case": "release_notes",
      "scenario": "only_features",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "All commits are features; only the Features section should be written.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git log --pretty=%s v3.0.0..HEAD"
          }
        ],
        "outputs": {
          "sections": [
            "Features"
          ]
        },
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "ell",
      "case": "release_notes",
      "scenario": "regenerate_once",
      "repeat": 1,
      "goal": "Collect commits in a range, categorize them, and write CHANGELOG.md.",
      "desc": "User asks to regenerate once, then stops; the gather/categorize/write cycle must run twice.",
      "trace": {
        "events": [
          {
            "type": "RUN_COMMAND",
            "detail": "git describe --tags --abbrev=0..HEAD"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "git log --pretty=%s v1.0.0..HEAD"
          }
        ],
        "outputs": {},
        "final_outcome": "CHANGELOG.md written"
      }
    },
    {
      "system": "mdscript",
      "case": "onboard_service",
      "scenario": "kebab_reject_then_fix",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Given a non-kebab name, must warn and re-ask before scaffolding.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "warn that the name must be kebab-case\nask for a kebab-case name and set `{{service_name}}`"
          }
        ],
        "outputs": {
          "service_name": "billing-api"
        },
        "final_outcome": "The service name was corrected to 'billing-api' after prompting the user."
      }
    },
    {
      "system": "mdscript",
      "case": "onboard_service",
      "scenario": "go_compose_sqlite_nats",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Go + Docker Compose + SQLite + NATS; git no; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "ask the user for a service name, set `{{service_name}}'"
          },
          {
            "type": "ASK_USER",
            "detail": "ask the user for a language: Go, TypeScript, Rust, or other"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for a database: PostgreSQL, SQLite, or none, and set `{{database}}`"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for messaging: Kafka, NATS, or none, and set `{{messaging}}`"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether to use an HTTP framework or a raw server"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for a deployment target: Kubernetes, Lambda, or Docker Compose, and set `{{deploy_target}}`"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether a Helm chart is needed"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for `{{memory_size}}` in MB"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether the service exposes a health endpoint"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether to initialize git"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether to run the service locally now"
          }
        ],
        "outputs": {},
        "final_outcome": "The workflow prompted the user for all necessary configuration details based on the provided scenario."
      }
    },
    {
      "system": "mdscript",
      "case": "onboard_service",
      "scenario": "ts_k8s_helm_postgres_kafka",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "TypeScript + Kubernetes (+helm) + PostgreSQL + Kafka; git yes; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "ask the user for a service name, set `{{service_name}}'"
          },
          {
            "type": "ASK_USER",
            "detail": "ask the user for a language: Go, TypeScript, Rust, or other"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for a database: PostgreSQL, SQLite, or none, and set `{{database}}`"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for messaging: Kafka, NATS, or none, and set `{{messaging}}`"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for a deployment target: Kubernetes, Lambda, or Docker Compose, and set `{{deploy_target}}`"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether a Helm chart is needed"
          },
          {
            "type": "ASK_USER",
            "detail": "ask for `{{memory_size}}` in MB"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether the service exposes a health endpoint"
          },
          {
            "type": "ASK_USER",
            "detail": "ask whether to initialize git"
          }
        ]
      }
    },
    {
      "system": "mdscript",
      "case": "onboard_service",
      "scenario": "rust_lambda_nostack_run",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Rust + Lambda (memory 512) + no database + no messaging; git no; run locally yes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "ask for a service name, set {{service_name}}"
          }
        ],
        "outputs": {
          "service_name": "auth"
        },
        "final_outcome": "ASK_USER"
      }
    },
    {
      "system": "mdscript",
      "case": "onboard_service",
      "scenario": "custom_runtime",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Language 'other' must prompt for a custom runtime.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "ask the user for a language: Go, TypeScript, Rust, or other\n  * if other, ask for a custom runtime\n    * ask for a custom runtime"
          }
        ]
      }
    },
    {
      "system": "guidance",
      "case": "onboard_service",
      "scenario": "kebab_reject_then_fix",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Given a non-kebab name, must warn and re-ask before scaffolding.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name must be kebab-case."
          }
        ],
        "outputs": {
          "service_name": "billing-api"
        },
        "final_outcome": "scaffolded services/billing-api: Go, db=none, mq=none, deploy=Docker Compose"
      }
    },
    {
      "system": "guidance",
      "case": "onboard_service",
      "scenario": "go_compose_sqlite_nats",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Go + Docker Compose + SQLite + NATS; git no; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "choice",
            "detail": "Docker Compose"
          }
        ],
        "outputs": {
          "service_name": "orders",
          "language_config": "Go",
          "database": "SQLite",
          "messaging": "NATS",
          "deploy_target": "Docker Compose"
        },
        "final_outcome": "scaffolded services/orders: Go, db=SQLite, mq=NATS, deploy=Docker Compose"
      }
    },
    {
      "system": "guidance",
      "case": "onboard_service",
      "scenario": "ts_k8s_helm_postgres_kafka",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "TypeScript + Kubernetes (+helm) + PostgreSQL + Kafka; git yes; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "choice",
            "detail": "Kubernetes"
          },
          {
            "type": "choice",
            "detail": "yes"
          },
          {
            "type": "choice",
            "detail": "yes"
          },
          {
            "type": "choice",
            "detail": "yes"
          },
          {
            "type": "choice",
            "detail": "yes"
          },
          {
            "type": "choice",
            "detail": "no"
          }
        ],
        "outputs": {
          "service_name": "gateway",
          "language_config": "TypeScript",
          "database": "PostgreSQL",
          "messaging": "Kafka",
          "deploy_target": "Kubernetes",
          "helm": "yes",
          "memory_size": null,
          "health": "yes"
        },
        "final_outcome": "scaffolded services/gateway: TypeScript, db=PostgreSQL, mq=Kafka, deploy=Kubernetes"
      }
    },
    {
      "system": "guidance",
      "case": "onboard_service",
      "scenario": "rust_lambda_nostack_run",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Rust + Lambda (memory 512) + no database + no messaging; git no; run locally yes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "PICK",
            "detail": "choice: Lambda"
          },
          {
            "type": "PICK",
            "detail": "choice: none"
          },
          {
            "type": "PICK",
            "detail": "choice: raw server"
          },
          {
            "type": "PICK",
            "detail": "choice: Lambda"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "no"
          },
          {
            "type": "PICK",
            "detail": "choice: no"
          },
          {
            "type": "PICK",
            "detail": "choice: no"
          },
          {
            "type": "PICK",
            "detail": "choice: no"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/auth/README.md"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/auth/serverless.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/auth/docker-compose.yml"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "cargo build --release --target x86_64-unknown-linux-musl"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "cargo run --release"
          },
          {
            "type": "outcome",
            "detail": "running in development mode"
          }
        ],
        "outputs": {},
        "final_outcome": "running in development mode"
      }
    },
    {
      "system": "guidance",
      "case": "onboard_service",
      "scenario": "custom_runtime",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Language 'other' must prompt for a custom runtime.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "ASK_USER",
            "detail": "Custom runtime?"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "Initialize git?"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now?"
          }
        ],
        "outputs": {
          "service_name": "edge-fn",
          "language_config": "Deno",
          "database": "none",
          "messaging": "none",
          "http": "raw server",
          "deploy_target": "Docker Compose",
          "health": "yes",
          "initialize_git": "no",
          "run_locally": "no"
        },
        "final_outcome": "scaffolded services/edge-fn: Deno, db=none, mq=none, deploy=Docker Compose"
      }
    },
    {
      "system": "lmql",
      "case": "onboard_service",
      "scenario": "kebab_reject_then_fix",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Given a non-kebab name, must warn and re-ask before scaffolding.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "ASK_USER",
            "detail": "Database?"
          },
          {
            "type": "ASK_USER",
            "detail": "Messaging?"
          },
          {
            "type": "ASK_USER",
            "detail": "HTTP layer?"
          },
          {
            "type": "ASK_USER",
            "detail": "Deploy target?"
          },
          {
            "type": "ASK_USER",
            "detail": "Helm chart?"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "Expose a health endpoint?"
          },
          {
            "type": "ASK_USER",
            "detail": "Initialize git?"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now?"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/README.md"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/go",
            "output": "Runtime: Go"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/docker-compose.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/serverless.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/dockerfile.go"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/db.py"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/billing-api/messaging.py"
          }
        ],
        "outputs": {},
        "final_outcome": "scaffolded services/billing-api: Go, db=none, mq=none, deploy=Docker Compose"
      }
    },
    {
      "system": "lmql",
      "case": "onboard_service",
      "scenario": "go_compose_sqlite_nats",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Go + Docker Compose + SQLite + NATS; git no; run no.",
      "trace": {
        "events": [
          {
            "type": "WRITE_FILE",
            "detail": "services/orders/README.md: # orders\n\nRuntime: Go\n"
          }
        ],
        "outputs": {},
        "final_outcome": "scaffolded services/orders: Go, db=SQLite, mq=NATS, deploy=Docker Compose"
      }
    },
    {
      "system": "lmql",
      "case": "onboard_service",
      "scenario": "ts_k8s_helm_postgres_kafka",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "TypeScript + Kubernetes (+helm) + PostgreSQL + Kafka; git yes; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "ASK_USER",
            "detail": "Database?"
          },
          {
            "type": "ASK_USER",
            "detail": "Messaging?"
          },
          {
            "type": "ASK_USER",
            "detail": "HTTP layer?"
          },
          {
            "type": "ASK_USER",
            "detail": "Deploy target?"
          },
          {
            "type": "ASK_USER",
            "detail": "Helm chart?"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "Expose a health endpoint?"
          },
          {
            "type": "ASK_USER",
            "detail": "Initialize git?"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now?"
          }
        ],
        "outputs": {},
        "final_outcome": "scaffolded services/gateway: TypeScript, db=PostgreSQL, mq=Kafka, deploy=Kubernetes"
      }
    },
    {
      "system": "lmql",
      "case": "onboard_service",
      "scenario": "rust_lambda_nostack_run",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Rust + Lambda (memory 512) + no database + no messaging; git no; run locally yes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "Expose a health endpoint?"
          },
          {
            "type": "ASK_USER",
            "detail": "Initialize git?"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now?"
          }
        ],
        "outputs": {},
        "final_outcome": "running in development mode"
      }
    },
    {
      "system": "lmql",
      "case": "onboard_service",
      "scenario": "custom_runtime",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Language 'other' must prompt for a custom runtime.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "ASK_USER",
            "detail": "Custom runtime?"
          },
          {
            "type": "ASK_USER",
            "detail": "Database?"
          },
          {
            "type": "ASK_USER",
            "detail": "Messaging?"
          },
          {
            "type": "ASK_USER",
            "detail": "HTTP layer?"
          },
          {
            "type": "ASK_USER",
            "detail": "Deploy target?"
          },
          {
            "type": "ASK_USER",
            "detail": "Helm chart?"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "Expose a health endpoint?"
          },
          {
            "type": "ASK_USER",
            "detail": "Initialize git?"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now?"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/README.md"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/deno",
            "output": "Deno"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/docker-compose.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/docker-compose.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/serverless.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/docker-compose.yml"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/db.py"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/edge-fn/messaging.py"
          }
        ],
        "outputs": {
          "language_config": "Deno",
          "database": "none",
          "messaging": "none",
          "deploy_target": "Docker Compose"
        },
        "final_outcome": "scaffolded services/edge-fn: Deno, db=none, mq=none, deploy=Docker Compose"
      }
    },
    {
      "system": "ell",
      "case": "onboard_service",
      "scenario": "kebab_reject_then_fix",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Given a non-kebab name, must warn and re-ask before scaffolding.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name must be kebab-case."
          }
        ],
        "outputs": {
          "service_name": "billing-api"
        },
        "final_outcome": "scaffolded services/billing-api: Go, db=none, mq=none, deploy=Docker Compose"
      }
    },
    {
      "system": "ell",
      "case": "onboard_service",
      "scenario": "go_compose_sqlite_nats",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Go + Docker Compose + SQLite + NATS; git no; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "PICK",
            "detail": "Language? Options: Go, TypeScript, Rust, other"
          },
          {
            "type": "PICK",
            "detail": "Database? Options: PostgreSQL, SQLite, none"
          },
          {
            "type": "PICK",
            "detail": "Messaging? Options: Kafka, NATS, none"
          },
          {
            "type": "PICK",
            "detail": "HTTP layer? Options: framework, raw server"
          },
          {
            "type": "PICK",
            "detail": "Deploy target? Options: Kubernetes, Lambda, Docker Compose"
          },
          {
            "type": "PICK",
            "detail": "Helm chart? Options: yes, no"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "PICK",
            "detail": "Expose a health endpoint? Options: yes, no"
          },
          {
            "type": "PICK",
            "detail": "Initialize git? Options: yes, no"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now? Options: yes, no"
          }
        ],
        "outputs": {},
        "final_outcome": "scaffolded services/orders: Go, db=SQLite, mq=NATS, deploy=Docker Compose"
      }
    },
    {
      "system": "ell",
      "case": "onboard_service",
      "scenario": "ts_k8s_helm_postgres_kafka",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "TypeScript + Kubernetes (+helm) + PostgreSQL + Kafka; git yes; run no.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "PICK",
            "detail": "Language? Options: Go, TypeScript, Rust, other"
          },
          {
            "type": "PICK",
            "detail": "Database? Options: PostgreSQL, SQLite, none"
          },
          {
            "type": "PICK",
            "detail": "Messaging? Options: Kafka, NATS, none"
          },
          {
            "type": "PICK",
            "detail": "HTTP layer? Options: framework, raw server"
          },
          {
            "type": "PICK",
            "detail": "Deploy target? Options: Kubernetes, Lambda, Docker Compose"
          },
          {
            "type": "PICK",
            "detail": "Helm chart? Options: yes, no"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "PICK",
            "detail": "Expose a health endpoint? Options: yes, no"
          },
          {
            "type": "PICK",
            "detail": "Initialize git? Options: yes, no"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now? Options: yes, no"
          }
        ],
        "outputs": {},
        "final_outcome": "scaffolded services/gateway: TypeScript, db=PostgreSQL, mq=Kafka, deploy=Kubernetes"
      }
    },
    {
      "system": "ell",
      "case": "onboard_service",
      "scenario": "rust_lambda_nostack_run",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Rust + Lambda (memory 512) + no database + no messaging; git no; run locally yes.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "PICK",
            "detail": "Language? Options: Go, TypeScript, Rust, other"
          },
          {
            "type": "ASK_USER",
            "detail": "Custom runtime?"
          },
          {
            "type": "PICK",
            "detail": "Database? Options: PostgreSQL, SQLite, none"
          },
          {
            "type": "PICK",
            "detail": "Messaging? Options: Kafka, NATS, none"
          },
          {
            "type": "PICK",
            "detail": "HTTP layer? Options: framework, raw server"
          },
          {
            "type": "PICK",
            "detail": "Deploy target? Options: Kubernetes, Lambda, Docker Compose"
          },
          {
            "type": "PICK",
            "detail": "Helm chart? Options: yes, no"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "PICK",
            "detail": "Expose a health endpoint? Options: yes, no"
          },
          {
            "type": "PICK",
            "detail": "Initialize git? Options: yes, no"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now? Options: yes, no"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "rust"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/auth/README.md"
          },
          {
            "type": "WRITE_FILE",
            "detail": "services/auth/lambda/serverless.yml"
          },
          {
            "type": "RUN_COMMAND",
            "detail": "cargo run"
          }
        ],
        "outputs": {
          "outcome": "running in development mode"
        },
        "final_outcome": "scaffolded services/auth: Rust, db=none, mq=none, deploy=Lambda"
      }
    },
    {
      "system": "ell",
      "case": "onboard_service",
      "scenario": "custom_runtime",
      "repeat": 1,
      "goal": "Interactively scaffold a new service from language, stack, and deployment choices.",
      "desc": "Language 'other' must prompt for a custom runtime.",
      "trace": {
        "events": [
          {
            "type": "ASK_USER",
            "detail": "Service name?"
          },
          {
            "type": "ASK_USER",
            "detail": "Custom runtime?"
          },
          {
            "type": "ASK_USER",
            "detail": "Lambda memory (MB)?"
          },
          {
            "type": "ASK_USER",
            "detail": "Initialize git?"
          },
          {
            "type": "ASK_USER",
            "detail": "Run the service locally now?"
          }
        ],
        "outputs": {
          "service_name": "edge-fn",
          "language_config": "Deno",
          "database": "none",
          "messaging": "none",
          "http": "raw server",
          "deploy_target": "Docker Compose",
          "health": "yes",
          "initialize_git": "no",
          "run_locally": "no"
        },
        "final_outcome": "scaffolded services/edge-fn: Deno, db=none, mq=none, deploy=Docker Compose"
      }
    }
  ]
}
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
