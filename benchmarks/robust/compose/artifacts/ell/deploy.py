"""Reusable deploy + verify step (shared module).

Expects state with `artifact`, `environment`, `deploy_url`.
"""

import subprocess


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


def deploy(state):
    if sh(f"deploy {state['artifact']} {state['environment']}").returncode:
        sh("rollback --previous")
        notify_team("deploy failed, rolled back")
        state["result"] = "deploy failed"
        return state
    notify_team(f"deployed {state['artifact']} to {state['environment']}")
    for _ in range(3):
        if sh(f"curl -fsS {state['deploy_url']}/health").returncode == 0:
            state["result"] = "deploy complete"
            return state
    sh("rollback --previous")
    notify_team("health checks failed, rolled back")
    state["result"] = "rolled back after failed health checks"
    return state
