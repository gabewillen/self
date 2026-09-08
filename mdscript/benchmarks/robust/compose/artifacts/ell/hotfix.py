"""Ship a hotfix to production. Composes the shared check + deploy modules."""

import subprocess
from datetime import datetime, timezone

import ell

from checks import run_checks
from deploy import deploy


@ell.simple(model="gpt-4o")
def confirm(question: str) -> str:
    """Answer strictly 'yes' or 'no'."""
    return question


def hotfix(branch=""):
    # Confirm
    if not confirm("This deploys a hotfix straight to production. Proceed?").strip().lower().startswith("y"):
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
