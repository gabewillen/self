"""Deploy a branch to an environment after checks, then verify health.

Idiomatic ell: the model boundary is a small Language Model Program (`confirm`);
the workflow itself is ordinary, explicit Python.
"""

import subprocess
from datetime import datetime, timezone

import ell


@ell.simple(model="gpt-4o")
def confirm(question: str) -> str:
    """Answer strictly 'yes' or 'no'."""
    return question


def yes(question):
    return confirm(question).strip().lower().startswith("y")


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


def deploy_branch(branch="", environment="staging", deploy_url=""):
    # Select Branch
    while not branch:
        branch = input("Branch to deploy: ").strip()
    if branch == "main" and not yes("Deploying main requires approval. Proceed?"):
        return "not approved: main deploy declined"

    # Run Checks (a failed build loops back through here)
    while True:
        if sh("npm run typecheck").returncode:
            return "stopped: type errors"
        coverage = read_coverage(sh("npm run test -- --coverage").stdout)
        if coverage < 80 and not yes(f"Coverage {coverage}% is below 80%. Proceed?"):
            return "cancelled: low coverage"
        if sh("npm run build").returncode == 0:
            break

    # Build Artifact
    slug = branch.replace("/", "-")
    artifact = f"dist/{slug}-{datetime.now(timezone.utc):%Y%m%d%H%M%S}.tar.gz"

    # Deploy
    if sh(f"deploy {artifact} {environment}").returncode:
        sh("rollback --previous")
        notify_team("deploy failed, rolled back")
        return deploy_branch("", environment, deploy_url)  # back to Select Branch
    notify_team(f"deployed {artifact} to {environment}")

    # Verify Deployment
    for _ in range(3):
        if sh(f"curl -fsS {deploy_url}/health").returncode == 0:
            return "deploy complete"
    sh("rollback --previous")
    notify_team("health checks failed, rolled back")
    return deploy_branch("", environment, deploy_url)  # back to Select Branch
