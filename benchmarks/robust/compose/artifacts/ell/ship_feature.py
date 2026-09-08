"""Ship a feature branch to staging. Composes the shared check + deploy modules."""

import subprocess
from datetime import datetime, timezone

from checks import run_checks
from deploy import deploy


def ship_feature(branch=""):
    # Select Branch
    while not branch:
        branch = input("Feature branch to deploy: ").strip()

    # Checks (shared)
    state = {"branch": branch}
    state = run_checks(state)
    if not state["checks_ok"]:
        return f"stopped: {state['reason']}"

    # Build
    if subprocess.run("npm run build", shell=True).returncode:
        return "stopped: build error"
    slug = branch.replace("/", "-")
    state["artifact"] = f"dist/{slug}-{datetime.now(timezone.utc):%Y%m%d%H%M%S}.tar.gz"

    # Deploy (shared)
    state["environment"] = "staging"
    state["deploy_url"] = "https://staging.example.test"
    return deploy(state)
