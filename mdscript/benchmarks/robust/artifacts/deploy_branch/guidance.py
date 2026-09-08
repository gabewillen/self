"""Deploy a branch to an environment after checks, then verify health.

Idiomatic Guidance: deterministic orchestration in Python; the model is used
through guidance `select` only for the human-in-the-loop confirmations.
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


def yes(question):
    return (lm + confirm(question))["answer"] == "yes"


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


def deploy_branch(branch="", environment="staging", deploy_url=""):
    # Select Branch
    while not branch:
        branch = input("Branch to deploy: ").strip()
    if branch == "main":
        if not yes("Deploying main requires approval. Proceed?"):
            return "not approved: main deploy declined"

    # Run Checks (a failed build loops back through here)
    while True:
        if sh("npm run typecheck").returncode:
            return "stopped: type errors"
        coverage = read_coverage(sh("npm run test -- --coverage").stdout)
        if coverage < 80 and not yes(f"Coverage {coverage}% is below 80%. Proceed?"):
            return "cancelled: low coverage"
        if sh("npm run build").returncode == 0:
            break  # build ok -> leave the checks/build loop

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
