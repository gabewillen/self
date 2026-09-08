"""Deploy a branch. RELAY-ENABLED form.

To let another agent dispatch execution to an arbitrary state (and resume with
injected variables), the linear workflow has to be refactored: every state
becomes an independently-callable function over a shared `state` dict, and a
dispatch table maps a public anchor name to its function. The `enter()` function
is the call surface another agent uses. None of this is needed to run the
workflow start-to-finish; it exists only to make states addressable.
"""

import subprocess
from datetime import datetime, timezone

import guidance
from guidance import models, select

lm = models.OpenAI("gpt-4o")


@guidance
def confirm(lm, question):
    lm += f"{question} (yes/no): " + select(["yes", "no"], name="answer")
    return lm


def yes(q):
    return (lm + confirm(q))["answer"] == "yes"


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


# --- states, each independently entrant over a shared dict ---

def select_branch(state):
    while not state.get("branch"):
        state["branch"] = input("Branch to deploy: ").strip()
    if state["branch"] == "main" and not yes("Deploying main requires approval. Proceed?"):
        state["next"] = None
        state["result"] = "not approved"
        return state
    state["next"] = "run-checks"
    return state


def run_checks(state):
    if sh("npm run typecheck").returncode:
        state["next"] = None
        state["result"] = "type errors"
        return state
    cov = read_coverage(sh("npm run test -- --coverage").stdout)
    if cov < 80 and not yes(f"Coverage {cov}% is below 80%. Proceed?"):
        state["next"] = None
        state["result"] = "cancelled: low coverage"
        return state
    state["coverage"] = cov
    state["next"] = "build-artifact"
    return state


def build_artifact(state):
    if sh("npm run build").returncode:
        state["next"] = "run-checks"  # loop back
        return state
    slug = state["branch"].replace("/", "-")
    state["artifact"] = f"dist/{slug}-{datetime.now(timezone.utc):%Y%m%d%H%M%S}.tar.gz"
    state["next"] = "deploy"
    return state


def deploy(state):
    if sh(f"deploy {state['artifact']} {state.get('environment', 'staging')}").returncode:
        sh("rollback --previous")
        notify_team("deploy failed, rolled back")
        state["next"] = "select-branch"
        return state
    notify_team(f"deployed {state['artifact']}")
    state["next"] = "verify-deployment"
    return state


def verify_deployment(state):
    for _ in range(3):
        if sh(f"curl -fsS {state.get('deploy_url', '')}/health").returncode == 0:
            state["next"] = None
            state["result"] = "deploy complete"
            return state
    sh("rollback --previous")
    notify_team("health checks failed, rolled back")
    state["next"] = "select-branch"
    return state


# --- dispatch surface another agent calls ---

STATES = {
    "select-branch": select_branch,
    "run-checks": run_checks,
    "build-artifact": build_artifact,
    "deploy": deploy,
    "verify-deployment": verify_deployment,
}


def enter(anchor, state=None):
    """Resume execution at `anchor` with caller-supplied state."""
    if anchor not in STATES:
        raise KeyError(f"no such state: {anchor}; known: {list(STATES)}")
    return STATES[anchor](dict(state or {}))
