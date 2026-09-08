"""Ship a hotfix to production. Composes the shared check + deploy modules."""

import subprocess
from datetime import datetime, timezone

import guidance
from guidance import models, select

from checks import run_checks
from deploy import deploy

lm = models.OpenAI("gpt-4o")


@guidance
def confirm(lm, question):
    lm += f"{question} (yes/no): " + select(["yes", "no"], name="answer")
    return lm


def hotfix(branch=""):
    # Confirm
    if (lm + confirm("This deploys a hotfix straight to production. Proceed?"))["answer"] == "no":
        return "cancelled: hotfix declined"

    # Checks (shared)
    state = {"branch": branch}
    state = run_checks(state)
    if not state["checks_ok"]:
        return f"stopped: {state['reason']}"

    # Build
    if subprocess.run("npm run build", shell=True).returncode:
        return "stopped: build error"
    slug = branch.replace("/", "-")
    state["artifact"] = f"dist/{slug}-hotfix-{datetime.now(timezone.utc):%Y%m%d%H%M%S}.tar.gz"

    # Deploy (shared)
    state["environment"] = "production"
    state["deploy_url"] = "https://prod.example.test"
    return deploy(state)
