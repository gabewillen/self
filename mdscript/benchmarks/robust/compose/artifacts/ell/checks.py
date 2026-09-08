"""Reusable check gate (shared module)."""

import subprocess

import ell


@ell.simple(model="gpt-4o")
def confirm(question: str) -> str:
    """Answer strictly 'yes' or 'no'."""
    return question


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


def run_checks(state):
    if sh("npm run typecheck").returncode:
        state["checks_ok"] = False
        state["reason"] = "type errors"
        return state
    cov = read_coverage(sh("npm run test -- --coverage").stdout)
    if cov < 80 and not confirm(f"Coverage {cov}% is below 80%. Proceed?").strip().lower().startswith("y"):
        state["checks_ok"] = False
        state["reason"] = "checks did not pass"
        return state
    state["coverage"] = cov
    state["checks_ok"] = True
    return state
